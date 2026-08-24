# Soliloquy

A lightweight, browser-based speech-to-text app. Soliloquy records spoken English through your microphone and transcribes it locally in the browser with Whisper Tiny.

## Features

- Records audio directly from your microphone
- Transcribes English speech with `Xenova/whisper-tiny.en`
- Keeps transcription work off the UI thread with a Web Worker
- Uses an AudioWorklet to collect PCM audio samples
- Requires no application backend

## Requirements

- Node.js 24
- A modern browser with microphone, Web Audio, AudioWorklet, and Web Worker support
- Microphone permission
- Internet access the first time the Whisper model is downloaded

## Getting started

```bash
npm install
npm run dev
```

Open the local URL shown by Vite, allow microphone access, and wait until the app says "Ready to record."

## Usage

1. Click **Start** to begin recording.
2. Speak into your microphone.
3. Click **Stop** to send the captured audio for transcription.
4. Review or edit the resulting text.

## Commands

```bash
npm run dev      # Start the Vite development server
npm run build    # Lint and create a production build
npm run preview  # Preview the production build
npm run lint     # Run ESLint
```

## Architecture

```text
Microphone
  → AudioContext + PCM AudioWorklet
  → application event bus
  → transcription Web Worker
  → Whisper Tiny English model
  → transcript textarea
```

The app coordinates readiness, recording, and error events through a small in-memory event bus. The Whisper model runs in a dedicated worker so model loading and transcription do not block the page UI.

## Limitations

- The bundled model is English-only.
- Transcription happens after recording stops; it is not live streaming transcription.
- Accuracy and startup time are constrained by the small Whisper Tiny model and the user's device.
- The browser may choose an audio sample rate different from the requested 16 kHz.

## Privacy

Audio capture and transcription are performed in the browser. On first use, the Whisper model may be downloaded and cached by the browser; this app does not include its own server-side audio processing.

## <a name="author">Author</a>

Developed by **Wesley Nunes**

- [GitHub](https://github.com/Wesley-Nunes/)
- [LinkedIn](https://www.linkedin.com/in/dev-wesley-nunes)
