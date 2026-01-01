import * as admin from "firebase-admin";
import { findSimilarItems } from "./vertex";

const db = admin.firestore();

const SIMILARITY_THRESHOLD = 0.70;

async function writeMatchToItem(
    itemType: "lost" | "found",
    itemId: string,
    match: any
) {
    const ref = db.collection(`${itemType}_items`).doc(itemId);
    const snap = await ref.get();
    if (!snap.exists) return;

    const existingMatches = snap.data()?.matches || [];

    if (existingMatches.some((m: any) => m.itemId === match.itemId)) {
        console.log(" Match already exists, skipping");
        return;
    }

    await ref.update({
        matches: [...existingMatches, match],
    });
    
    console.log("Match written to", itemType, "item:", itemId);
}

export async function runSimilarityCheck(
    itemId: string,
    itemType: "lost" | "found",
    embedding: number[]
) {
    console.log("Running similarity check for:", itemType, itemId);
    
    const searchFor = itemType === "lost" ? "found" : "lost";

    const aiMatches = await findSimilarItems(embedding, searchFor);
    console.log("AI matches found:", aiMatches.length);
    console.log("AI matches:", JSON.stringify(aiMatches, null, 2));
    
    const filtered = aiMatches.filter(m => m.score >= SIMILARITY_THRESHOLD);
    console.log("Filtered matches (score >=", SIMILARITY_THRESHOLD, "):", filtered.length);

    if (filtered.length === 0) {
        console.log("No matches above threshold");
        return [];
    }

    const sourceRef = db.collection(`${itemType}_items`).doc(itemId);
    const sourceSnap = await sourceRef.get();
    if (!sourceSnap.exists) return [];

    const sourceUserId = sourceSnap.data()?.userId;
    if (!sourceUserId) return [];

    const now = new Date();

    for (const m of filtered) {
        const targetRef = db.collection(`${searchFor}_items`).doc(m.id);
        const targetSnap = await targetRef.get();
        if (!targetSnap.exists) {
            console.log("Target item not found:", m.id);
            continue;
        }

        const targetUserId = targetSnap.data()?.userId;
        if (!targetUserId) {
            console.log("Target item has no userId:", m.id);
            continue;
        }

        const sourceMatch = {
            itemId: m.id,
            userId: targetUserId,
            score: m.score,
            type: searchFor,
            status: "pending",
            createdAt: now, 
        };

        const targetMatch = {
            itemId,
            userId: sourceUserId,
            score: m.score,
            type: itemType,
            status: "pending",
            createdAt: now, 
        };

        await writeMatchToItem(itemType, itemId, sourceMatch);
        await writeMatchToItem(searchFor, m.id, targetMatch);
    }

    console.log("Similarity check complete, found", filtered.length, "matches");
    return filtered;
}