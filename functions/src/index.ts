import * as admin from "firebase-admin";
admin.initializeApp();

import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { generateText} from "./vertexGemini";
import { generateEmbedding } from "./vertexEmbeddings";
import { upsertEmbedding } from "./vertex";
import { runSimilarityCheck } from "./matcher";
import { analyzeItemImage } from "./imageAI";
export { manualRecheck } from "./manualRecheck";


async function generateSemanticDescription(
    name: string,
    rawDescription: string,
    category: string,
    location?: string
): Promise<string> {
    const prompt = `
    Convert the following lost/found item description into a concise semantic summary.

    Focus on:
    - color
    - material
    - size
    - brand (if any)
    - distinguishing features
    - likely usage context

    Item Name: ${name}
    Category: ${category}
    Location: ${location ?? "Unknown"}
    Raw Description: ${rawDescription}

    Return ONLY the summary text.
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

        let imageDescription = "";

        console.log("Lost Item Data:", data);
        if (data.image) {
            imageDescription = await analyzeItemImage(data.image);
        }
        console.log("Image Description:", imageDescription);

        const combinedDescription = `
    User Description:
    ${data.rawDescription}

    Image Analysis:
    ${imageDescription}
    `;

        const semanticDescription = await generateSemanticDescription(
            data.name,
            combinedDescription,
            data.category,
            data.location
        );
        console.log("Generated Semantic Description:", semanticDescription);

        const embeddingInput = `
    Item Type: Lost
    Name: ${data.name}
    Category: ${data.category}
    Description: ${semanticDescription}
    Location: ${data.location ?? "Unknown"}
    `;

        const embedding = await generateEmbedding(embeddingInput);
        console.log("Generated Embedding:", embedding);

        const embeddingId = await storeEmbedding(
            event.params.itemId,
            embedding,
            "lost"
        );

        await snap.ref.update({
            semanticDescription,
            embeddingId,
        });

        await runSimilarityCheck(event.params.itemId, "lost", embedding);
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

        let imageDescription = "";
        console.log("Found Item Data:", data);
        if (data.image) {
            imageDescription = await analyzeItemImage(data.image);
        }

        const combinedDescription = `
    User Description:
    ${data.rawDescription}

    Image Analysis:
    ${imageDescription}
    `;

        const semanticDescription = await generateSemanticDescription(
            data.name,
            combinedDescription,
            data.category,
            data.location
        );

        const embeddingInput = `
    Item Type: Found
    Name: ${data.name}
    Category: ${data.category}
    Description: ${semanticDescription}
    Location: ${data.location ?? "Unknown"}
    `;

        const embedding = await generateEmbedding(embeddingInput);

        const embeddingId = await storeEmbedding(
            event.params.itemId,
            embedding,
            "found"
        );

        await snap.ref.update({
            semanticDescription,
            embeddingId,
        });

        await runSimilarityCheck(event.params.itemId, "found", embedding);
    }
);
