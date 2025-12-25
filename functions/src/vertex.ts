import { IndexEndpointServiceClient } from "@google-cloud/aiplatform";

const client = new IndexEndpointServiceClient();

const PROJECT_ID = process.env.GCP_PROJECT_ID!;
const LOCATION = process.env.VERTEX_LOCATION!;
const INDEX_ENDPOINT_ID = process.env.VERTEX_INDEX_ENDPOINT_ID!;

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
   *   deployedIndexId: "INDEX_ID",
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
): Promise<string[]> {
    console.log("=================================");
    console.log("[Vertex Placeholder] Similarity Search");
    console.log("Vector dimension:", vector.length);
    console.log("Top K:", topK);
    console.log("================================");

    /**
     * const response = await client.findNeighbors({
     *   indexEndpoint: `projects/${PROJECT_ID}/locations/${LOCATION}/indexEndpoints/${INDEX_ENDPOINT_ID}`,
     *   deployedIndexId: "YOUR_DEPLOYED_INDEX_ID",
     *   queries: [
     *     {
     *       datapoint: { featureVector: vector },
     *       neighborCount: topK,
     *     },
     *   ],
     * });
     *
     * return response[0].nearestNeighbors?.neighbors?.map(
     *   (n) => n.datapoint?.datapointId as string
     * ) || [];
     */

    return [];
}
