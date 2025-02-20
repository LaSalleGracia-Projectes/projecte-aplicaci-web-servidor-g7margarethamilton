import logToFirestore from "./services/logToFirestore.js";

const firebase_log = (message: string) => {
    console.log(message);
    logToFirestore("info", message);
};

const firebase_error = (message: string) => {
    console.error(message);
    logToFirestore("error", message);
};

export { firebase_log, firebase_error };
