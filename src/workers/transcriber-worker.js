import { pipeline } from "@huggingface/transformers";

let transcriber;

try {
    transcriber = await pipeline(
        "automatic-speech-recognition",
        "Xenova/whisper-tiny.en",
    );
    postMessage({ event: "model:ready" });
} catch (error) {
    postMessage({ event: "model:error", content: error.message });
}

onmessage = async (event) => {
    try {
        const { audio } = event.data;
        const output = await transcriber(audio);
        postMessage({ event: "model:result", content: output.text });
    } catch (error) {
        postMessage({ event: "model:error", content: error.message });
    }
};
