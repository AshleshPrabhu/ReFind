import axios from "axios";
import { GoogleAuth } from "google-auth-library";

const PROJECT_NUMBER = "732990430730";
const LOCATION = "asia-south1";
const PROJECT_ID = "ashlesh-refind";

const INDEX_ENDPOINT_ID = "3131602629952536576";
const INDEX_ID = "1948167478651650048";
const DEPLOYED_INDEX_ID = "refind_deploy_1767243087960";

const VECTOR_API_ENDPOINT =
    "https://707480270.asia-south1-732990430730.vdb.vertexai.goog";

const auth = new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
});

export async function upsertEmbedding(
    datapointId: string,
    embedding: number[]
): Promise<void> {
    try {
        const client = await auth.getClient();
        const { token } = await client.getAccessToken();

        const url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/indexes/${INDEX_ID}:upsertDatapoints`;

        const requestBody = {
            datapoints: [
                {
                datapoint_id: datapointId,
                feature_vector: embedding,
                },
            ],
        };

        console.log("Upserting:", datapointId);

        await axios.post(url, requestBody, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            timeout: 30_000,
        });

        console.log("Upsert successful");
    } catch (error: any) {
        console.error("Upsert error details:");
        console.error("Status:", error.response?.status);
        console.error("Error data:", JSON.stringify(error.response?.data, null, 2));
        throw error;
    }
}

export async function searchSimilarEmbeddings(
    vector: number[],
    topK = 10
): Promise<{ id: string; score: number }[]> {
    const client = await auth.getClient();
    const token = await client.getAccessToken();

    const url = `${VECTOR_API_ENDPOINT}/v1/projects/${PROJECT_NUMBER}/locations/${LOCATION}/indexEndpoints/${INDEX_ENDPOINT_ID}:findNeighbors`;

    const res = await axios.post(
        url,
        {
            deployedIndexId: DEPLOYED_INDEX_ID,
            queries: [
                {
                datapoint: { featureVector: vector },
                neighborCount: topK,
                },
            ],
        },
        {
            headers: {
                Authorization: `Bearer ${token.token}`,
                "Content-Type": "application/json",
            },
        }
    );

    const neighbors = res.data.nearestNeighbors?.[0]?.neighbors ?? [];

    return neighbors.map((n: any) => ({
        id: n.datapoint.datapointId,
        score: n.distance,
    }));
}

export async function findSimilarItems(
    vector: number[],
    searchFor: "lost" | "found",
    topK = 10
): Promise<{ id: string; score: number }[]> {
    console.log(" Searching for similar", searchFor, "items");
    
    const results = await searchSimilarEmbeddings(vector, topK);
    
    console.log("Raw results:", results.length);
    results.forEach(r => console.log(`  ${r.id}: ${r.score.toFixed(3)}`));

    const filtered = results.filter((r) => {
        const isCorrectType = r.id.startsWith(`${searchFor}_`);
        const isNotSelf = r.score < 0.9999;
        return isCorrectType && isNotSelf;
    });
    
    console.log("Filtered to", filtered.length, searchFor, "items");
    const finalResults = filtered.map((r) => ({
        id: r.id.replace(`${searchFor}_`, ""),
        score: r.score,
    }));

    console.log("Final matches:");
    finalResults.forEach(r => console.log(`  ${r.id}: ${(r.score * 100).toFixed(1)}% similar`));

    return finalResults;
}