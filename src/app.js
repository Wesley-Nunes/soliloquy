import { on, emit } from "./eventBus.js";
import { getMicrophoneStream, getPCM, loadAudioContext } from "./audio";
import "./audio/recorder.js";

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
try {
    const micStream = await getMicrophoneStream();
    emit("microphone:ready", micStream);
} catch (err) {
    emit("microphone:error", err);
}

// 3. Audio Context
on("microphone:ready", async ({ detail: micStream }) => {
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
const recordingAudio = document.querySelector("#recording-audio");
const setupComplete = { model: false, audio: false };
const READY_TEXT = "Ready to record";
let pendingAudio;
let pendingTranscription;
let recordingUrl;
let recorderUnavailable = false;

function enableStartWhenReady() {
    if (setupComplete.model && setupComplete.audio && !recorderUnavailable) {
        startButton.disabled = false;
    }
}

function resetAudioPlayer() {
    pendingAudio = undefined;
    pendingTranscription = undefined;
    recordingAudio.pause();
    recordingAudio.removeAttribute("src");
    recordingAudio.load();
    recordingAudio.hidden = true;

    if (recordingUrl) {
        URL.revokeObjectURL(recordingUrl);
        recordingUrl = undefined;
    }
}

function showRecordingResult() {
    if (!pendingAudio || pendingTranscription === undefined) {
        return;
    }

    if (recordingUrl) {
        URL.revokeObjectURL(recordingUrl);
    }
    recordingUrl = URL.createObjectURL(pendingAudio);
    recordingAudio.src = recordingUrl;
    recordingAudio.hidden = false;
    transcription.textContent = pendingTranscription;
    textInformation.textContent = READY_TEXT;
    startButton.disabled = false;
}

startButton.addEventListener("click", () => {
    emit("recording:start");
});
stopButton.addEventListener("click", () => {
    emit("recording:stop");
});

on("model:ready", () => {
    setupComplete.model = true;
    if (setupComplete.audio) {
        enableStartWhenReady();
        if (!recorderUnavailable) {
            textInformation.textContent = READY_TEXT;
            textInformation.style.backgroundColor = "transparent";
            textInformation.style.color = "var(--text-light)";
            transcription.disabled = false;
        }
    }
});
on("audio:ready", () => {
    setupComplete.audio = true;
    if (setupComplete.model) {
        enableStartWhenReady();
        if (!recorderUnavailable) {
            textInformation.textContent = READY_TEXT;
            textInformation.style.backgroundColor = "transparent";
            textInformation.style.color = "var(--text-light)";
            transcription.disabled = false;
        }
    }
});
on("model:result", ({ detail }) => {
    pendingTranscription = detail;
    showRecordingResult();
});
on("recording:audio", ({ detail }) => {
    pendingAudio = detail;
    showRecordingResult();
});
on("recording:start", () => {
    resetAudioPlayer();
    transcription.textContent = "";
    startButton.disabled = true;
    stopButton.disabled = false;
    textInformation.textContent = "Recording...";
});
on("recording:stop", () => {
    startButton.disabled = true;
    stopButton.disabled = true;
    textInformation.textContent = "Transcribing...";
});
on("recording:error", ({ detail }) => {
    console.error(detail);
    enableStartWhenReady();
    stopButton.disabled = true;
    textInformation.textContent = "Recording failed";
});
on("recording:unavailable", ({ detail }) => {
    recorderUnavailable = true;
    console.error(detail);
    startButton.disabled = true;
    stopButton.disabled = true;
    textInformation.textContent = "Audio recording is unavailable";
});
on("model:error", ({ detail }) => {
    console.error(detail);
    enableStartWhenReady();
    stopButton.disabled = true;
    textInformation.textContent = "Transcription failed";
});

window.addEventListener("pagehide", () => {
    if (recordingUrl) {
        URL.revokeObjectURL(recordingUrl);
    }
});

// NOTE: Temporally log the errors:
on("microphone:error", ({ detail }) => console.error(detail));
on("audio:error", ({ detail }) => console.error(detail));
on("pcm:error", ({ detail }) => console.error(detail));
on("ui:error", ({ detail }) => console.error(detail));
