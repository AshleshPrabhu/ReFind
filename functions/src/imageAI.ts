import { VertexAI } from "@google-cloud/vertexai";

const vertex = new VertexAI({
  project: "ashlesh-refind",
  location: "us-central1",
});

const visionModel = vertex.getGenerativeModel({
  model: "gemini-2.0-flash-001",
});

export async function analyzeItemImage(imageUrl: string): Promise<string> {
  const imageBase64 = await fetchImageAsBase64(imageUrl);

  const prompt = `
  Analyze this image of a lost or found item in EXTREME DETAIL.
  
  CRITICAL: Be VERY specific about the exact object type. For example:
  - "MacBook laptop computer" NOT just "book"
  - "Leather wallet" NOT just "case"
  - "iPhone smartphone" NOT just "device"
  
  Describe in order of importance:
  1. EXACT object type/category (be extremely specific - laptop, phone, wallet, keys, etc.)
  2. Primary brand/manufacturer if visible (Apple, Samsung, Nike, etc.)
  3. Model or specific product name if identifiable
  4. Primary color(s) - be specific (navy blue, not just blue)
  5. Material (leather, metal, plastic, fabric, etc.)
  6. Size estimate (small/medium/large or approximate dimensions)
  7. Distinctive features:
      - Logos, text, patterns
      - Damage, scratches, wear marks
      - Stickers, decorations, customizations
      - Unique identifying marks
  8. Condition (new, used, worn, damaged)
  
  BE EXTREMELY PRECISE. If it's a laptop, say "laptop computer". If it's a diary, say "paper diary/notebook".
  Do NOT confuse electronic devices with books or other objects.
  
  Return ONLY the detailed description, no preamble.
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