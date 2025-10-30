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
    if (!currentImage) return toast('no image uploaded', 'error');
    if (!apiKey) {
        $('apiKeySection').classList.remove('hidden');
        return toast('need api key', 'error');
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
                        { type: 'text', text: 'extract event info from this image. return json: {title, date (YYYY-MM-DD), time (HH:MM), endDate, endTime, location, description}. just json, no markdown.' },
                        { type: 'image_url', image_url: { url: currentImage } }
                    ]
                }],
                max_tokens: 500
            })
        });

        if (!res.ok) throw new Error((await res.json()).error?.message || 'api error');

        let content = (await res.json()).choices[0].message.content;
        const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
        if (jsonMatch) content = jsonMatch[1];
        
        const e = JSON.parse(content);
        
        $('eventTitle').value = e.title || '';
        $('eventDate').value = e.date || '';
        $('eventTime').value = e.time || '';
        $('eventEndDate').value = e.endDate || e.date || '';
        $('eventEndTime').value = e.endTime || '';
        $('eventLocation').value = e.location || '';
        $('eventDescription').value = e.description || '';
        
        $('loadingSection').classList.add('hidden');
        $('resultSection').classList.remove('hidden');
        toast('got the details');
    } catch (err) {
        console.error(err);
        $('loadingSection').classList.add('hidden');
        $('actionSection').classList.remove('hidden');
        $('analyzeBtn').disabled = false;
        toast(err.message, 'error');
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

function saveApiKey() {
    const key = $('apiKeyInput').value.trim();
    if (!key) return toast('need a key', 'error');
    
    apiKey = key;
    localStorage.setItem('openai_api_key', key);
    $('apiKeySection').classList.add('hidden');
    toast('saved');
}

function toast(msg, type = 'success') {
    const el = $('toast');
    el.textContent = msg;
    el.className = `toast ${type}`;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 4000);
}

