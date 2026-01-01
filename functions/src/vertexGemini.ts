import { VertexAI } from "@google-cloud/vertexai";

const vertexAI = new VertexAI({
  project: "ashlesh-refind",
  location: "us-central1",
});

const model = vertexAI.getGenerativeModel({
  model: "gemini-2.0-flash-001",
});

export async function generateText(prompt: string): Promise<string> {
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const candidates = result.response.candidates;
  if (!candidates || candidates.length === 0) {
    throw new Error("No Gemini response");
  }

  return candidates[0].content.parts[0].text!;
}

export async function analyzeImage(
  imageBase64: string,
  mimeType = "image/jpeg"
): Promise<string> {
  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          { text: "Describe the item in the image concisely." },
          {
            inlineData: {
              data: imageBase64,
              mimeType,
            },
          },
        ],
      },
    ],
  });

  return result.response.candidates?.[0]?.content.parts[0].text ?? "";
}
