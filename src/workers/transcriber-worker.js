import { pipeline } from "@huggingface/transformers";

let transcriber;

try {
    transcriber = await pipeline(
        "automatic-speech-recognition",
        "Xenova/whisper-tiny.en",
    );
    postMessage({ type: "ready" });
} catch (error) {
    postMessage({ type: "error", error: error.message });
}

onmessage = async (event) => {
    try {
        const { audio } = event.data;
        const output = await transcriber(audio);
        postMessage({ type: "result", text: output.text });
    } catch (error) {
        postMessage({ type: "error", error: error.message });
    }
};
