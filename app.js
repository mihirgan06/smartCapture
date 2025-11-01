let currentImage = null;
let apiKey = localStorage.getItem('openai_api_key') || '';

const $ = id => document.getElementById(id);

document.addEventListener('DOMContentLoaded', () => {
    const apiKeySection = $('apiKeySection');
    if (!apiKey && apiKeySection) {
        apiKeySection.classList.remove('hidden');
    }
    
    const browseBtn = $('browseBtn');
    const fileInput = $('fileInput');
    const uploadArea = $('uploadArea');
    const pasteBtn = $('pasteBtn');
    const removeBtn = $('removeBtn');
    const analyzeBtn = $('analyzeBtn');
    const eventForm = $('eventForm');
    const resetBtn = $('resetBtn');
    const saveApiKeyBtn = $('saveApiKeyBtn');
    
    if (browseBtn && fileInput) {
        browseBtn.onclick = () => fileInput.click();
    }
    if (fileInput) {
        fileInput.onchange = handleFileSelect;
    }
    if (uploadArea) {
        uploadArea.ondragover = e => { 
            e.preventDefault(); 
            if (e.target.classList) e.target.classList.add('dragover'); 
        };
        uploadArea.ondragleave = e => { 
            if (e.target.classList) e.target.classList.remove('dragover'); 
        };
        uploadArea.ondrop = handleDrop;
    }
    if (pasteBtn) {
        pasteBtn.onclick = handlePaste;
    }
    if (removeBtn) {
        removeBtn.onclick = resetUpload;
    }
    if (analyzeBtn) {
        analyzeBtn.onclick = analyzeImage;
    }
    if (eventForm) {
        eventForm.onsubmit = handleFormSubmit;
    }
    if (resetBtn) {
        resetBtn.onclick = resetAll;
    }
    if (saveApiKeyBtn) {
        saveApiKeyBtn.onclick = saveApiKey;
    }
});

function handleFileSelect(e) {
    const file = e.target.files[0];
    file?.type.startsWith('image/') ? loadImage(file) : toast('not an image', 'error');
}

function handleDrop(e) {
    e.preventDefault();
    e.target.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    file?.type.startsWith('image/') ? loadImage(file) : toast('not an image', 'error');
}

async function handlePaste() {
    try {
        const items = await navigator.clipboard.read();
        for (const item of items) {
            const imgType = item.types.find(t => t.startsWith('image/'));
            if (imgType) return loadImage(await item.getType(imgType));
        }
        toast('no image in clipboard', 'error');
    } catch {
        toast('clipboard blocked - just upload', 'error');
    }
}

