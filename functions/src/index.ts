import * as admin from "firebase-admin";
admin.initializeApp();

import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { generateText } from "./vertexGemini";
import { generateEmbedding } from "./vertexEmbeddings";
import { upsertEmbedding } from "./vertex";
import { runSimilarityCheck } from "./matcher";
import { analyzeItemImage } from "./imageAI";
export { manualRecheck } from "./manualRecheck";

async function generateSemanticDescription(
    name: string,
    rawDescription: string,
    imageDescription: string,
    category: string,
    location?: string,
    locationDescription?: string
): Promise<string> {
    const prompt = `
    Create a detailed semantic summary for a lost/found item matching system.
    
    IMPORTANT: The image analysis is the MOST RELIABLE source. Prioritize it heavily.
    
    Given information:
    - Item Name: ${name}
    - Category: ${category}
    - Location: ${location ?? "Unknown"}
    - Location Details: ${locationDescription ?? "None"}
    - User Description: ${rawDescription}
    - AI Image Analysis: ${imageDescription}
    
    Create a comprehensive description that:
    1. Starts with the EXACT object type from the image analysis
    2. Includes all visual details from the image (brand, color, material, features)
    3. Adds relevant context from user description
    4. Mentions distinctive identifying features
    5. Notes the location for context
    
    Format: [Object Type] - [Brand/Model] - [Color] - [Material] - [Key Features] - [Location Context]
    
    Be EXTREMELY specific about object type. Never confuse categories.
    Return ONLY the summary, no explanation.
    `;

    const text = await generateText(prompt);
    return text.trim();
}

async function storeEmbedding(
    itemId: string,
    embedding: number[],
    type: "lost" | "found"
): Promise<string> {
    const vectorId = `${type}_${itemId}`;
    await upsertEmbedding(vectorId, embedding);
    return vectorId;
}

export const onLostItemCreate = onDocumentCreated(
    {
        document: "lost_items/{itemId}",
    },
    async (event) => {
        const snap = event.data;
        if (!snap) return;

        const data = snap.data();
        if (!data || data.embeddingId) return;

        console.log("Processing Lost Item:", event.params.itemId);

        let imageDescription = "";
        if (data.image) {
            console.log("Analyzing image...");
            imageDescription = await analyzeItemImage(data.image);
            console.log("Image Analysis Result:", imageDescription);
        }

        const semanticDescription = await generateSemanticDescription(
            data.name,
            data.rawDescription,
            imageDescription,
            data.category,
            data.location,
            data.locationDescription
        );
        console.log("Generated Semantic Description:", semanticDescription);

        const embeddingInput = `
    OBJECT TYPE (CRITICAL): ${data.category}

    IMAGE ANALYSIS (PRIMARY SOURCE - MOST IMPORTANT):
    ${imageDescription}

    IMAGE ANALYSIS (REPEATED FOR EMPHASIS):
    ${imageDescription}

    IMAGE ANALYSIS (THIRD EMPHASIS):
    ${imageDescription}

    SEMANTIC SUMMARY:
    ${semanticDescription}

    ITEM NAME: ${data.name}

    USER DESCRIPTION:
    ${data.rawDescription}

    LOCATION: ${data.location ?? "Unknown"}
    LOCATION DETAILS: ${data.locationDescription ?? "None"}

    COORDINATES: ${data.coordinates ? `${data.coordinates.lat}, ${data.coordinates.lng}` : "Unknown"}
    `;

        console.log("Generating embedding...");
        const embedding = await generateEmbedding(embeddingInput);

        const embeddingId = await storeEmbedding(
            event.params.itemId,
            embedding,
            "lost"
        );

        await snap.ref.update({
            semanticDescription,
            embeddingId,
            imageAnalysis: imageDescription,
        });

        console.log("Running similarity check...");
        await runSimilarityCheck(event.params.itemId, "lost", embedding, data);
    }
);

export const onFoundItemCreate = onDocumentCreated(
    {
        document: "found_items/{itemId}",
    },
    async (event) => {
        const snap = event.data;
        if (!snap) return;

        const data = snap.data();
        if (!data || data.embeddingId) return;

        console.log("Processing Found Item:", event.params.itemId);

        let imageDescription = "";
        if (data.image) {
            console.log("Analyzing image...");
            imageDescription = await analyzeItemImage(data.image);
            console.log("Image Analysis Result:", imageDescription);
        }

        const semanticDescription = await generateSemanticDescription(
            data.name,
            data.rawDescription,
            imageDescription,
            data.category,
            data.location,
            data.locationDescription
        );
        console.log("Generated Semantic Description:", semanticDescription);

        const embeddingInput = `
    OBJECT TYPE (CRITICAL): ${data.category}

    IMAGE ANALYSIS (PRIMARY SOURCE - MOST IMPORTANT):
    ${imageDescription}

    IMAGE ANALYSIS (REPEATED FOR EMPHASIS):
    ${imageDescription}

    IMAGE ANALYSIS (THIRD EMPHASIS):
    ${imageDescription}

    SEMANTIC SUMMARY:
    ${semanticDescription}

    ITEM NAME: ${data.name}

    USER DESCRIPTION:
    ${data.rawDescription}

    LOCATION: ${data.location ?? "Unknown"}
    LOCATION DETAILS: ${data.locationDescription ?? "None"}

    COORDINATES: ${data.coordinates ? `${data.coordinates.lat}, ${data.coordinates.lng}` : "Unknown"}
    `;

        console.log("Generating embedding...");
        const embedding = await generateEmbedding(embeddingInput);

        const embeddingId = await storeEmbedding(
            event.params.itemId,
            embedding,
            "found"
        );

        await snap.ref.update({
            semanticDescription,
            embeddingId,
            imageAnalysis: imageDescription,
        });

        console.log("Running similarity check...");
        await runSimilarityCheck(event.params.itemId, "found", embedding, data);
    }
);