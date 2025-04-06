# WhatsApp Audio Transcription Bot

This bot listens for audio messages on WhatsApp and transcribes them using Groq's Whisper API.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the project root and add your Groq API key:
```
GROQ_API_KEY=your_groq_api_key_here
```

3. Run the bot:
```bash
node app.js
```

4. Scan the QR code with WhatsApp to log in.

## Usage

1. Send any audio message or voice note to the WhatsApp number linked to the bot
2. The bot will automatically transcribe the audio and reply with the transcription text

## Requirements

- Node.js v14 or higher
- A Groq API key
- WhatsApp account
- Stable internet connection

## Notes

- The bot temporarily stores audio files locally before transcription and deletes them immediately after
- Make sure to keep your API keys secure and never commit them to version control 