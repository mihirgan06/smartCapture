# SmartCapture

Take a screenshot of any event and automatically add it to your calendar. That's it.

## What it does

You know when you screenshot an event poster or Instagram story and forget about it? This fixes that. Upload the screenshot, and it'll pull out the event details (title, date, time, location) and generate a calendar file you can import anywhere.

Works with:
- Event posters and flyers
- Instagram/Facebook event posts  
- Meeting invites from emails
- Conference schedules
- Pretty much any image with event info

## Setup

You'll need an OpenAI API key. Get one at [platform.openai.com/api-keys](https://platform.openai.com/api-keys).

Then just:
```bash
git clone <your-repo>
cd smartCapture
python3 -m http.server 8000
```

Open `localhost:8000`, paste your API key, and you're good to go.

Or just open `index.html` directly in your browser if you don't care about the dev server.

## How to use

1. Upload/paste a screenshot
2. Click "Extract Event Details"
3. Review what it found (edit if needed)
4. Download the .ics file
5. Import to your calendar app

The .ics files work with Google Calendar, Apple Calendar, Outlook, whatever.

## Tech

- Vanilla JS (no frameworks, keeping it simple)
- OpenAI GPT-4o Vision API for the image analysis
- Standard iCalendar format for the output

## Privacy stuff

Your API key stays in your browser's localStorage. Images go straight to OpenAI's API over HTTPS. Nothing touches our servers because there are no servers.

## Costs

About half a cent per image analysis through OpenAI. Check their current pricing at [openai.com/pricing](https://openai.com/pricing).

## Common issues

**Clipboard paste doesn't work**: Your browser might need HTTPS for clipboard access. Just use the file upload button instead.

**API errors**: Make sure your key is valid and you have credits in your OpenAI account.

**Bad extraction**: Try a clearer image, or just manually edit the fields after extraction.

## Contributing

PRs welcome. Keep it simple.

## License

MIT

