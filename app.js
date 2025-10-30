// State management
let currentImage = null;
let apiKey = localStorage.getItem('openai_api_key') || '';

// DOM elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const pasteBtn = document.getElementById('pasteBtn');
const previewArea = document.getElementById('previewArea');
const previewImage = document.getElementById('previewImage');
const removeBtn = document.getElementById('removeBtn');
const actionSection = document.getElementById('actionSection');
const analyzeBtn = document.getElementById('analyzeBtn');
const loadingSection = document.getElementById('loadingSection');
const resultSection = document.getElementById('resultSection');
const eventForm = document.getElementById('eventForm');
const resetBtn = document.getElementById('resetBtn');
const apiKeySection = document.getElementById('apiKeySection');
const apiKeyInput = document.getElementById('apiKeyInput');
const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (!apiKey) {
        apiKeySection.classList.remove('hidden');
    }
    setupEventListeners();
});

function setupEventListeners() {
    // Upload handlers
    browseBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    // Paste from clipboard
    pasteBtn.addEventListener('click', handlePaste);
    
    // Remove image
    removeBtn.addEventListener('click', resetUpload);
    
    // Analyze
    analyzeBtn.addEventListener('click', analyzeImage);
    
    // Form submission
    eventForm.addEventListener('submit', handleFormSubmit);
    
    // Reset
    resetBtn.addEventListener('click', resetAll);
    
    // API key
    saveApiKeyBtn.addEventListener('click', saveApiKey);
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        loadImage(file);
    } else {
        showToast('Please select a valid image file', 'error');
    }
}

function handleDragOver(event) {
    event.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave() {
    uploadArea.classList.remove('dragover');
}

function handleDrop(event) {
    event.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        loadImage(file);
    } else {
        showToast('Please drop a valid image file', 'error');
    }
}

async function handlePaste() {
    try {
        const clipboardItems = await navigator.clipboard.read();
        for (const item of clipboardItems) {
            const imageTypes = item.types.filter(type => type.startsWith('image/'));
            if (imageTypes.length > 0) {
                const blob = await item.getType(imageTypes[0]);
                loadImage(blob);
                return;
            }
        }
        showToast('No image found in clipboard', 'error');
    } catch (error) {
        showToast('Failed to read clipboard. Please use the upload button instead.', 'error');
    }
}

function loadImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        currentImage = e.target.result;
        previewImage.src = currentImage;
        uploadArea.classList.add('hidden');
        previewArea.classList.remove('hidden');
        actionSection.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

function resetUpload() {
    currentImage = null;
    previewImage.src = '';
    fileInput.value = '';
    uploadArea.classList.remove('hidden');
    previewArea.classList.add('hidden');
    actionSection.classList.add('hidden');
}

function resetAll() {
    resetUpload();
    resultSection.classList.add('hidden');
    loadingSection.classList.add('hidden');
    eventForm.reset();
}

async function analyzeImage() {
    if (!currentImage) {
        showToast('Please upload an image first', 'error');
        return;
    }

    if (!apiKey) {
        apiKeySection.classList.remove('hidden');
        showToast('Please enter your OpenAI API key', 'error');
        return;
    }

    analyzeBtn.disabled = true;
    actionSection.classList.add('hidden');
    loadingSection.classList.remove('hidden');

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: `Analyze this image and extract event details. Return a JSON object with the following fields:
- title: Event title/name
- date: Event date in YYYY-MM-DD format
- time: Start time in HH:MM format (24-hour)
- endDate: End date in YYYY-MM-DD format (if available, otherwise same as date)
- endTime: End time in HH:MM format (if available)
- location: Event location/venue
- description: Brief description of the event

If any information is not clearly visible, use reasonable defaults or leave empty. Only return the JSON object, no other text.`
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: currentImage
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 500
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to analyze image');
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        
        // Extract JSON from the response (sometimes it's wrapped in markdown code blocks)
        let jsonStr = content;
        const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1];
        }
        
        const eventData = JSON.parse(jsonStr);
        
        // Populate form with extracted data
        document.getElementById('eventTitle').value = eventData.title || '';
        document.getElementById('eventDate').value = eventData.date || '';
        document.getElementById('eventTime').value = eventData.time || '';
        document.getElementById('eventEndDate').value = eventData.endDate || eventData.date || '';
        document.getElementById('eventEndTime').value = eventData.endTime || '';
        document.getElementById('eventLocation').value = eventData.location || '';
        document.getElementById('eventDescription').value = eventData.description || '';
        
        loadingSection.classList.add('hidden');
        resultSection.classList.remove('hidden');
        showToast('Event details extracted successfully!', 'success');
    } catch (error) {
        console.error('Error analyzing image:', error);
        loadingSection.classList.add('hidden');
        actionSection.classList.remove('hidden');
        analyzeBtn.disabled = false;
        showToast(`Error: ${error.message}`, 'error');
    }
}

function handleFormSubmit(event) {
    event.preventDefault();
    
    const eventData = {
        title: document.getElementById('eventTitle').value,
        date: document.getElementById('eventDate').value,
        time: document.getElementById('eventTime').value,
        endDate: document.getElementById('eventEndDate').value || document.getElementById('eventDate').value,
        endTime: document.getElementById('eventEndTime').value,
        location: document.getElementById('eventLocation').value,
        description: document.getElementById('eventDescription').value
    };
    
    generateICS(eventData);
}

function generateICS(eventData) {
    // Parse dates and times
    const startDateTime = new Date(`${eventData.date}T${eventData.time}`);
    const endDateTime = eventData.endTime 
        ? new Date(`${eventData.endDate}T${eventData.endTime}`)
        : new Date(startDateTime.getTime() + 60 * 60 * 1000); // Default 1 hour duration
    
    // Format dates for ICS (YYYYMMDDTHHMMSS)
    const formatICSDate = (date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    const dtstart = formatICSDate(startDateTime);
    const dtend = formatICSDate(endDateTime);
    const dtstamp = formatICSDate(new Date());
    
    // Generate unique ID
    const uid = `${Date.now()}@smartcapture.app`;
    
    // Escape special characters in ICS format
    const escapeICS = (str) => {
        return str.replace(/\\/g, '\\\\')
                  .replace(/,/g, '\\,')
                  .replace(/;/g, '\\;')
                  .replace(/\n/g, '\\n');
    };
    
    // Build ICS content
    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//SmartCapture//Event Calendar//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART:${dtstart}`,
        `DTEND:${dtend}`,
        `SUMMARY:${escapeICS(eventData.title)}`,
        eventData.location ? `LOCATION:${escapeICS(eventData.location)}` : '',
        eventData.description ? `DESCRIPTION:${escapeICS(eventData.description)}` : '',
        'STATUS:CONFIRMED',
        'SEQUENCE:0',
        'END:VEVENT',
        'END:VCALENDAR'
    ].filter(line => line).join('\r\n');
    
    // Create download link
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${eventData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast('Calendar file downloaded! Open it to add to your calendar.', 'success');
}

function saveApiKey() {
    const key = apiKeyInput.value.trim();
    if (key) {
        apiKey = key;
        localStorage.setItem('openai_api_key', key);
        apiKeySection.classList.add('hidden');
        showToast('API key saved successfully!', 'success');
    } else {
        showToast('Please enter a valid API key', 'error');
    }
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 4000);
}

