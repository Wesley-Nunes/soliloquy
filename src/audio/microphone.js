export async function getMicrophoneStream() {
    try {
        if (!navigator.mediaDevices?.getUserMedia) {
            throw new Error("getUserMedia is not supported in this browser");
        }

        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                channelCount: 1,
                sampleRate: 16000,
                echoCancellation: true,
                noiseSuppression: true,
            },
        });

        return stream;
    } catch (err) {
        if (err.name === "NotAllowedError") {
            throw new Error("Microphone permission denied");
        }
        if (err.name === "NotFoundError") {
            throw new Error("No microphone found");
        }
        if (err.name === "OverconstrainedError") {
            throw new Error("Requested audio constraints cannot be satisfied");
        }

        throw err;
    }
}
