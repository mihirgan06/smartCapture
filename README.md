# SmartCapture - Event to Calendar

SmartCapture is a modern web application that automatically extracts event information from screenshots and generates calendar files (.ics) that can be added to any calendar application.

## Features

✨ **AI-Powered Extraction** - Uses OpenAI's Vision API (GPT-4o) to intelligently parse event details from screenshots

📸 **Multiple Upload Options** - Upload files, drag & drop, or paste directly from clipboard

🎨 **Beautiful UI** - Modern, responsive design with smooth animations

📅 **Universal Calendar Support** - Generates standard .ics files compatible with Google Calendar, Apple Calendar, Outlook, and more

🔒 **Privacy First** - API keys are stored locally in your browser, never sent to any server except OpenAI

## How It Works

1. **Upload a screenshot** of an event (poster, email, social media post, etc.)
2. **AI analyzes** the image and extracts:
   - Event title
   - Date and time (start/end)
   - Location
   - Description
3. **Review and edit** the extracted information
4. **Download** a calendar file that can be opened in any calendar app

## Setup

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- An OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Installation

1. Clone or download this repository
2. Open `index.html` in your web browser
3. Enter your OpenAI API key when prompted
4. Start uploading event screenshots!

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

**Option 3: Using VS Code**
- Install the "Live Server" extension
- Right-click on `index.html` and select "Open with Live Server"

## Usage Tips

### Best Results
- Use clear, high-resolution screenshots
- Ensure text is legible and not blurry
- Images with good contrast work best
- Event posters and formal announcements typically work very well

### Supported Event Types
- Conference posters
- Meeting invitations
- Social media event posts
- Email invitations
- Website event pages
- Flyers and announcements

### Calendar Integration
After downloading the .ics file:
- **Google Calendar**: Go to Settings > Import & Export > Import
- **Apple Calendar**: Double-click the .ics file
- **Outlook**: File > Open & Export > Import/Export
- **Mobile**: Tap the .ics file attachment in email or downloads

## Technology Stack

- **Frontend**: Pure HTML5, CSS3, JavaScript (ES6+)
- **AI**: OpenAI GPT-4o Vision API
- **Calendar**: RFC 5545 (iCalendar) format

## File Structure

```
smartCapture/
├── index.html      # Main HTML structure
├── styles.css      # All styling and animations
├── app.js          # Application logic and API integration
└── README.md       # This file
```

## Privacy & Security

- Your API key is stored in `localStorage` only
- Images are sent directly to OpenAI's API via HTTPS
- No data is stored on any third-party servers
- You can clear your API key anytime by clearing browser storage

## API Costs

This app uses OpenAI's GPT-4o model with vision capabilities. Costs are approximately:
- $0.005 per image analysis (very affordable!)
- Visit [OpenAI Pricing](https://openai.com/pricing) for current rates

## Browser Compatibility

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ⚠️ Clipboard paste may require HTTPS in some browsers

## Troubleshooting

**"Failed to read clipboard"**
- Try using the file upload instead
- Ensure your browser has clipboard permissions
- Some browsers require HTTPS for clipboard access

**"Failed to analyze image"**
- Check that your API key is valid
- Ensure you have credits in your OpenAI account
- Try a different image format (PNG, JPEG)

**"No event details found"**
- The image may not contain clear event information
- Try a higher quality screenshot
- Manually edit the extracted fields if needed

## Future Enhancements

- [ ] Direct calendar integration (Google Calendar API)
- [ ] Batch processing for multiple events
- [ ] History of processed events
- [ ] OCR fallback for non-AI processing
- [ ] Mobile app version

## Contributing

Feel free to fork this project and submit pull requests for any improvements!

## License

MIT License - feel free to use this project for any purpose.

## Acknowledgments

- Built with ❤️ for effortless event planning
- Powered by OpenAI's GPT-4o Vision API
- Icons from Feather Icons

---

**Made by the NYU Clubs EEG team** 🎓

