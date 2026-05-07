import OpenAI from "openai";
import fs from "fs";

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
9. Do not add any extra labels, notes, markdown, or explanation outside these lines.`;


const OPENROUTER_VISION_MODEL = process.env.OPENROUTER_MODEL || "nvidia/nemotron-nano-12b-v2-vl:free";
const OPENROUTER_TEXT_MODEL = process.env.OPENROUTER_TEXT_MODEL || OPENROUTER_VISION_MODEL;
const OPENROUTER_BASE_URL = (process.env.OPENROUTER_URL || "https://openrouter.ai/api/v1").replace(/\/chat\/completions\/?$/, "");

const RECOMMENDATION_PROMPT = `You are a product recommendation engine for a nutrition analysis app.

Given the scanned product metadata, suggest 3 real-world alternative products that are healthier and/or more eco-friendly.

Return strict JSON only in this exact shape:
{
  "recommendations": [
    {
      "name": "<specific product name>",
      "brand": "<brand or manufacturer if known>",
      "reason": "<short explanation of why it is a better alternative>",
      "rating": 4.6,
      "eco_friendly": true,
      "price": "$4.99"
    }
  ]
}

Rules:
1. Recommend concrete product names, not vague categories.
2. Prefer products with lower sugar, sodium, saturated fat, fewer additives, and better environmental profile.
3. Do not repeat the scanned product or variants of the same product.
4. If a brand is not confidently known, leave brand empty or use an empty string.
5. If you cannot infer a strong alternative, return an empty array.
6. Do not include markdown, prose, or extra keys outside the JSON object.

Scanned product metadata:
`;

const VISION_EXTRACTION_PROMPT = `You are a specialized food data extraction engine.
You are given two photos of a packaged food product:
- Front label image (product name/brand)
- Ingredients label image

