# AGENTS.md – Project Instructions for Codex

## Project Overview

- **Name**: Soliloquy
- **Stack**: JavaScript (Vanilla), Vite, AudioWorklet, Web Workers
- **Purpose**: A lightweight, browser-based speech-to-text application using the `Xenova/whisper-tiny.en` model.

## Development Environment

- Use `npm` for dependency management.
- Node version: `">=24 <25"`.
- Run `npm install` to install dependencies.
- Run `npm run dev` to start the Vite development server.
- Run `npm run build` to produce the production build.

## Coding Conventions

- Use `async/await` with `try/catch` to handle errors gracefully.
- Prefer `const` over `let`; avoid `var`.
- **Naming**:
  - Classes: `PascalCase`
  - Functions/variables: `camelCase`
  - Constants: `UPPER_SNAKE_CASE`

## Project Structure

```
src/
├── audio/          # Handles mediaDevices, AudioContext, and AudioWorklet logic
├── style/          # CSS styles
├── worker/         # Manages the ASR model (Xenova/whisper-tiny.en) via Web Worker
├── app.js          # Creates and orchestrates the moving parts (UI, audio, events)
├── eventBus.js     # Small in-memory event bus for decoupled communication
└── main.js         # Entry point
index.html
vite.config.js
README.md
AGENTS.md
```

## Script Communication & Event-Driven Architecture

This project uses a **centralized Event Bus** (`eventBus.js`) to decouple all components. The bus is built on `EventTarget` and has a critical behavior: `on()` immediately replays any events that were emitted _before_ the listener was registered (via an internal `eventHistory`). This ensures that late-bound UI components or modules never miss initialization signals (e.g., `model:ready`).

### Event Bus Rules

- **Never** import components directly into each other (e.g., audio module importing UI). All communication must happen via `emit()` and `on()`.
- **Always** use the bus for state changes. Avoid direct function calls across modules.
- The bus replays past events; be mindful that a listener registered later will immediately receive past `model:ready` or `audio:ready` events.

### Initialization Waterfall (Strict Order)

The app boots in a strict sequential order, gated by bus events. Do not reorder or parallelize these steps without updating the corresponding listeners.

1. **Worker Instantiation**: `app.js` creates `transcriber-worker.js` immediately. The worker's `message` and `error` events are piped directly to the bus (`model:ready`, `model:result`, `model:error`).
2. **Microphone**: `getMicrophoneStream()` is called. Success → emits `microphone:ready`.
3. **Audio Context**: Listens for `microphone:ready`, then calls `loadAudioContext()`. Success → emits `audio:ready`.
4. **PCM Processor**: Listens for `audio:ready`, then creates the PCM handler via `getPCM()`. The PCM's `port.onmessage` is piped to the bus (`pcm:data`, `pcm:error`).
5. **UI Activation**: Listens for both `model:ready` AND `audio:ready` (using a local `setupComplete` flag). Only when **both** are `true` does it enable the "Start" button and update the status text.

### Recording Data Flow (Circular Path)

When a user records, data flows in a full circle through the bus:

- **Start/Stop**: UI button clicks → `emit('recording:start'/'stop')`. The PCM module listens for these and forwards them to its `port`.
- **Audio Data**: The PCM Worklet processes audio frames → emits `pcm:data` on the bus with the raw audio payload.
- **Transcription**: `app.js` listens for `pcm:data`, receives the payload, and forwards it to the worker via `transcriber.postMessage({ audio: detail })`.
- **Result**: Worker finishes transcribing → sends `model:result` to the main thread → `app.js` pipes it to the bus → UI listener updates `transcription.textContent`.

### Error Handling

All critical errors (`model:error`, `microphone:error`, `audio:error`, `pcm:error`, `recording:error`, `ui:error`) must be emitted to the bus rather than thrown synchronously. Currently, these are logged to the console via temporary listeners. When extending or refactoring, **always** use the bus for error propagation to keep the UI responsive and the modules decoupled.

## Testing

- **Currently, no test runner (e.g., Jest, Vitest) is configured in this project.**
- **Do not create, modify, or suggest test files (`*.test.js`, `*.spec.js`) unless explicitly requested by the user.**

## Linting & Formatting

- Prettier and ESLint are configured with codex hooks.
- Codex must write code that conforms to the existing default rules.
- Do not suggest running `npm run lint` or `npm run format` commands unless the user asks for them.

## Git & Commit Messages

- Follow Conventional Commits: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`.
- Keep commits atomic; reference issue numbers when applicable (e.g., `fix: #123`).
- PRs require at least one approval.

## Build & Deployment

- The output directory for `npm run build` is `dist/` (Vite default).
- Do not reference `dist/` files in `index.html` manually; Vite handles injection.
