import { GoogleGenerativeAI } from "@google/generative-ai";

// ─────────────────────────────────────────────
const FOOD_ANALYSIS_PROMPT = `You are a nutrition analysis assistant.

Your task is to analyze an image and determine whether the item shown is a food product. 
If it is a food product, classify its health impact.

Classification categories:
- Healthy
- Moderately Harmful
- Harmful

Rules:
1. If the image does NOT contain a food or edible product, respond only with:
The captured image is not a food product.

2. If the image contains food, respond in the following format exactly:

Product: <Name of the product identified>
classification: <Healthy | Moderately Harmful | Harmful>
reason: <brief explanation of the nutritional concern or benefit>

3. The reason should mention factors such as:
- high sugar
- high calories
- high saturated fat
- high sodium
- ultra processed ingredients
- artificial additives
- balanced nutrients
- high fiber
- natural ingredients

4. Keep the explanation short (1-2 sentences).
5. If the image contains packaged food products add one more sentence:
Scan Barcode of this product for more detailed Analysis

Only output the response in the specified format.`;
// ─────────────────────────────────────────────


/**
 * Try Gemini models with fallback
 */
async function generateWithFallback(genAI, models, content) {
  for (const modelName of models) {
    try {
      console.log(`⚡ Trying model: ${modelName}`);

      const model = genAI.getGenerativeModel({ model: modelName });

      const result = await model.generateContent(content);
      const response = await result.response;

      return response.text();
    } catch (err) {
      console.warn(`Model failed: ${modelName}`);

      // If last model also fails → throw error
      if (modelName === models[models.length - 1]) {
        throw err;
      }
    }
  }
}


/**
 * POST /api/analyze-food
 */
export const analyzeFoodWithGemini = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured in environment",
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const imageBase64 = req.file.buffer.toString("base64");
    const mimeType = req.file.mimetype;

    const content = [
      {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType,
        },
      },
      FOOD_ANALYSIS_PROMPT,
    ];

    // 🔹 Model priority order
    const models = [
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-3-flash-preview",
      "gemini-3.1-flash-lite-preview"
    ];

    const analysis = await generateWithFallback(genAI, models, content);

    return res.json({ analysis });

  } catch (error) {
    console.error("Gemini analysis error:", error);
    return res.status(500).json({
      error: "Failed to analyze image with Gemini",
    });
  }
};