Your task is to extract the following information in strict JSON format:
{
  "product_name": "Extract or infer product name",
  "brands": "Extract or infer brand",
  "ingredients_text": "Full list of ingredients as text",
  "nutrition_grade": "A, B, C, D, or E based on Nutri-Score standards",
  "nova_group": 1, 2, 3, or 4 based on processing level,
  "nutriments": {
    "energy-kcal_100g": 0,
    "fat_100g": 0,
    "saturated-fat_100g": 0,
    "sugars_100g": 0,
    "salt_100g": 0,
    "proteins_100g": 0,
    "fiber_100g": 0
  }
}
Rules:
1. Return ONLY the JSON object.
2. Use null if a specific numeric value cannot be found.
3. Be as accurate as possible with the ingredients list.
4. Use the front image primarily for product/brand identity.
5. Use the ingredients image primarily for ingredients extraction.`;

const stripCodeFences = (value) => value.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

const parseRecommendationPayload = (text) => {
  const cleaned = stripCodeFences(text);
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("LLM did not return JSON");
  }

  const parsed = JSON.parse(cleaned.slice(start, end + 1));
  const recommendations = Array.isArray(parsed?.recommendations) ? parsed.recommendations : [];

  return {
    recommendations: recommendations
      .filter((item) => item && typeof item.name === "string" && item.name.trim().length > 0)
      .map((item) => ({
        name: item.name.trim(),
        brand: typeof item.brand === "string" && item.brand.trim().length > 0 ? item.brand.trim() : undefined,
        image_url: typeof item.image_url === "string" && item.image_url.trim().length > 0 ? item.image_url.trim() : undefined,
        reason: typeof item.reason === "string" && item.reason.trim().length > 0 ? item.reason.trim() : "Suggested by the LLM as a healthier alternative.",
        rating: typeof item.rating === "number" && Number.isFinite(item.rating) ? item.rating : undefined,
        eco_friendly: typeof item.eco_friendly === "boolean" ? item.eco_friendly : undefined,
        price: typeof item.price === "string" && item.price.trim().length > 0 ? item.price.trim() : undefined,
      }))
      .slice(0, 6),
  };
};

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

    const imageBase64 = fs.readFileSync(req.file.path).toString("base64");
    const imageDataUrl = `data:${req.file.mimetype};base64,${imageBase64}`;

    const client = new OpenAI({
      baseURL: OPENROUTER_BASE_URL,
      apiKey,
    });

    const apiResponse = await client.chat.completions.create({
      model: OPENROUTER_VISION_MODEL,
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

export const analyzeProductVision = async (req, res) => {
  try {
    const files = req.files;

    const frontFile = files?.product_front_image?.[0] || files?.nutrition_image?.[0];
    const ingredientsFile = files?.ingredients_image?.[0];

    if (!frontFile || !ingredientsFile) {
      return res.status(400).json({ error: "Please provide both front-label and ingredients photos" });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "OPENROUTER_API_KEY not configured" });
    }

    const client = new OpenAI({
      baseURL: OPENROUTER_BASE_URL,
      apiKey,
    });

    const content = [{ type: "text", text: VISION_EXTRACTION_PROMPT }];

    const frontBase64 = fs.readFileSync(frontFile.path).toString("base64");
    content.push({
      type: "image_url",
      image_url: { url: `data:${frontFile.mimetype};base64,${frontBase64}` }
    });

    const ingredientsBase64 = fs.readFileSync(ingredientsFile.path).toString("base64");
    content.push({
      type: "image_url",
      image_url: { url: `data:${ingredientsFile.mimetype};base64,${ingredientsBase64}` }
    });

    const response = await client.chat.completions.create({
      model: OPENROUTER_VISION_MODEL,
      messages: [{ role: "user", content }],
      temperature: 0.1,
    });

    const resultText = response.choices[0].message.content;
    const cleaned = stripCodeFences(resultText);
    const startIdx = cleaned.indexOf("{");
    const endIdx = cleaned.lastIndexOf("}");
    
    if (startIdx === -1 || endIdx === -1) {
       throw new Error("LLM did not return valid JSON for vision extraction");
    }

    const productData = JSON.parse(cleaned.substring(startIdx, endIdx + 1));

    return res.json({ productData });
  } catch (error) {
    console.error("Vision extraction error:", error);
    return res.status(500).json({ error: "Failed to extract data from labels" });
  }
};

export const recommendAlternativesWithLLM = async (req, res) => {
  try {
    const { product } = req.body || {};

    if (!product || Object.keys(product).length === 0) {
      return res.status(400).json({ error: "Product data is required" });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "OPENROUTER_API_KEY is not configured in environment",
      });
    }

    const client = new OpenAI({
      baseURL: OPENROUTER_BASE_URL,
      apiKey,
    });

    const promptText = `${RECOMMENDATION_PROMPT}${JSON.stringify(product, null, 2)}`;

    const apiResponse = await client.chat.completions.create({
      model: OPENROUTER_TEXT_MODEL,
      messages: [
        {
          role: "user",
          content: promptText,
        },
      ],
      temperature: 0.2,
      top_p: 0.9,
      max_tokens: 320,
    });

    const assistantMessage = apiResponse?.choices?.[0]?.message;
    const responseText = typeof assistantMessage?.content === "string"
      ? assistantMessage.content.trim()
      : Array.isArray(assistantMessage?.content)
        ? assistantMessage.content
          .filter((item) => item?.type === "text" && typeof item?.text === "string")
          .map((item) => item.text)
          .join("\n")
          .trim()
        : "";

    if (!responseText) {
      throw new Error("No recommendation text returned by LLM");
    }

    const parsed = parseRecommendationPayload(responseText);

    return res.json({
      recommendations: parsed.recommendations,
      reasoning_details: assistantMessage?.reasoning_details,
    });
  } catch (error) {
    console.error("LLM recommendation error:", error);
    return res.status(500).json({
      error: "Failed to generate alternatives with LLM",
    });
  }
};