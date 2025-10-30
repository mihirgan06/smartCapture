# SmartCapture - Event to Calendar

SmartCapture is a modern web application that automatically extracts event information from screenshots using OCR technology and generates calendar files (.ics) that can be added to any calendar application.

## Features

🔍 **OCR-Powered Extraction** - Uses Tesseract.js to extract text from images with intelligent parsing

📸 **Multiple Upload Options** - Upload files, drag & drop, or paste directly from clipboard

🎨 **Beautiful UI** - Modern, responsive design with smooth animations

📅 **Universal Calendar Support** - Generates standard .ics files compatible with Google Calendar, Apple Calendar, Outlook, and more

🆓 **Completely Free** - No API keys required, works offline, 100% client-side

🔒 **Privacy First** - All processing happens in your browser, no data sent to servers

## How It Works

1. **Upload a screenshot** of an event (poster, email, social media post, etc.)
2. **OCR analyzes** the image and extracts text
3. **Smart parsing** identifies:
   - Event title
   - Date and time (start/end)
   - Location
   - Description
4. **Review and edit** the extracted information
5. **Download** a calendar file that can be opened in any calendar app

## Setup

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- No API keys or accounts needed!

### Installation

1. Clone or download this repository
2. Open `index.html` in your web browser
3. Start uploading event screenshots!

### Running Locally

Since this is a static web app, you can simply open `index.html` in your browser. For better development experience, use a local server:

**Option 1: Using Python**
```bash
# Python 3
python -m http.server 8000

# Then visit http://localhost:8000
```

**Option 2: Using Node.js**
```bash
npx http-server -p 8000

# Then visit http://localhost:8000
```

**Option 3: Using npm script**
```bash
npm start

# Opens automatically in your browser
```

**Option 4: Using VS Code**
- Install the "Live Server" extension
- Right-click on `index.html` and select "Open with Live Server"

## Usage Tips

### Best Results
- Use clear, high-resolution screenshots
- Ensure text is legible and not blurry
- Images with good contrast work best
- Horizontal text orientation works better than rotated text
- Event posters and formal announcements typically work very well

### Supported Date/Time Formats
- MM/DD/YYYY or MM-DD-YYYY
- Month DD, YYYY (e.g., "January 15, 2025")
- DD Month YYYY (e.g., "15 January 2025")
- Weekday, Month DD (e.g., "Friday, January 15")
- HH:MM AM/PM or HH:MM (24-hour)
- Time ranges (e.g., "2:00 PM - 4:00 PM")

### Supported Event Types
- Conference posters
- Meeting invitations
- Social media event posts
- Email invitations
- Website event pages
- Flyers and announcements
- Concert/show tickets
- Workshop notifications

### Location Detection
The app looks for keywords like: room, hall, building, street, avenue, venue, location, address

### Calendar Integration
After downloading the .ics file:
- **Google Calendar**: Go to Settings > Import & Export > Import
- **Apple Calendar**: Double-click the .ics file
- **Outlook**: File > Open & Export > Import/Export
- **Mobile**: Tap the .ics file attachment in email or downloads

## Technology Stack

- **Frontend**: Pure HTML5, CSS3, JavaScript (ES6+)
- **OCR**: Tesseract.js v5 (client-side OCR engine)
- **Calendar**: RFC 5545 (iCalendar) format
- **Text Parsing**: Custom regex-based date/time extraction

## File Structure

```
smartCapture/
├── index.html      # Main HTML structure
├── styles.css      # All styling and animations
├── app.js          # Application logic, OCR, and text parsing
├── package.json    # Project configuration
└── README.md       # This file
```

## Privacy & Security

- ✅ 100% client-side processing
- ✅ No data sent to external servers
- ✅ No API keys or authentication required
- ✅ Works completely offline (after first load)
- ✅ No cookies or tracking

## Cost

**FREE!** Unlike the previous version that used OpenAI's API, this version uses Tesseract.js which is completely free and open-source. No API costs whatsoever.

## Browser Compatibility

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ⚠️ Clipboard paste may require HTTPS in some browsers

## Performance

- **First OCR**: Takes ~5-10 seconds (downloads OCR language data)
- **Subsequent OCRs**: Takes ~2-5 seconds per image
- **Accuracy**: 70-95% depending on image quality
- **Works offline**: Yes (after first load)

## Troubleshooting

**"Failed to read clipboard"**
- Try using the file upload instead
- Ensure your browser has clipboard permissions
- Some browsers require HTTPS for clipboard access

**OCR taking too long**
- First-time use downloads language data (~2MB)
- Subsequent uses are much faster
- Check your internet connection for first load

**Poor extraction accuracy**
- Try a higher quality screenshot
- Ensure good contrast and readable text
- Manually edit the extracted fields as needed
- Avoid images with rotated or skewed text

**Some details missing**
- The parser looks for common patterns
- Manually fill in any missing fields
- Different date/time formats may not be recognized

## Limitations

- OCR accuracy depends on image quality
- Date/time parsing uses pattern matching (may miss unusual formats)
- Best suited for English text (OCR engine uses English language model)
- Complex layouts may result in text extraction issues

## Future Enhancements

- [ ] Multi-language support
- [ ] Direct calendar integration (Google Calendar API)
- [ ] Batch processing for multiple events
- [ ] History of processed events
- [ ] Custom date/time format training
- [ ] Mobile app version
- [ ] Image preprocessing for better OCR accuracy

## Contributing

Feel free to fork this project and submit pull requests for any improvements!

## Technical Details

### Text Parsing Algorithm

The app uses a sophisticated parsing system:

1. **Text Extraction**: Tesseract.js performs OCR on the image
2. **Date Detection**: Multiple regex patterns for various date formats
3. **Time Detection**: Recognizes 12-hour and 24-hour formats, including ranges
4. **Title Extraction**: Identifies the most prominent text as the title
5. **Location Detection**: Keyword-based location finding
6. **Smart Defaults**: Uses reasonable fallbacks for missing data

### ICS Generation

Creates RFC 5545-compliant calendar files with:
- Unique event IDs
- Proper timezone handling (UTC)
- Escaped special characters
- Standard VEVENT structure

## License

MIT License - feel free to use this project for any purpose.

## Acknowledgments

- Built with ❤️ for effortless event planning
- Powered by Tesseract.js OCR engine
- Icons from Feather Icons
- No AI APIs or external services required!

---

**Made by the NYU Clubs EEG team** 🎓

**Version 2.0** - Now with free, offline OCR support!
