import { Router } from "express";
import { db } from "../../config/firebaseConfig.js";

const router = Router();

// 🔥 Ruta per eliminar TOTS els logs
router.delete("/log", async (req, res) => {
    try {
        let totalDeleted = 0;
        const logsRef = db.collection("logs");

        while (true) {
            const snapshot = await logsRef.limit(50).get();

            if (snapshot.empty) break;

            const batch = db.batch();
            snapshot.forEach((doc) => batch.delete(doc.ref));
            await batch.commit();

            totalDeleted += snapshot.size;
            console.log(`🗑 INFO: Deleted ${snapshot.size} logs...`);
        }

        console.log(`🗑 INFO: Deleted ${totalDeleted} logs in total.`);
        return res.status(200).json({ message: `Deleted ${totalDeleted} logs.` });

    } catch (error) {
        console.error(`❌ ERROR deleting logs: ${error}`);
        return res.status(500).json({ message: "Error deleting logs.", error });
    }
});

export default router;
