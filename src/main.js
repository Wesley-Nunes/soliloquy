import { workletNode } from "./audio/audio-context";

import "./styles/normalize.css";

try {
    const transcriber = new Worker(
        new URL("./workers/transcriber-worker.js", import.meta.url),
        {
            type: "module",
        },
    );
    const startButton = document.querySelector("#start");
    const stopButton = document.querySelector("#stop");

    startButton.addEventListener("click", () => {
        workletNode.port.postMessage("startRecording");
    });
    stopButton.addEventListener("click", () => {
        workletNode.port.postMessage("stopRecording");
    });

    workletNode.port.onmessage = (event) => {
        if (event.data.event === "data") {
            const audio = event.data.audioData;
            transcriber.postMessage({ audio });
        }
    };

    transcriber.onmessage = (ev) => console.log(ev);
} catch (err) {
    console.error(err);
    // eslint-disable-next-line
    debugger;
}
