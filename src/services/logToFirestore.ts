import { db } from "../config/firebaseConfig.js";

const logToFirestore = async (level: string, message: string) => {
    try {
        await db.collection("logs").add({
            level,
            message,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error(`❌ ERROR saving log: ${error}`);
    }
};

export default logToFirestore;