function loadImage(file) {
    const reader = new FileReader();
    reader.onload = e => {
        currentImage = e.target.result;
        const previewImage = $('previewImage');
        const uploadArea = $('uploadArea');
        const previewArea = $('previewArea');
        const actionSection = $('actionSection');
        
        if (previewImage) previewImage.src = currentImage;
        if (uploadArea) uploadArea.classList.add('hidden');
        if (previewArea) previewArea.classList.remove('hidden');
        if (actionSection) actionSection.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

function resetUpload() {
    currentImage = null;
    const previewImage = $('previewImage');
    const fileInput = $('fileInput');
    const uploadArea = $('uploadArea');
    const previewArea = $('previewArea');
    const actionSection = $('actionSection');
    
    if (previewImage) previewImage.src = '';
    if (fileInput) fileInput.value = '';
    if (uploadArea) uploadArea.classList.remove('hidden');
    if (previewArea) previewArea.classList.add('hidden');
    if (actionSection) actionSection.classList.add('hidden');
}

function resetAll() {
    resetUpload();
    const resultSection = $('resultSection');
    const loadingSection = $('loadingSection');
    const eventForm = $('eventForm');
    
    if (resultSection) resultSection.classList.add('hidden');
    if (loadingSection) loadingSection.classList.add('hidden');
    if (eventForm) eventForm.reset();
}

async function analyzeImage() {
    if (!currentImage) return toast('no image uploaded', 'error');
    if (!apiKey) {
        const apiKeySection = $('apiKeySection');
        if (apiKeySection) apiKeySection.classList.remove('hidden');
        return toast('need api key', 'error');
    }

    const analyzeBtn = $('analyzeBtn');
    const actionSection = $('actionSection');
    const loadingSection = $('loadingSection');
    
    if (analyzeBtn) analyzeBtn.disabled = true;
    if (actionSection) actionSection.classList.add('hidden');
    if (loadingSection) loadingSection.classList.remove('hidden');

    try {
        // First extract OCR text to help identify host
        let ocrText = '';
        try {
            if (window.Tesseract && Tesseract.recognize) {
                const ocrResult = await Tesseract.recognize(currentImage, 'eng');
                ocrText = (ocrResult?.data?.text || '').trim();
            }
        } catch (e) {
            console.warn('OCR extraction failed:', e);
        }

        // Build prompt with OCR context if available
        let promptText = 'Analyze this event screenshot image and extract all event information.\n\n';
        
        if (ocrText) {
            promptText += `Here is the extracted text from the image:\n"${ocrText.substring(0, 1000)}"\n\n`;
        }
        
        promptText += `CRITICAL: Extract the HOST information. The host is the person, organization, or group that is hosting/organizing/presenting the event. Look for:\n`;
        promptText += `- Labels like: "Hosted by", "Organized by", "Organised by", "Presented by", "Host:", "Organizer:", "Organiser:", "By:", "From:"\n`;
        promptText += `- Social media handles (e.g., @username, @organization)\n`;
        promptText += `- Profile names or group names visible on the event post\n`;
        promptText += `- Organization/club/department names that appear to be the event creator\n\n`;
        promptText += `Extract ALL fields:\n`;
        promptText += `- title: The event name/title (required)\n`;
        promptText += `- host: The host/organizer name (CRITICAL - must extract if visible, even from profile name or handle)\n`;
        promptText += `- date: Start date in YYYY-MM-DD format\n`;
        promptText += `- time: Start time in HH:MM format (24-hour format)\n`;
        promptText += `- endDate: End date in YYYY-MM-DD format (if different from start date)\n`;
        promptText += `- endTime: End time in HH:MM format (24-hour format)\n`;
        promptText += `- location: Venue or location of the event\n`;
        promptText += `- description: Any additional event details or description\n\n`;
        promptText += `Return ONLY valid JSON with no markdown, no code blocks, no explanation.\n`;
        promptText += `Format: {"title": "...", "host": "...", "date": "YYYY-MM-DD", "time": "HH:MM", "endDate": "...", "endTime": "...", "location": "...", "description": "..."}\n\n`;
        promptText += `IMPORTANT: Do NOT leave host as empty string if you can see any host information in the image or text. Extract names, handles, or organization names that appear to be hosting the event.`;

        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert at extracting structured event data from images. You MUST identify the host/organizer. Output must be raw JSON only, no markdown, no code fences. Always extract host information if it is visible in any form.'
                    },
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: promptText },
                            { type: 'image_url', image_url: { url: currentImage } }
                        ]
                    }
                ],
                max_tokens: 1000,
                temperature: 0.3
            })
        });

        if (!res.ok) throw new Error((await res.json()).error?.message || 'api error');

        let content = (await res.json()).choices[0].message.content;
        const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
        if (jsonMatch) content = jsonMatch[1];
        
        const e = JSON.parse(content);
        
        const eventTitle = $('eventTitle');
        const eventDate = $('eventDate');
        const eventTime = $('eventTime');
        const eventHost = $('eventHost');
        const eventEndDate = $('eventEndDate');
        const eventEndTime = $('eventEndTime');
        const eventLocation = $('eventLocation');
        const eventDescription = $('eventDescription');
        const loadingSection = $('loadingSection');
        const resultSection = $('resultSection');
        
        if (eventTitle) eventTitle.value = e.title || '';
        if (eventDate) eventDate.value = e.date || '';
        if (eventTime) eventTime.value = e.time || '';
        if (eventEndDate) eventEndDate.value = e.endDate || e.date || '';
        if (eventEndTime) eventEndTime.value = e.endTime || '';
        if (eventLocation) eventLocation.value = e.location || '';
        if (eventDescription) eventDescription.value = e.description || '';
        
        // Extract and set host, with fallback to OCR if needed
        let hostValue = (e.host || '').trim();
        if (eventHost) {
            if (!hostValue && ocrText) {
                // Fallback: try OCR extraction using already extracted text
                try {
                    const ocrHost = extractHostFromText(ocrText);
                    if (ocrHost) {
                        hostValue = ocrHost;
                        console.log('Host extracted via OCR fallback:', hostValue);
                    }
                } catch (err) {
                    console.warn('OCR fallback failed:', err);
                }
            }
            // If still no host and we didn't have OCR text, try full OCR extraction
            if (!hostValue && !ocrText) {
                try {
                    if (window.Tesseract && Tesseract.recognize) {
                        const ocrHost = await fallbackExtractHostWithOCR(currentImage);
                        if (ocrHost) {
                            hostValue = ocrHost;
                            console.log('Host extracted via OCR fallback (full):', hostValue);
                        }
                    }
                } catch (err) {
                    console.warn('Full OCR fallback failed:', err);
                }
            }
            eventHost.value = hostValue;
            if (hostValue) {
                console.log('Final host value:', hostValue);
            } else {
                console.warn('No host extracted from image');
            }
        }

        if (loadingSection) loadingSection.classList.add('hidden');
        if (resultSection) resultSection.classList.remove('hidden');
        toast('got the details');
    } catch (err) {
        console.error(err);
        const loadingSection = $('loadingSection');
        const actionSection = $('actionSection');
        const analyzeBtn = $('analyzeBtn');
        
        if (loadingSection) loadingSection.classList.add('hidden');
        if (actionSection) actionSection.classList.remove('hidden');
        if (analyzeBtn) analyzeBtn.disabled = false;
        toast(err.message, 'error');
    }
}

