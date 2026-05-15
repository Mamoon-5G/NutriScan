import OpenAI from "openai";
import fs from "fs";

const FOOD_ANALYSIS_PROMPT = `You are a nutrition analysis expert.

Your task is to analyze an image and determine whether the item shown is a food product. 
If it is a food product, classify its health impact and return the result in JSON format.

Return strict JSON only in this exact format:
{
  "product": "Name of the product",
  "classification": "Healthy | Moderately Harmful | Very Harmful",
  "reason": "Overall summary sentence",
  "breakdown": {
    "pros": ["List 2-3 key positive nutritional factors"],
    "cons": ["List 2-3 key negative nutritional factors (if any)"]
  },
  "recommendation": "Go for <Alternative Product> instead (Optional, only if harmful)",
  "has_barcode": true/false
}

Rules:
1. If NOT a food product, return: {"error": "The captured image is not a food product"}
2. Choose classification exactly from: Healthy, Moderately Harmful, Very Harmful.
3. Breakdown pros/cons should be 1-4 words each (e.g. "High Sugar", "Rich in Fiber").
4. If it is a packaged product, mention "Scan barcode for detailed analysis" in the reason or set has_barcode to true.
5. Only output valid JSON. No extra text.`;


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
You are given two photos:
- Front label image
- Ingredients label image

Your task is to verify if these images actually show a food product and its ingredients.
If they do NOT show a valid packaged food product or ingredients list, you MUST return strict JSON only in this exact format:
{
  "error": "The captured image is not a valid food product or ingredients label."
}

If they DO show a valid food product, extract the following information in strict JSON format:
{
  "product_name": "Extract or infer product name",
  "brands": "Extract or infer brand",
  "nutrition_grade": "A, B, C, D, or E based on Nutri-Score standards",
  "ingredients_text": "Full list of ingredients as text",
  "conclusion": "Healthy | Moderately Harmful | Very Harmful",
  "harmful_ingredients": [
    {
      "name": "Ingredient Name",
      "health_impact": "Explain in what ways it is harmful and its breakdown",
      "environment_impact": "Explain its impact on the environment"
    }
  ]
}
Rules:
1. Return ONLY the JSON object.
2. Be as accurate as possible with the ingredients list.
3. Assess the product and choose a conclusion exactly from: Healthy, Moderately Harmful, Very Harmful.
4. For each harmful ingredient found, provide its details in the harmful_ingredients array. If none, return an empty array.`;

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
    const rawAnalysis = typeof assistantMessage?.content === "string"
      ? assistantMessage.content.trim()
      : Array.isArray(assistantMessage?.content)
        ? assistantMessage.content
          .filter((item) => item?.type === "text" && typeof item?.text === "string")
          .map((item) => item.text)
          .join("\n")
          .trim()
        : "";

    if (!rawAnalysis) {
      throw new Error("No analysis text returned by LLM");
    }

    // Attempt to clean JSON if the model wrapped it in markdown fences
    const cleaned = stripCodeFences(rawAnalysis);
    
    // Validate if it's JSON, if not, try to structure it
    let finalAnalysis = cleaned;
    try {
      JSON.parse(cleaned);
      // It's already JSON, good.
    } catch (e) {
      // If it's not JSON, it might be the old format. 
      // We'll leave it as is for the frontend parser to handle fallback.
    }

    return res.json({
      analysis: finalAnalysis,
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

    if (productData.error) {
      return res.status(400).json({ error: productData.error });
    }

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