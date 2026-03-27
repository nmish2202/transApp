# Nepali to Hindi Web Recorder

This web app records audio in the browser, then transcribes with Deepgram and translates to Hindi using Google Translate API.

## Setup

1. Copy `.env.example` to `.env`.
2. Set keys:
   - `VITE_DEEPGRAM_API_KEY`
   - `VITE_GOOGLE_TRANSLATE_API_KEY`
3. Install dependencies:
   - `npm install`

## Run

- Dev server: `npm run dev`
- Production build: `npm run build`
- Preview build: `npm run preview`

## Usage

1. Enter API keys (or use `.env`).
2. Click `Start Recording`.
3. Speak/play Nepali audio.
4. Click `Stop and Process`.
5. Open the saved session in the left panel to view speaker turns and Hindi translation.
