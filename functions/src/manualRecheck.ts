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

    const searchFor = type === "lost" ? "found" : "lost";

    const aiMatches = await findSimilarItems(
        [],
        searchFor
    );

    const filteredMatches = aiMatches.filter(
        (m) => m.score >= SIMILARITY_THRESHOLD
    );

    const existingMatches = data.matches || [];

    const matchMap = new Map<string, any>();
    existingMatches.forEach((m: any) => {
        matchMap.set(m.itemId, m);
    });

    filteredMatches.forEach((m) => {
        if (!matchMap.has(m.id)) {
        matchMap.set(m.id, {
            itemId: m.id,
            score: m.score,
            type: searchFor,
            status: "pending",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        }
    });

    const mergedMatches = Array.from(matchMap.values());

    await docRef.update({
        matches: mergedMatches,
        lastCheckedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
        success: true,
        newMatchesAdded:
        mergedMatches.length - existingMatches.length,
        matches: mergedMatches,
    };
});
