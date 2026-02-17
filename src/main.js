import "./styles/normalize.css";

// NOTE: Mocked implementation below,
// but the logic will be the same for the real version

const getMic = new Promise((resolve) => setTimeout(() => resolve(true), 2000));
const getModel = new Promise((resolve) =>
    setTimeout(() => resolve(true), 4000),
);

const appState = {
    MODEL_READY: false,
    MICROPHONE_READY: false,
};
const STATE = {
    IDLE: "IDLE",
    IN_PROGRESS: "IN_PROGRESS",
    SUCCESS: "SUCCESS",
    ERROR: "ERROR",
};
const recordTextButton = {
    Record: "Record",
    Stop: "Stop",
};

let transcriptionState = STATE.IDLE;

const information = document.querySelector("#text-information");
const transcribeTextArea = document.querySelector("#transcription");
const recordButton = document.querySelector("#recording-button");

try {
    recordButton.addEventListener("click", () => {
        if (
            recordButton.textContent === recordTextButton.Record &&
            transcriptionState === STATE.IDLE
        ) {
            information.textContent = "Recording...";
            transcriptionState = STATE.IN_PROGRESS;

            transcribeTextArea.hidden = true;

            recordButton.textContent = recordTextButton.Stop;
            // NOTE: Ensure the audio clip have the maximum size of 30 seconds
            setTimeout(() => {
                recordButton.click();
            }, 30000);
        } else if (
            recordButton.textContent === recordTextButton.Stop &&
            transcriptionState === STATE.IN_PROGRESS
        ) {
            information.textContent = "Ready for next transcription";

            transcribeTextArea.hidden = false;
            transcribeTextArea.textContent = "lorem ipsum dolor met";
            transcriptionState = STATE.SUCCESS;

            recordButton.textContent = recordTextButton.Record;
            transcriptionState = STATE.IDLE;
        } else {
            transcriptionState = STATE.ERROR;
            throw new Error("recordButton/transcription Error");
        }
    });

    const mic = await getMic;
    if (mic) {
        appState.MICROPHONE_READY = true;
        information.textContent = "Microphone Ready! — Downloading the Model!";
    } else {
        throw new Error("Error: Microphone Not Found");
    }

    const model = await getModel;
    if (model) {
        appState.MODEL_READY = true;
        information.textContent = "Model Ready! — Ready to Transcribe!";
    } else {
        throw new Error("Error: Model Not Found");
    }

    recordButton.disabled = false;
} catch (err) {
    console.error(err);
    debugger;
}
