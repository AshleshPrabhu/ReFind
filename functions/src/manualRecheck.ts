import * as admin from "firebase-admin";
import { onCall } from "firebase-functions/v2/https";
import { findSimilarItems } from "./vertex";

const db = admin.firestore();
const SIMILARITY_THRESHOLD = 0.75;

export const manualRecheck = onCall(async (request) => {
    if (!request.auth) {
        throw new Error("Unauthorized");
    }

    const { itemId, type } = request.data as {
        itemId: string;
        type: "lost" | "found";
    };

    if (!itemId || !type) {
        throw new Error("Missing itemId or type");
    }

    const docRef = db.collection(`${type}_items`).doc(itemId);
    const snap = await docRef.get();

    if (!snap.exists) {
        throw new Error("Item not found");
    }

    const data = snap.data();
    if (!data || !data.embeddingId) {
        throw new Error("Embedding not found");
    }

    const matches = await findSimilarItems(
        [],
        type === "lost" ? "found" : "lost"
    );

    const filteredMatches = matches.filter(
        (m) => m.score >= SIMILARITY_THRESHOLD
    );

    await docRef.update({
        matches: filteredMatches.map((m) => ({
            itemId: m.id,
            score: m.score,
            type: type === "lost" ? "found" : "lost",
        })),
        lastCheckedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
        success: true,
        matches: filteredMatches,
    };
});
