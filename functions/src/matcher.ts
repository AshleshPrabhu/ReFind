import * as admin from "firebase-admin";
import { findSimilarItems } from "./vertex";

const db = admin.firestore();

const SIMILARITY_THRESHOLD = 0.75;

export async function runSimilarityCheck(
    itemId: string,
    itemType: "lost" | "found",
    embedding: number[]
) {
    const searchFor = itemType === "lost" ? "found" : "lost";

    const matches = await findSimilarItems(embedding, searchFor);
    const filtered = matches.filter(m => m.score >= SIMILARITY_THRESHOLD);

    if (filtered.length === 0) return [];

    const docRef = db.collection(`${itemType}_items`).doc(itemId);
    const snap = await docRef.get();

    const existingMatches = snap.data()?.matches || [];

    const matchMap = new Map(
        existingMatches.map((m: any) => [m.itemId, m])
    );

    filtered.forEach(m => {
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

    await docRef.update({ matches: mergedMatches });

    return mergedMatches;
}
