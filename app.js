let currentImage = null;
let apiKey = localStorage.getItem('openai_api_key') || '';

const $ = id => document.getElementById(id);

document.addEventListener('DOMContentLoaded', () => {
    if (!apiKey) $('apiKeySection').classList.remove('hidden');
    
    $('browseBtn').onclick = () => $('fileInput').click();
    $('fileInput').onchange = handleFileSelect;
    $('uploadArea').ondragover = e => { e.preventDefault(); e.target.classList.add('dragover'); };
    $('uploadArea').ondragleave = e => e.target.classList.remove('dragover');
    $('uploadArea').ondrop = handleDrop;
    $('pasteBtn').onclick = handlePaste;
    $('removeBtn').onclick = resetUpload;
    $('analyzeBtn').onclick = analyzeImage;
    $('eventForm').onsubmit = handleFormSubmit;
    $('resetBtn').onclick = resetAll;
    $('saveApiKeyBtn').onclick = saveApiKey;
});

function handleFileSelect(e) {
    const file = e.target.files[0];
    file && file.type.startsWith('image/') 
        ? loadImage(file) 
        : toast('Please select a valid image file', 'error');
}

function handleDrop(e) {
    e.preventDefault();
    e.target.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    file && file.type.startsWith('image/')
        ? loadImage(file)
        : toast('Please drop a valid image file', 'error');
}

async function handlePaste() {
    try {
        const items = await navigator.clipboard.read();
        for (const item of items) {
            const imgType = item.types.find(t => t.startsWith('image/'));
            if (imgType) {
                loadImage(await item.getType(imgType));
                return;
            }
        }
        toast('No image in clipboard', 'error');
    } catch {
        toast('Clipboard access failed - try uploading instead', 'error');
    }
}

function loadImage(file) {
    const reader = new FileReader();
    reader.onload = e => {
        currentImage = e.target.result;
        $('previewImage').src = currentImage;
        $('uploadArea').classList.add('hidden');
        $('previewArea').classList.remove('hidden');
        $('actionSection').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

function resetUpload() {
    currentImage = null;
    $('previewImage').src = '';
    $('fileInput').value = '';
    $('uploadArea').classList.remove('hidden');
    $('previewArea').classList.add('hidden');
    $('actionSection').classList.add('hidden');
}

function resetAll() {
    resetUpload();
    $('resultSection').classList.add('hidden');
    $('loadingSection').classList.add('hidden');
    $('eventForm').reset();
}

async function analyzeImage() {
    if (!currentImage) return toast('Upload an image first', 'error');
    if (!apiKey) {
        $('apiKeySection').classList.remove('hidden');
        return toast('Need API key', 'error');
    }

    $('analyzeBtn').disabled = true;
    $('actionSection').classList.add('hidden');
    $('loadingSection').classList.remove('hidden');

    try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [{
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: 'Extract event details from this image. Return JSON with: title, date (YYYY-MM-DD), time (HH:MM), endDate, endTime, location, description. Just the JSON, nothing else.'
                        },
                        { type: 'image_url', image_url: { url: currentImage } }
                    ]
                }],
                max_tokens: 500
            })
        });

        if (!res.ok) throw new Error((await res.json()).error?.message || 'API error');

        const data = await res.json();
        let content = data.choices[0].message.content;
        
        const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
        if (jsonMatch) content = jsonMatch[1];
        
        const event = JSON.parse(content);
        
        $('eventTitle').value = event.title || '';
        $('eventDate').value = event.date || '';
        $('eventTime').value = event.time || '';
        $('eventEndDate').value = event.endDate || event.date || '';
        $('eventEndTime').value = event.endTime || '';
        $('eventLocation').value = event.location || '';
        $('eventDescription').value = event.description || '';
        
        $('loadingSection').classList.add('hidden');
        $('resultSection').classList.remove('hidden');
        toast('Extracted event details', 'success');
    } catch (err) {
        console.error(err);
        $('loadingSection').classList.add('hidden');
        $('actionSection').classList.remove('hidden');
        $('analyzeBtn').disabled = false;
        toast(`Error: ${err.message}`, 'error');
    }
}

function handleFormSubmit(e) {
    e.preventDefault();
    generateICS({
        title: $('eventTitle').value,
        date: $('eventDate').value,
        time: $('eventTime').value,
        endDate: $('eventEndDate').value || $('eventDate').value,
        endTime: $('eventEndTime').value,
        location: $('eventLocation').value,
        description: $('eventDescription').value
    });
}

function generateICS(event) {
    const start = new Date(`${event.date}T${event.time}`);
    const end = event.endTime 
        ? new Date(`${event.endDate}T${event.endTime}`)
        : new Date(start.getTime() + 3600000);
    
    const fmt = d => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const esc = s => s.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');
    
    const ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//SmartCapture//Event Calendar//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:${Date.now()}@smartcapture.app`,
        `DTSTAMP:${fmt(new Date())}`,
        `DTSTART:${fmt(start)}`,
        `DTEND:${fmt(end)}`,
        `SUMMARY:${esc(event.title)}`,
        event.location && `LOCATION:${esc(event.location)}`,
        event.description && `DESCRIPTION:${esc(event.description)}`,
        'STATUS:CONFIRMED',
        'SEQUENCE:0',
        'END:VEVENT',
        'END:VCALENDAR'
    ].filter(Boolean).join('\r\n');
    
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast('Downloaded! Import it to your calendar', 'success');
}

function saveApiKey() {
    const key = $('apiKeyInput').value.trim();
    if (!key) return toast('Enter a valid API key', 'error');
    
    apiKey = key;
    localStorage.setItem('openai_api_key', key);
    $('apiKeySection').classList.add('hidden');
    toast('API key saved', 'success');
}

function toast(msg, type = 'success') {
    const el = $('toast');
    el.textContent = msg;
    el.className = `toast ${type}`;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 4000);
}

