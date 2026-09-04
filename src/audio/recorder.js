import { emit, on } from "../eventBus.js";

let mediaRecorder;
let recordedChunks = [];

on("microphone:ready", ({ detail: micStream }) => {
    try {
        if (typeof MediaRecorder === "undefined") {
            emit(
                "recording:unavailable",
                new Error("Audio recording is not supported in this browser"),
            );
            return;
        }

        mediaRecorder = new MediaRecorder(micStream);
        mediaRecorder.ondataavailable = ({ data }) => {
            if (data.size > 0) {
                recordedChunks.push(data);
            }
        };
        mediaRecorder.onstop = () => {
            const audio = new Blob(recordedChunks, {
                type: mediaRecorder.mimeType,
            });
            recordedChunks = [];

            if (audio.size === 0) {
                emit("recording:error", new Error("No audio was recorded"));
                return;
            }

            emit("recording:audio", audio);
        };
        mediaRecorder.onerror = ({ error }) => {
            emit(
                "recording:error",
                error || new Error("Audio recording failed"),
            );
        };
    } catch (err) {
        emit("recording:unavailable", err);
    }
});

on("recording:start", () => {
    try {
        if (!mediaRecorder) {
            throw new Error("Audio recorder is not ready");
        }
        if (mediaRecorder.state !== "inactive") {
            throw new Error("Audio recorder is already active");
        }

        recordedChunks = [];
        mediaRecorder.start();
    } catch (err) {
        emit("recording:error", err);
    }
});

on("recording:stop", () => {
    try {
        if (!mediaRecorder) {
            throw new Error("Audio recorder is not ready");
        }
        if (mediaRecorder.state === "recording") {
            mediaRecorder.stop();
        }
    } catch (err) {
        emit("recording:error", err);
    }
});
