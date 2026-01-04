import * as admin from "firebase-admin";
import { findSimilarItems } from "./vertex";

const db = admin.firestore();

const SIMILARITY_THRESHOLD = 0.70;

const MAX_DISTANCE_KM = 2.0;

const CATEGORY_GROUPS: Record<string, string[]> = {
    "electronics": ["electronics", "phone", "laptop", "tablet", "headphones", "charger", "computer", "mobile", "smartwatch", "camera"],
    "containers": ["bottle", "container", "tumbler", "cup", "mug", "flask", "utensils"],
    "personal_items": ["wallet", "purse", "bag", "backpack", "keys", "keychain"],
    "documents": ["books", "notebook", "diary", "textbook", "documents", "papers", "id", "cards"],
    "clothing": ["clothing", "apparel", "fashion", "jacket", "shirt", "pants"],
    "accessories": ["accessories", "jewelry", "watch", "glasses", "sunglasses", "spectacles", "umbrella"],
};

function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371; 
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function extractObjectType(imageAnalysis: string): string {
    if (!imageAnalysis) return "";
    
    const firstLine = imageAnalysis.split('\n')[0].toLowerCase();
    
    const objectKeywords = [
        'laptop', 'macbook', 'computer', 'notebook computer',
        'phone', 'iphone', 'smartphone', 'mobile',
        'cup', 'mug', 'coffee cup', 'tea cup',
        'bottle', 'water bottle', 'flask', 'tumbler',
        'wallet', 'purse', 'bag', 'backpack',
        'keys', 'keychain',
        'diary', 'notebook', 'journal', 'book',
        'umbrella', 'glasses', 'sunglasses', 'watch',
        'charger', 'cable', 'headphones', 'earphones',
        'id', 'card', 'license'
    ];
    
    for (const keyword of objectKeywords) {
        if (firstLine.includes(keyword)) {
            return keyword;
        }
    }
    
    return firstLine.split('.')[0].trim();
}

function areItemsCompatible(
    sourceCategory: string,
    targetCategory: string,
    sourceImageAnalysis: string,
    targetImageAnalysis: string
): boolean {
    if (sourceImageAnalysis && targetImageAnalysis) {
        const sourceObject = extractObjectType(sourceImageAnalysis);
        const targetObject = extractObjectType(targetImageAnalysis);
        
        console.log(`  AI Analysis: "${sourceObject}" vs "${targetObject}"`);
        
        const sourceWords = sourceObject.split(' ');
        const targetWords = targetObject.split(' ');
        
        for (const word of sourceWords) {
            if (word.length > 3 && targetWords.includes(word)) {
                console.log(`  Shared keyword: "${word}"`);
                return true;
            }
        }
        
        const semanticPairs = [
        ['cup', 'mug', 'coffee', 'tea', 'utensils'],
        ['laptop', 'macbook', 'computer', 'notebook'],
        ['phone', 'mobile', 'iphone', 'smartphone'],
        ['bottle', 'flask', 'tumbler', 'container'],
        ['wallet', 'purse'],
        ['diary', 'notebook', 'journal', 'book'],
        ['keys', 'keychain'],
        ['glasses', 'sunglasses', 'spectacles'],
        ];
        
        for (const group of semanticPairs) {
        const sourceInGroup = group.some(word => sourceObject.includes(word));
        const targetInGroup = group.some(word => targetObject.includes(word));
        if (sourceInGroup && targetInGroup) {
            console.log(`  Semantic match in group: [${group.join(', ')}]`);
            return true;
        }
        }
    }
    
    const sourceLower = sourceCategory.toLowerCase();
    const targetLower = targetCategory.toLowerCase();
    
    if (sourceLower === targetLower) {
        console.log(`   Exact category match`);
        return true;
    }
    
    for (const [groupName, members] of Object.entries(CATEGORY_GROUPS)) {
        const sourceInGroup = members.includes(sourceLower);
        const targetInGroup = members.includes(targetLower);
        if (sourceInGroup && targetInGroup) {
            console.log(`   Same category group: ${groupName}`);
            return true;
        }
    }
    return false;
}

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
        console.log("  Match already exists, skipping");
        return;
    }

    await ref.update({
        matches: [...existingMatches, match],
    });

    console.log("  Match written to", itemType, "item:", itemId);
}

