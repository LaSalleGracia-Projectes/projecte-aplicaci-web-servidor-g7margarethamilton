import { db } from "../config/firebaseConfig.js";
import { firebase_error, firebase_log } from "./../logger.js";

const deleteOldLogs = async () => {
    try {
        const today = new Date().toISOString().split("T")[0];
        const logsRef = db.collection("logs");
        const snapshot = await logsRef.orderBy("timestamp").get();

        if (snapshot.empty) return;

        const batch = db.batch();
        let deletedCount = 0;

        snapshot.forEach((doc) => {
            const logDate = doc.data().timestamp.split("T")[0];
            if (logDate !== today) {
                batch.delete(doc.ref);
                deletedCount++;
            }
        });

        if (deletedCount > 0) {
            await batch.commit();
            firebase_log(`🗑 INFO: Deleted ${deletedCount} old logs.`);
        }
    } catch (error) {
        firebase_error(`❌ ERROR deleting old logs: ${error}`);
    }
};

const logToFirestore = async (level: string, message: string) => {
    try {
        await db.collection("logs").add({
            level,
            message,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        firebase_error(`❌ ERROR saving log: ${error}`);
    }
};


setInterval(() => {
    deleteOldLogs();
}, 24 * 60 * 60 * 1000);

export default logToFirestore;
