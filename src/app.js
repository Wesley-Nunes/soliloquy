import { on, emit } from "./eventBus.js";
import { getMicrophoneStream, getPCM, loadAudioContext } from "./audio";

// 1. Model
try {
    const transcriber = new Worker(
        new URL("./workers/transcriber-worker.js", import.meta.url),
        {
            type: "module",
        },
    );
    transcriber.onmessage = ({ data }) => {
        const { event, content } = data;
        if (event === "model:ready") {
            emit(event);
        } else if (event === "model:result") {
            emit(event, content);
        } else if (event === "model:error") {
            emit("model:error", content);
        }
    };
    transcriber.onerror = (err) => {
        emit("model:error", err.message || err);
    };
    on("pcm:data", ({ detail }) => {
        transcriber.postMessage({ audio: detail });
    });
} catch (err) {
    emit("model:error", err);
}

// 2. Microphone
let micStream;
try {
    micStream = await getMicrophoneStream();
    emit("microphone:ready");
} catch (err) {
    emit("microphone:error", err);
}

// 3. Audio Context
on("microphone:ready", async () => {
    try {
        await loadAudioContext(micStream);

        emit("audio:ready");
    } catch (err) {
        emit("audio:error", err);
    }
});

// 4. PCM
let pcm;
on("audio:ready", () => {
    pcm = getPCM();

    pcm.port.onmessage = ({ data }) => {
        const { event, content } = data;
        if (event === "pcm:data") {
            emit("pcm:data", content);
        } else if (event === "pcm:error") {
            emit("pcm:error", content);
        }
    };
});
on("recording:start", () => {
    pcm.port.postMessage("recording:start");
});
on("recording:stop", () => {
    pcm.port.postMessage("recording:stop");
});

// 5. UI
const startButton = document.querySelector("#start");
const stopButton = document.querySelector("#stop");
const transcription = document.querySelector("#transcription");
const textInformation = document.querySelector("#text-information");
const setupComplete = { model: false, audio: false };
const READY_TEXT = "Ready to record";

startButton.addEventListener("click", () => {
    emit("recording:start");
});
stopButton.addEventListener("click", () => {
    emit("recording:stop");
});

on("model:ready", () => {
    setupComplete.model = true;
    if (setupComplete.audio) {
        startButton.disabled = false;
        textInformation.textContent = READY_TEXT;
        textInformation.style.backgroundColor = "transparent";
        textInformation.style.color = "var(--text-light)";
        transcription.disabled = false;
    }
});
on("audio:ready", () => {
    setupComplete.audio = true;
    if (setupComplete.model) {
        startButton.disabled = false;
        textInformation.textContent = READY_TEXT;
        textInformation.style.backgroundColor = "transparent";
        textInformation.style.color = "var(--text-light)";
        transcription.disabled = false;
    }
});
on("model:result", ({ detail }) => {
    transcription.textContent = detail;
    textInformation.textContent = READY_TEXT;
});
on("recording:start", () => {
    startButton.disabled = true;
    stopButton.disabled = false;
    textInformation.textContent = "Recording...";
});
on("recording:stop", () => {
    startButton.disabled = false;
    stopButton.disabled = true;
    textInformation.textContent = "Transcribing...";
});

// NOTE: Temporally log the errors:
on("model:error", ({ detail }) => console.error(detail));
on("microphone:error", ({ detail }) => console.error(detail));
on("audio:error", ({ detail }) => console.error(detail));
on("recording:error", ({ detail }) => console.error(detail));
on("pcm:error", ({ detail }) => console.error(detail));
on("ui:error", ({ detail }) => console.error(detail));
