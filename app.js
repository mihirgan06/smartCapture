// State management
let currentImage = null;

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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
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

    analyzeBtn.disabled = true;
    actionSection.classList.add('hidden');
    loadingSection.classList.remove('hidden');

    try {
        // Use Tesseract.js to extract text from image
        const { data: { text } } = await Tesseract.recognize(
            currentImage,
            'eng',
            {
                logger: info => {
                    // Update loading message with progress
                    if (info.status === 'recognizing text') {
                        const progress = Math.round(info.progress * 100);
                        document.querySelector('.loading-section p').textContent = 
                            `Analyzing image... ${progress}%`;
                    }
                }
            }
        );

        console.log('Extracted text:', text);

        // Parse the extracted text to find event details
        const eventData = parseEventDetails(text);
        
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

function parseEventDetails(text) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    let title = '';
    let date = '';
    let time = '';
    let endTime = '';
    let endDate = '';
    let location = '';
    let description = '';
    
    // Date patterns
    const datePatterns = [
        // MM/DD/YYYY or MM-DD-YYYY
        /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/,
        // Month DD, YYYY or Month DD YYYY
        /(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\s,]+(\d{1,2})[\s,]+(\d{2,4})/i,
        // DD Month YYYY
        /(\d{1,2})[\s,]+(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\s,]+(\d{2,4})/i,
        // Weekday, Month DD
        /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s+(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})/i
    ];
    
    // Time patterns
    const timePatterns = [
        // HH:MM AM/PM or HH:MMAM/PM
        /(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)/,
        // HH AM/PM
        /(\d{1,2})\s*(AM|PM|am|pm)/,
        // HH:MM (24-hour)
        /(\d{1,2}):(\d{2})(?!\d)/
    ];
    
    // Location keywords
    const locationKeywords = ['room', 'hall', 'building', 'street', 'avenue', 'venue', 'location', 'at', 'address'];
    
    // Try to find title (usually the first line or a prominent line)
    if (lines.length > 0) {
        // Look for the longest line in first few lines (likely the title)
        const firstFewLines = lines.slice(0, Math.min(5, lines.length));
        title = firstFewLines.reduce((longest, current) => 
            current.length > longest.length ? current : longest
        );
    }
    
    // Search through all lines for dates and times
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Try to match dates
        if (!date) {
            for (const pattern of datePatterns) {
                const match = line.match(pattern);
                if (match) {
                    date = convertToISODate(match);
                    break;
                }
            }
        }
        
        // Try to match times
        const timeMatches = line.match(new RegExp(timePatterns.map(p => p.source).join('|'), 'gi'));
        if (timeMatches && timeMatches.length > 0) {
            if (!time) {
                time = convertTo24Hour(timeMatches[0]);
            }
            if (timeMatches.length > 1 && !endTime) {
                endTime = convertTo24Hour(timeMatches[1]);
            }
            // Look for time ranges like "2:00 PM - 4:00 PM"
            const rangeMatch = line.match(/(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)\s*[-–—to]+\s*(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)/i);
            if (rangeMatch) {
                time = convertTo24Hour(rangeMatch[1]);
                endTime = convertTo24Hour(rangeMatch[2]);
            }
        }
        
        // Try to find location
        if (!location) {
            for (const keyword of locationKeywords) {
                if (line.toLowerCase().includes(keyword)) {
                    location = line;
                    break;
                }
            }
        }
    }
    
    // If no title found or title is too short, use first substantial line
    if (!title || title.length < 5) {
        title = lines.find(line => line.length > 5 && !line.match(/\d{1,2}:\d{2}/)) || 'Event';
    }
    
    // Create description from remaining text
    description = lines.slice(0, 5).join(' ');
    
    return {
        title: cleanText(title),
        date: date,
        time: time,
        endDate: endDate || date,
        endTime: endTime,
        location: cleanText(location),
        description: cleanText(description)
    };
}

function convertToISODate(match) {
    const monthMap = {
        'january': 1, 'jan': 1,
        'february': 2, 'feb': 2,
        'march': 3, 'mar': 3,
        'april': 4, 'apr': 4,
        'may': 5,
        'june': 6, 'jun': 6,
        'july': 7, 'jul': 7,
        'august': 8, 'aug': 8,
        'september': 9, 'sep': 9,
        'october': 10, 'oct': 10,
        'november': 11, 'nov': 11,
        'december': 12, 'dec': 12
    };
    
    let year, month, day;
    
    if (match[1] && !isNaN(match[1]) && match[1].length <= 2) {
        // MM/DD/YYYY format
        month = parseInt(match[1]);
        day = parseInt(match[2]);
        year = parseInt(match[3]);
    } else if (monthMap[match[1]?.toLowerCase()]) {
        // Month DD, YYYY format
        month = monthMap[match[1].toLowerCase()];
        day = parseInt(match[2]);
        year = match[3] ? parseInt(match[3]) : new Date().getFullYear();
    } else if (match[2] && monthMap[match[2]?.toLowerCase()]) {
        // DD Month YYYY format
        day = parseInt(match[1]);
        month = monthMap[match[2].toLowerCase()];
        year = match[3] ? parseInt(match[3]) : new Date().getFullYear();
    } else if (match[2] && monthMap[match[2]?.toLowerCase()]) {
        // Weekday, Month DD format
        month = monthMap[match[2].toLowerCase()];
        day = parseInt(match[3]);
        year = new Date().getFullYear();
    }
    
    // Handle 2-digit years
    if (year < 100) {
        year += 2000;
    }
    
    // Return ISO format YYYY-MM-DD
    if (year && month && day) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    
    return '';
}

function convertTo24Hour(timeStr) {
    const match = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM|am|pm)?/);
    if (!match) return '';
    
    let hours = parseInt(match[1]);
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const period = match[3]?.toUpperCase();
    
    if (period === 'PM' && hours < 12) {
        hours += 12;
    } else if (period === 'AM' && hours === 12) {
        hours = 0;
    }
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function cleanText(text) {
    // Remove excessive whitespace and special characters
    return text.replace(/\s+/g, ' ').trim();
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

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 4000);
}
