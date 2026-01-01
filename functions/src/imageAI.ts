import { VertexAI } from "@google-cloud/vertexai";

const vertex = new VertexAI({
  project: "ashlesh-refind",
  location: "us-central1",
});

const visionModel = vertex.getGenerativeModel({
  model: "gemini-2.0-flash-001",
});

export async function analyzeItemImage(
  imageUrl: string
): Promise<string> {
  const imageBase64 = await fetchImageAsBase64(imageUrl);

  const prompt = `
  Describe this image of a lost or found item.
  Focus on:
  - object type
  - color
  - material
  - brand or logo
  - distinctive features

  Return ONLY the description.
  `;

  const response = await visionModel.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: imageBase64,
            },
          },
        ],
      },
    ],
  });

  return (
    response.response.candidates?.[0]?.content.parts?.[0]?.text?.trim() ?? ""
  );
}

async function fetchImageAsBase64(url: string): Promise<string> {
  const res = await fetch(url);
  const buffer = Buffer.from(await res.arrayBuffer());
  return buffer.toString("base64");
}
