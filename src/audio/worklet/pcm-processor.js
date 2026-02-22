class PCMProcessor extends AudioWorkletProcessor {
    constructor() {
        super();

        this.accumulated = [];
        this.isRecording = false;

        this.port.onmessage = ({ data }) => {
            if (data === "startRecording") {
                this.isRecording = true;
                this.accumulated = [];
            } else if (data === "stopRecording") {
                this.isRecording = false;
                this.flush();
            }
        };
    }

    flush() {
        const pcmBuffer = new Float32Array(this.accumulated);

        this.port.postMessage({ event: "data", audioData: pcmBuffer });
    }

    process(inputs) {
        const input = inputs[0];
        if (!input || input.length === 0) {
            return true;
        }

        if (this.isRecording) {
            const mono = input[0];
            for (let i = 0; i < mono.length; i++) {
                this.accumulated.push(mono[i]);
            }
        }

        return true;
    }
}

registerProcessor("pcm-processor", PCMProcessor);
