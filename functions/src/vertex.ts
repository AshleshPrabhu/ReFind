import { IndexEndpointServiceClient } from "@google-cloud/aiplatform";

const client = new IndexEndpointServiceClient();

const PROJECT_ID = process.env.GCP_PROJECT_ID!;
const LOCATION = process.env.VERTEX_LOCATION!;
const INDEX_ENDPOINT_ID = process.env.VERTEX_INDEX_ENDPOINT_ID!;
const DEPLOYED_INDEX_ID = process.env.VERTEX_DEPLOYED_INDEX_ID!;

export async function upsertEmbedding(
    id: string,
    vector: number[]
): Promise<void> {
    console.log("=================================");
    console.log("Upsert Vector");
    console.log("Vector ID:", id);
    console.log("Vector dimension:", vector.length);
    console.log("=================================");

  /**
   * await client.upsertDatapoints({
   *   indexEndpoint: `projects/${PROJECT_ID}/locations/${LOCATION}/indexEndpoints/${INDEX_ENDPOINT_ID}`,
   *   deployedIndexId: DEPLOYED_INDEX_ID,
   *   datapoints: [
   *     {
   *       datapointId: id,
   *       featureVector: vector,
   *     },
   *   ],
   * });
   */
}

export async function searchSimilarEmbeddings(
    vector: number[],
    topK = 5
): Promise<{ id: string; score: number }[]> {
    console.log("=================================");
    console.log("[Vertex Placeholder] Similarity Search");
    console.log("Vector dimension:", vector.length);
    console.log("Top K:", topK);
    console.log("=================================");

   /**
   *
   * const response = await client.findNeighbors({
   *   indexEndpoint: `projects/${PROJECT_ID}/locations/${LOCATION}/indexEndpoints/${INDEX_ENDPOINT_ID}`,
   *   deployedIndexId: DEPLOYED_INDEX_ID,
   *   queries: [
   *     {
   *       datapoint: {
   *         featureVector: vector,
   *       },
   *       neighborCount: topK,
   *     },
   *   ],
   * });
   *
   * const neighbors =
   *   response[0].nearestNeighbors?.[0]?.neighbors || [];
   *
   * return neighbors.map((n) => ({
   *   id: n.datapoint?.datapointId as string,
   *   score: n.distance ?? 0,
   * }));
   */

   return [];
}

export async function findSimilarItems(
    vector: number[],
    searchFor: "lost" | "found",
    topK = 5
): Promise<{ id: string; score: number }[]> {
    console.log(`[Similarity] Searching ${searchFor} items`);
    console.log("Vector length:", vector.length);

    /**
     *
     * const results = await searchSimilarEmbeddings(vector, topK);
     *
     * const filtered = results.filter((r) =>
     *   r.id.startsWith(`${searchFor}_`)
     * );
     *
     * //  Convert distance → similarity score (optional)
     * // If using cosine distance: similarity = 1 - distance
     * return filtered.map((r) => ({
     *   id: r.id.replace(`${searchFor}_`, ""),
     *   score: 1 - r.score,
     * }));
     */

    return [];
}
