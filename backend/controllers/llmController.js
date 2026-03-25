import OpenAI from "openai";

// ─────────────────────────────────────────────
const FOOD_ANALYSIS_PROMPT = `You are a nutrition analysis assistant.

Your task is to analyze an image and determine whether the item shown is a food product. 
If it is a food product, classify its health impact.

Classification categories:
- Healthy
- Moderately Harmful
- Very Harmful

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

5. If the image is a packaged product that may have barcode attached with them in the end just add one more sentence
<Scan barcode for detailed analysis>

6. Recommend the proper alternate product with name

Examples:

Example 1:
Product: Name of the product
classification: Healthy
reason: Contains natural ingredients, fiber, and balanced nutrients with low added sugar.

Example 2:
Product: Name of the product
classification: Moderately Harmful
reason: Moderate calorie density and added sugar but not excessively processed.
Recommendation: Go for <Product Names> instead

Example 3:
Product: Name of the product
classification: Very Harmful
reason: Very high sugar and calories with ultra-processed ingredients and additives.
Recommendation: Go for <Product Names> instead

Example 4:
Product: Name of the product
classification: Very Harmful
reason: Very high sugar and calories with ultra-processed ingredients and additives. Scan the barcode for more detailed analysis

Only output the response in the specified format.`;
// ─────────────────────────────────────────────

const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL
const OPENAI_MODEL = process.env.OPENAI_MODEL

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
          role: "system",
          content:
            "You analyze food images and follow the requested output format exactly. Do not invent details if image quality is low.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: FOOD_ANALYSIS_PROMPT },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
      temperature: 0.15,
      top_p: 1,
      max_tokens: 2048,
    });

    const analysis = completion.choices?.[0]?.message?.content?.trim();
    if (!analysis) {
      throw new Error("No analysis text returned by LLM");
    }

    return res.json({ analysis });
  } catch (error) {
    const providerMessage =
      error?.error?.message ||
      error?.response?.data?.error?.message ||
      error?.message ||
      "Failed to analyze image with LLM";
    const providerStatus = error?.status || error?.response?.status || 500;

    console.error("LLM analysis error:", {
      status: providerStatus,
      message: providerMessage,
      model: OPENAI_MODEL,
    });

    return res.status(providerStatus >= 400 && providerStatus < 600 ? providerStatus : 500).json({
      error: providerMessage,
    });
  }
};