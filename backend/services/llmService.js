import OpenAI from "openai";

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

import { z } from "zod";
import { ValidationError, AppError } from "../utils/errors.js";

const stripCodeFences = (value) => value.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

// ----------------------------------------------------
// Zod Schemas for LLM Output Verification
// ----------------------------------------------------

const foodAnalysisSchema = z.object({
  product: z.string().default("Unknown Product"),
  classification: z.enum(["Healthy", "Moderately Harmful", "Very Harmful"]),
  reason: z.string().default("No reason provided."),
  breakdown: z.object({
    pros: z.array(z.string()).default([]),
    cons: z.array(z.string()).default([])
  }).default({}),
  recommendation: z.string().optional(),
  has_barcode: z.boolean().default(false)
});

const foodAnalysisErrorSchema = z.object({
  error: z.string()
});

const visionExtractionSchema = z.object({
  product_name: z.string().default("Unknown Product"),
  brands: z.string().default("Unknown Brand"),
  nutrition_grade: z.string().default("unknown"),
  ingredients_text: z.string().default(""),
  conclusion: z.enum(["Healthy", "Moderately Harmful", "Very Harmful"]),
  harmful_ingredients: z.array(z.object({
    name: z.string(),
    health_impact: z.string().optional(),
    environment_impact: z.string().optional()
  })).default([])
});

const visionExtractionErrorSchema = z.object({
  error: z.string()
});

const alternativeProductSchema = z.object({
  name: z.string(),
  brand: z.string().default(""),
  reason: z.string().default("Suggested by the LLM as a healthier alternative."),
  rating: z.number().optional(),
  eco_friendly: z.boolean().default(false),
  price: z.string().default("")
});

const recommendationsSchema = z.object({
  recommendations: z.array(alternativeProductSchema).default([])
});

// ----------------------------------------------------
// Parser Helpers
// ----------------------------------------------------

const extractJsonString = (text) => {
  const cleaned = stripCodeFences(text);
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new ValidationError("LLM response did not contain a valid JSON object");
  }
  return cleaned.substring(start, end + 1);
};

const getClient = () => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured in environment");
  }
  const baseURL = (process.env.OPENROUTER_URL || "https://openrouter.ai/api/v1").replace(/\/chat\/completions\/?$/, "");
  return new OpenAI({ baseURL, apiKey });
};

const getVisionModel = () => process.env.OPENROUTER_MODEL || "nvidia/nemotron-nano-12b-v2-vl:free";
const getTextModel = () => process.env.OPENROUTER_TEXT_MODEL || getVisionModel();

export const analyzeFoodImageService = async (imageBase64, mimeType) => {
  const client = getClient();
  const imageDataUrl = `data:${mimeType};base64,${imageBase64}`;

  const apiResponse = await client.chat.completions.create({
    model: getVisionModel(),
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
    throw new ValidationError("No analysis text returned by LLM");
  }

  let finalAnalysis = rawAnalysis;
  try {
    const jsonStr = extractJsonString(rawAnalysis);
    const parsedObj = JSON.parse(jsonStr);

    // First check if it's an error shape
    const errorParsed = foodAnalysisErrorSchema.safeParse(parsedObj);
    if (errorParsed.success) {
      throw new ValidationError(errorParsed.data.error);
    }

    // Otherwise validate full analysis shape
    const validated = foodAnalysisSchema.parse(parsedObj);
    finalAnalysis = JSON.stringify(validated);
  } catch (e) {
    if (e instanceof ValidationError) {
      throw e;
    }
    // Fallback to parsed string if Zod validation fails, to match previous behavior
    // but log a warning
    try {
      const jsonStr = extractJsonString(rawAnalysis);
      finalAnalysis = jsonStr;
    } catch (_) {
      // Keep raw text
    }
  }

  return {
    analysis: finalAnalysis,
    reasoning_details: assistantMessage?.reasoning_details,
  };
};

export const extractVisionDataService = async (frontBase64, frontMimeType, ingredientsBase64, ingredientsMimeType) => {
  const client = getClient();

  const content = [{ type: "text", text: VISION_EXTRACTION_PROMPT }];
  content.push({
    type: "image_url",
    image_url: { url: `data:${frontMimeType};base64,${frontBase64}` }
  });
  content.push({
    type: "image_url",
    image_url: { url: `data:${ingredientsMimeType};base64,${ingredientsBase64}` }
  });

  const response = await client.chat.completions.create({
    model: getVisionModel(),
    messages: [{ role: "user", content }],
    temperature: 0.1,
  });

  const resultText = response.choices[0].message.content;
  if (!resultText) {
    throw new ValidationError("No data returned by LLM vision extraction");
  }

  const jsonStr = extractJsonString(resultText);
  const parsedObj = JSON.parse(jsonStr);

  // Check if it's an error shape
  const errorParsed = visionExtractionErrorSchema.safeParse(parsedObj);
  if (errorParsed.success) {
    throw new ValidationError(errorParsed.data.error);
  }

  // Validate output format using Zod
  try {
    return visionExtractionSchema.parse(parsedObj);
  } catch (zodErr) {
    throw new AppError("LLM returned invalid product data schema", 502);
  }
};

export const recommendAlternativesService = async (product) => {
  const client = getClient();
  const promptText = `${RECOMMENDATION_PROMPT}${JSON.stringify(product, null, 2)}`;

  const apiResponse = await client.chat.completions.create({
    model: getTextModel(),
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
    throw new ValidationError("No recommendation text returned by LLM");
  }

  try {
    const jsonStr = extractJsonString(responseText);
    const parsedObj = JSON.parse(jsonStr);
    const validated = recommendationsSchema.parse(parsedObj);

    return {
      recommendations: validated.recommendations,
      reasoning_details: assistantMessage?.reasoning_details,
    };
  } catch (err) {
    if (err instanceof ValidationError) {
      throw err;
    }
    throw new AppError("LLM returned invalid recommendations schema", 502);
  }
};
