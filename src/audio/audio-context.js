import { getMicrophoneStream } from "./microphone";

const stream = await getMicrophoneStream();
const audioContext = new AudioContext({ sampleRate: 16000 });
const source = audioContext.createMediaStreamSource(stream);

await audioContext.audioWorklet.addModule(
    new URL("./worklet/pcm-processor.js", import.meta.url),
);

const workletNode = new AudioWorkletNode(audioContext, "pcm-processor");

source.connect(workletNode);

export { workletNode };
