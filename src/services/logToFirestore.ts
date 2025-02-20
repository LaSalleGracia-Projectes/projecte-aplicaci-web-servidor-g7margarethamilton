import { db } from "../config/firebaseConfig.js";
import { firebase_log, firebase_error } from './../logger.js';


const logToFirestore = async (level: string, message: string) => {
    try {
        await db.collection("logs").add({
            level,
            message,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        firebase_error(error);
    }
};

export default logToFirestore;
