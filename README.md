# TransApp

TransApp is a React Native TypeScript application that continuously listens to nearby Nepali conversations and translates finalized utterances into Hindi in real time. It uses Deepgram streaming diarization for speaker separation, Google Translate for Nepali to Hindi translation, MMKV for local storage, and React Native Paper for the mobile UI.

## Features

- Continuous microphone capture with start and stop controls
- Real-time Nepali transcript updates with interim and finalized states
- Speaker diarization normalized to Speaker 1, Speaker 2, and Speaker 3
- Hindi translation for each finalized Nepali utterance
- Local conversation session history using MMKV
- Conversation detail screen with TXT and PDF export plus native share sheet support
- Runtime API key overrides in Settings
- Microphone permission handling for Android and iOS

## Project structure

```text
src/
  components/
  database/
  hooks/
  screens/
  services/
  store/
  types/
  utils/
```

## Install

1. Use Node.js `20.19.4` or newer. The current React Native `0.82.0` toolchain warns on `20.19.3`.
2. Install dependencies:

```bash
npm install
```

3. Copy the environment template and add your keys:

```bash
cp .env.example .env
```

4. Start Metro:

```bash
npm start
```

5. Run on Android or iOS after completing the platform setup notes in [docs/android-setup.md](docs/android-setup.md) and [docs/ios-setup.md](docs/ios-setup.md).

## Environment variables

Add these keys to `.env`:

```env
DEEPGRAM_API_KEY=your_deepgram_api_key
GOOGLE_TRANSLATE_API_KEY=your_google_translate_api_key
GOOGLE_TRANSLATE_BASE_URL=https://translation.googleapis.com/language/translate/v2
DEFAULT_EXPORT_DIRECTORY=TransAppExports
ENABLE_VERBOSE_LOGGING=false
```

Settings screen values override the `.env` API keys at runtime.

## Streaming pipeline

1. `react-native-audio-record` captures mono 16 kHz PCM audio.
2. `speechService` streams audio to Deepgram using WebSocket.
3. Deepgram interim and final transcripts are parsed and mapped to normalized speaker labels.
4. Finalized Nepali utterances are sent to Google Translate.
5. The store updates the live transcript UI immediately and persists the session when listening stops.

## Local storage model

### ConversationSession

- `id`
- `title`
- `createdAt`

### ConversationItem

- `id`
- `sessionId`
- `speakerNumber`
- `nepaliText`
- `hindiText`
- `timestamp`

## Export behavior

- TXT exports use `react-native-fs`
- PDF exports use `react-native-html-to-pdf`
- Sharing uses `react-native-share`
- WhatsApp, email, and other share targets depend on installed apps on the device

## Noise reduction

The app is configured around the Deepgram server-side preprocessing path. The settings model also exposes `webrtc` and `rnnoise` modes so a native DSP module can be swapped in later without changing the UI or store contracts.

## Validation

TypeScript validation completed successfully with:

```bash
npm run typecheck
```

## Example conversation output

```text
Speaker 1
Nepali: तिमी कहाँ जाँदैछौ?
Hindi: तुम कहाँ जा रहे ho?

Speaker 2
Nepali: म बजार जाँदैछु
Hindi: मैं बाज़ार जा रहा हूँ

Speaker 3
Nepali: बेलुका भेटौंला
Hindi: शाम को मिलते हैं
```

## Important implementation notes

- This workspace contains the full app-layer code, but not generated `android/` and `ios/` native project folders. Create a bare React Native shell with `npx @react-native-community/cli init` or `npx react-native init`, then copy this source tree into it.
- Deepgram model and query parameters may need tuning based on your account tier and Nepali-language support rollout.
- If you want real native RNNoise or WebRTC preprocessing, add the corresponding native audio module and implement it in `src/services/audioProcessingService.ts`.