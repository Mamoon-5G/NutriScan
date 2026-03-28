import OpenAI from "openai";

const FOOD_ANALYSIS_PROMPT = `You are a nutrition analysis expert.

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

6. Recommend the proper alternate product with name if the classification is either Very Hamrful or Moderaltely Harmful

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

Only output the response in the specified format.

7. Choose exactly one classification from: Healthy, Moderately Harmful, Very Harmful.
8. Do not include multiple classifications in one response.
9. If food is detected, output only these lines in this exact order:
Product: <Name>
classification: <Healthy | Moderately Harmful | Very Harmful>
reason: <1-2 short sentences>
Recommendation: Go for <Product Names> instead
10. Do not add any extra labels, notes, markdown, or explanation outside these lines.`;


const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "nvidia/nemotron-nano-12b-v2-vl:free";
const OPENROUTER_BASE_URL = (process.env.OPENROUTER_URL || "https://openrouter.ai/api/v1").replace(/\/chat\/completions\/?$/, "");

export const analyzeFoodWithLLM = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "OPENROUTER_API_KEY is not configured in environment",
      });
    }

    const imageBase64 = req.file.buffer.toString("base64");
    const imageDataUrl = `data:${req.file.mimetype};base64,${imageBase64}`;

    const client = new OpenAI({
      baseURL: OPENROUTER_BASE_URL,
      apiKey,
    });

    const apiResponse = await client.chat.completions.create({
      model: OPENROUTER_MODEL,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: FOOD_ANALYSIS_PROMPT },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
      reasoning: { enabled: true },
      temperature: 1,
      top_p: 0.95,
      max_tokens: 1024,
    });

    const assistantMessage = apiResponse?.choices?.[0]?.message;
    const analysis = typeof assistantMessage?.content === "string"
      ? assistantMessage.content.trim()
      : Array.isArray(assistantMessage?.content)
        ? assistantMessage.content
          .filter((item) => item?.type === "text" && typeof item?.text === "string")
          .map((item) => item.text)
          .join("\n")
          .trim()
        : "";

    if (!analysis) {
      throw new Error("No analysis text returned by LLM");
    }

    return res.json({
      analysis,
      reasoning_details: assistantMessage?.reasoning_details,
    });
  } catch (error) {
    console.error("LLM analysis error:", error);
    return res.status(500).json({
      error: "Failed to analyze image with LLM",
    });
  }
};