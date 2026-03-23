import OpenAI from "openai";

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

const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || "https://integrate.api.nvidia.com/v1";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "deepseek-ai/deepseek-v3.2";

/**
 * POST /api/analyze-food
 */
export const analyzeFoodWithLLM = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "OPENAI_API_KEY is not configured in environment",
      });
    }

    const openai = new OpenAI({
      apiKey,
      baseURL: OPENAI_BASE_URL,
    });

    const imageBase64 = req.file.buffer.toString("base64");
    const mimeType = req.file.mimetype;
    const imageDataUrl = `data:${mimeType};base64,${imageBase64}`;

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: FOOD_ANALYSIS_PROMPT },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
      temperature: 1,
      top_p: 0.95,
      max_tokens: 1024,
    });

    const analysis = completion.choices?.[0]?.message?.content?.trim();
    if (!analysis) {
      throw new Error("No analysis text returned by LLM");
    }

    return res.json({ analysis });
  } catch (error) {
    console.error("LLM analysis error:", error);
    return res.status(500).json({
      error: "Failed to analyze image with LLM",
    });
  }
};