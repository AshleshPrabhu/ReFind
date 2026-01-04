import * as admin from "firebase-admin";
import { onCall } from "firebase-functions/v2/https";
import { findSimilarItems } from "./vertex";
import { generateEmbedding } from "./vertexEmbeddings";

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
        console.log(`  Exact category match`);
        return true;
    }
    
    for (const [groupName, members] of Object.entries(CATEGORY_GROUPS)) {
        const sourceInGroup = members.includes(sourceLower);
        const targetInGroup = members.includes(targetLower);
        if (sourceInGroup && targetInGroup) {
            console.log(`  Same category group: ${groupName}`);
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
        return;
    }

    await ref.update({
        matches: [...existingMatches, match],
    });
}

export const manualRecheck = onCall(async (request) => {
    if (!request.auth) throw new Error("Unauthorized");

    const { itemId, type } = request.data as {
        itemId: string;
        type: "lost" | "found";
    };

    if (!itemId || !type) throw new Error("Missing params");

    console.log("\nManual recheck initiated for:", type, itemId);

    const sourceRef = db.collection(`${type}_items`).doc(itemId);
    const sourceSnap = await sourceRef.get();
    if (!sourceSnap.exists) throw new Error("Item not found");

    const sourceData = sourceSnap.data();
    if (!sourceData?.semanticDescription)
        throw new Error("Semantic description missing");

    const imageAnalysis = sourceData.imageAnalysis || "";
    const embeddingInput = `
    OBJECT TYPE (CRITICAL): ${sourceData.category}

    IMAGE ANALYSIS (PRIMARY SOURCE - MOST IMPORTANT):
    ${imageAnalysis}

    IMAGE ANALYSIS (REPEATED FOR EMPHASIS):
    ${imageAnalysis}

    IMAGE ANALYSIS (THIRD EMPHASIS):
    ${imageAnalysis}

    SEMANTIC SUMMARY:
    ${sourceData.semanticDescription}

    ITEM NAME: ${sourceData.name}

    USER DESCRIPTION:
    ${sourceData.rawDescription}

    LOCATION: ${sourceData.location ?? "Unknown"}
    LOCATION DETAILS: ${sourceData.locationDescription ?? "None"}

    COORDINATES: ${sourceData.coordinates ? `${sourceData.coordinates.lat}, ${sourceData.coordinates.lng}` : "Unknown"}
    `;

    console.log("Generating embedding for recheck...");
    const embedding = await generateEmbedding(embeddingInput);
    const searchFor = type === "lost" ? "found" : "lost";

    console.log("Searching for similar items...");
    const aiMatches = await findSimilarItems(embedding, searchFor, 20);
    const filtered = aiMatches.filter((m) => m.score >= SIMILARITY_THRESHOLD);

    console.log(`Found ${filtered.length} matches above threshold`);

    let newMatchesAdded = 0;

    for (const m of filtered) {
        console.log(`\nChecking: ${m.id} (${(m.score * 100).toFixed(1)}%)`);
        
        const targetRef = db.collection(`${searchFor}_items`).doc(m.id);
        const targetSnap = await targetRef.get();
        if (!targetSnap.exists) {
            console.log("  Not found");
            continue;
        }

        const targetData = targetSnap.data();
        const targetUserId = targetData?.userId;
        if (!targetUserId) {
            console.log("  No userId");
            continue;
        }

        const targetImageAnalysis = targetData.imageAnalysis || "";
        const isCompatible = areItemsCompatible(
            sourceData.category,
            targetData.category,
            imageAnalysis,
            targetImageAnalysis
        );

        const veryHighSimilarity = m.score >= 0.85;
        
        if (!isCompatible && !veryHighSimilarity) {
            console.log(`  Incompatible`);
            continue;
        }
        
        if (veryHighSimilarity && !isCompatible) {
            console.log(`  High similarity override`);
        }

        if (sourceData.coordinates && targetData.coordinates) {
            const distance = calculateDistance(
                sourceData.coordinates.lat,
                sourceData.coordinates.lng,
                targetData.coordinates.lat,
                targetData.coordinates.lng
            );
            if (distance > MAX_DISTANCE_KM) {
                console.log(`  Too far: ${distance.toFixed(2)}km`);
                continue;
            }
            console.log(`  Distance: ${distance.toFixed(2)}km`);
        }

        const sourceMatch = {
            itemId: m.id,
            userId: targetUserId,
            score: m.score,
            type: searchFor,
            status: "pending",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            matchedCategory: targetData.category,
        };

        const targetMatch = {
            itemId,
            userId: sourceData.userId,
            score: m.score,
            type,
            status: "pending",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            matchedCategory: sourceData.category,
        };

        await writeMatchToItem(type, itemId, sourceMatch);
        await writeMatchToItem(searchFor, m.id, targetMatch);

        newMatchesAdded++;
        console.log(`Match added`);
    }

    await sourceRef.update({
        lastCheckedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`\nManual recheck complete. New matches: ${newMatchesAdded}\n`);

    return { success: true, newMatchesAdded };
});