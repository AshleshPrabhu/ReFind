import axios from "axios";
import { GoogleAuth } from "google-auth-library";

const PROJECT_ID = "ashlesh-refind";
const LOCATION = "asia-south1";

const auth = new GoogleAuth({
  scopes: ["https://www.googleapis.com/auth/cloud-platform"],
});

export async function generateEmbedding(text: string): Promise<number[]> {
  const client = await auth.getClient();
  const token = await client.getAccessToken();

  const url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/text-embedding-004:predict`;

  const res = await axios.post(
    url,
    { instances: [{ content: text }] },
    {
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
    }
  );

  return res.data.predictions[0].embeddings.values;
}
