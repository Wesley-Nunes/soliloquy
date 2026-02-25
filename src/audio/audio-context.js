let workletNode;

async function loadAudioContext(micStream) {
    const audioContext = new AudioContext({ sampleRate: 16000 });
    const source = audioContext.createMediaStreamSource(micStream);

    await audioContext.audioWorklet.addModule(
        new URL("./worklet/pcm-processor.js", import.meta.url),
    );

    workletNode = new AudioWorkletNode(audioContext, "pcm-processor");

    source.connect(workletNode);
}

function getPCM() {
    return workletNode;
}

export { loadAudioContext, getPCM };