function handleFormSubmit(e) {
    e.preventDefault();
    const eventTitle = $('eventTitle');
    const eventDate = $('eventDate');
    const eventTime = $('eventTime');
    const eventHost = $('eventHost');
    const eventEndDate = $('eventEndDate');
    const eventEndTime = $('eventEndTime');
    const eventLocation = $('eventLocation');
    const eventDescription = $('eventDescription');
    
    if (!eventTitle || !eventDate || !eventTime) {
        toast('required fields missing', 'error');
        return;
    }
    
    generateICS({
        title: eventTitle.value,
        host: eventHost ? eventHost.value : '',
        date: eventDate.value,
        time: eventTime.value,
        endDate: (eventEndDate && eventEndDate.value) || eventDate.value,
        endTime: eventEndTime ? eventEndTime.value : '',
        location: eventLocation ? eventLocation.value : '',
        description: eventDescription ? eventDescription.value : ''
    });
}

function generateICS(ev) {
    const start = new Date(`${ev.date}T${ev.time}`);
    const end = ev.endTime ? new Date(`${ev.endDate}T${ev.endTime}`) : new Date(start.getTime() + 3600000);
    
    const fmt = d => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const esc = s => s.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');
    
    const ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//SmartCapture//EN',
        'BEGIN:VEVENT',
        `UID:${Date.now()}@smartcapture.app`,
        `DTSTAMP:${fmt(new Date())}`,
        `DTSTART:${fmt(start)}`,
        `DTEND:${fmt(end)}`,
        `SUMMARY:${esc(ev.title)}`,
        ev.host && `X-HOST:${esc(ev.host)}`,
        ev.location && `LOCATION:${esc(ev.location)}`,
        ev.description && `DESCRIPTION:${esc(ev.description)}`,
        'END:VEVENT',
        'END:VCALENDAR'
    ].filter(Boolean).join('\r\n');
    
    const blob = new Blob([ics], { type: 'text/calendar' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${ev.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
    a.click();
    URL.revokeObjectURL(a.href);
    
    toast('downloaded');
}

// Heuristic OCR fallback to extract host when the model misses it
async function fallbackExtractHostWithOCR(imageDataUrl) {
    if (!(window.Tesseract && Tesseract.recognize)) return '';
    try {
        const result = await Tesseract.recognize(imageDataUrl, 'eng');
        const text = (result && result.data && result.data.text) ? result.data.text : '';
        return extractHostFromText(text);
    } catch {
        return '';
    }
}

function extractHostFromText(text) {
    if (!text) return '';
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const joined = text.toLowerCase();

    // Enhanced patterns to catch more variations
    const labelPatterns = [
        /hosted\s+by[:\-]?\s*([^\n]+)/i,
        /organized\s+by[:\-]?\s*([^\n]+)/i,
        /organised\s+by[:\-]?\s*([^\n]+)/i,
        /presented\s+by[:\-]?\s*([^\n]+)/i,
        /^host[:\-]?\s*(.+)$/im,
        /^organizer[:\-]?\s*(.+)$/im,
        /^organiser[:\-]?\s*(.+)$/im,
        /\bby[:\-]?\s*([^\n]+)/i,
        /from[:\-]?\s*([^\n]+)/i
    ];

    for (const line of lines) {
        for (const pattern of labelPatterns) {
            const m = line.match(pattern);
            if (m && m[1]) {
                const host = sanitizeHost(m[1]);
                if (host && host.length > 1) {
                    return host;
                }
            }
        }
    }

    // Look for @handles anywhere in text
    const handleMatches = text.match(/@[A-Za-z0-9_\.\-]+/g);
    if (handleMatches && handleMatches.length > 0) {
        // Prefer the first handle that's not part of a URL
        for (const handle of handleMatches) {
            if (!handle.includes('http') && handle.length > 1) {
                return sanitizeHost(handle);
            }
        }
    }

    // Look for profile/username patterns (e.g., "Posted by X", "Event by X")
    const postedByMatch = text.match(/(?:posted|created|event)\s+(?:by|from)[:\-]?\s*([^\n,]+)/i);
    if (postedByMatch && postedByMatch[1]) {
        return sanitizeHost(postedByMatch[1]);
    }

    // Fallback: choose a candidate line that looks like a group/org name (near top)
    for (let i = 0; i < Math.min(lines.length, 15); i++) {
        const l = lines[i];
        // Check if line looks like an organization/club name
        if (/club|society|association|department|lab|center|centre|team|group|chapter|union|university|college|school/i.test(l)) {
            // Make sure it's not too long (likely not a description)
            if (l.length < 80 && l.length > 2) {
                return sanitizeHost(l);
            }
        }
        // Also check for capitalized names/orgs (often hosts)
        if (l.length > 2 && l.length < 60 && /^[A-Z][A-Za-z\s&]+$/.test(l) && l.split(/\s+/).length <= 5) {
            return sanitizeHost(l);
        }
    }
    return '';
}

function sanitizeHost(s) {
    return (s || '')
        .replace(/^[\-:\s]+/, '')
        .replace(/\s{2,}/g, ' ')
        .trim()
        .slice(0, 120);
}

function saveApiKey() {
    const apiKeyInput = $('apiKeyInput');
    if (!apiKeyInput) return toast('api key input not found', 'error');
    
    const key = apiKeyInput.value.trim();
    if (!key) return toast('need a key', 'error');
    
    apiKey = key;
    localStorage.setItem('openai_api_key', key);
    const apiKeySection = $('apiKeySection');
    if (apiKeySection) apiKeySection.classList.add('hidden');
    toast('saved');
}

function toast(msg, type = 'success') {
    const el = $('toast');
    if (!el) {
        console.warn('Toast element not found');
        return;
    }
    el.textContent = msg;
    el.className = `toast ${type}`;
    el.classList.remove('hidden');
    setTimeout(() => {
        if (el) el.classList.add('hidden');
    }, 4000);
}

