const bus = new EventTarget();
const eventHistory = new Map();

export function emit(event, detail) {
    if (!eventHistory.has(event)) {
        eventHistory.set(event, []);
    }
    eventHistory.get(event).push(detail);

    bus.dispatchEvent(new CustomEvent(event, { detail }));
}

export function on(event, handler) {
    if (eventHistory.has(event)) {
        const details = eventHistory.get(event);
        for (const detail of details) {
            handler({ detail, type: event });
        }
    }

    bus.addEventListener(event, handler);
}