export async function runSimilarityCheck(
    itemId: string,
    itemType: "lost" | "found",
    embedding: number[],
    sourceData: any
) {
    console.log("\nRunning similarity check for:", itemType, itemId);

    const searchFor = itemType === "lost" ? "found" : "lost";

    const aiMatches = await findSimilarItems(embedding, searchFor, 20);
    console.log("AI matches found:", aiMatches.length);

    if (aiMatches.length === 0) {
        console.log("No matches found");
        return [];
    }

    let filtered = aiMatches.filter((m) => m.score >= SIMILARITY_THRESHOLD);
    console.log(
        ` Matches above threshold (${SIMILARITY_THRESHOLD}):`,
        filtered.length
    );

    const sourceRef = db.collection(`${itemType}_items`).doc(itemId);
    const sourceSnap = await sourceRef.get();
    if (!sourceSnap.exists) return [];

    const sourceUserId = sourceSnap.data()?.userId;
    if (!sourceUserId) return [];

    const sourceCategory = sourceData.category;
    const sourceCoords = sourceData.coordinates;
    const sourceImageAnalysis = sourceData.imageAnalysis || "";

    console.log("Source info:");
    console.log("  Category:", sourceCategory);
    console.log("  AI Analysis:", sourceImageAnalysis?.substring(0, 100) + "...");
    console.log("  Coordinates:", sourceCoords);

    const validMatches = [];

    for (const m of filtered) {
        console.log(`\nChecking match: ${m.id} (${(m.score * 100).toFixed(1)}% similar)`);
        
        const targetRef = db.collection(`${searchFor}_items`).doc(m.id);
        const targetSnap = await targetRef.get();

        if (!targetSnap.exists) {
            console.log("  Target item not found");
            continue;
        }

        const targetData = targetSnap.data();
        const targetUserId = targetData?.userId;

        if (!targetUserId) {
            console.log("  Target item has no userId");
            continue;
        }

        const targetCategory = targetData.category;
        const targetImageAnalysis = targetData.imageAnalysis || "";

        const isCompatible = areItemsCompatible(
            sourceCategory,
            targetCategory,
            sourceImageAnalysis,
            targetImageAnalysis
        );

        const veryHighSimilarity = m.score >= 0.80;
        
        if (!isCompatible && !veryHighSimilarity) {
            console.log(`  REJECTED: Incompatible items`);
            console.log(`     Categories: ${sourceCategory} vs ${targetCategory}`);
            continue;
        }
        
        if (veryHighSimilarity && !isCompatible) {
            console.log(`   Category mismatch BUT very high similarity (${(m.score * 100).toFixed(1)}%) - ACCEPTING`);
        }

        if (sourceCoords && targetData.coordinates) {
            const distance = calculateDistance(
                sourceCoords.lat,
                sourceCoords.lng,
                targetData.coordinates.lat,
                targetData.coordinates.lng
            );

            if (distance > MAX_DISTANCE_KM) {
                console.log(
                    `  REJECTED: Too far (${distance.toFixed(2)}km > ${MAX_DISTANCE_KM}km)`
                );
                continue;
            }

            console.log(`  Distance OK: ${distance.toFixed(2)}km`);
        }

        validMatches.push({
            matchData: m,
            targetUserId,
            targetData,
        });

        console.log(` VALID MATCH CONFIRMED`);
    }

    console.log(`\nFinal valid matches: ${validMatches.length}`);

    const now = new Date();

    for (const { matchData, targetUserId, targetData } of validMatches) {
        const sourceMatch = {
            itemId: matchData.id,
            userId: targetUserId,
            score: matchData.score,
            type: searchFor,
            status: "pending",
            createdAt: now,
            matchedCategory: targetData.category,
        };

        const targetMatch = {
            itemId,
            userId: sourceUserId,
            score: matchData.score,
            type: itemType,
            status: "pending",
            createdAt: now,
            matchedCategory: sourceCategory,
        };

        await writeMatchToItem(itemType, itemId, sourceMatch);
        await writeMatchToItem(searchFor, matchData.id, targetMatch);
    }

    console.log("Similarity check complete\n");
    return validMatches.map((v) => v.matchData);
}