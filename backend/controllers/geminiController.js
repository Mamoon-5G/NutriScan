import { GoogleGenerativeAI } from "@google/generative-ai";

// ─────────────────────────────────────────────
// PREDEFINED PROMPT — fill in your instructions:
const FOOD_ANALYSIS_PROMPT = `You are a nutrition analysis assistant.

Your task is to analyze an image and determine whether the item shown is a food product. 
If it is a food product, classify its health impact.

Classification categories:
- Healthy
- Moderately Harmful
- Harmful

Rules:
1. If the image does NOT contain a food or edible product, respond only with:
The captured image is not a food product (or any better sentence)

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

Examples:

Example 1:
Product: Name of the product
classification: Healthy
reason: Contains natural ingredients, fiber, and balanced nutrients with low added sugar.

Example 2:
Product: Name of the product
classification: Moderately Harmful
reason: Moderate calorie density and added sugar but not excessively processed.

Example 3:
Product: Name of the product
classification: Harmful
reason: Very high sugar and calories with ultra-processed ingredients and additives.

Only output the response in the specified format.`;
// ─────────────────────────────────────────────

/**
 * POST /api/analyze-food
 * Accepts a food image, sends it to Gemini, returns AI analysis.
 */
export const analyzeFoodWithGemini = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured in environment" });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const imageBase64 = req.file.buffer.toString("base64");
    const mimeType = req.file.mimetype;

    const result = await model.generateContent([
      {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType,
        },
      },
      FOOD_ANALYSIS_PROMPT,
    ]);

    const response = await result.response;
    const analysis = response.text();

    return res.json({ analysis });
  } catch (error) {
    console.error("❌ Gemini analysis error:", error);
    return res.status(500).json({ error: "Failed to analyze image with Gemini" });
  }
};
