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

    const filtered = matches.filter(
        (m) => m.score >= SIMILARITY_THRESHOLD
    );

    if (filtered.length === 0) return [];

    const formattedMatches = filtered.map((m) => ({
        itemId: m.id,
        score: m.score,
        type: searchFor,
    }));

    await db.collection(`${itemType}_items`)
        .doc(itemId)
        .update({ matches: formattedMatches });

    return formattedMatches;
}
