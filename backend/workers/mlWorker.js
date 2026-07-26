import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const WEIGHTS_PATH = resolve(__dirname, "../utils/model_weights.json");

// Cache weights in the worker thread's memory
let modelWeights = null;

const loadWeights = () => {
  if (modelWeights) return modelWeights;
  try {
    const rawData = fs.readFileSync(WEIGHTS_PATH, "utf8");
    modelWeights = JSON.parse(rawData);
    return modelWeights;
  } catch (error) {
    console.error("❌ Failed to load ML model weights in worker:", error.message);
    return null;
  }
};

export default function predictHealthMLWorker(input_data) {
  const weights = loadWeights();
  if (!weights) {
    return { ml_health_label: "unavailable" };
  }

  try {
    // Extract features in the exact same order as the Python script
    const features = [
      input_data.sugar || 0,
      input_data.fat || 0,
      input_data.salt || 0,
      input_data.fiber || 0,
      input_data.protein || 0,
      input_data.energy || 0,
      input_data.additives || 0,
      input_data.nova || 0,
      input_data.plastic || 0,
      input_data.palm_oil || 0,
    ];

    // Compute dot product of features with coefficients for each class
    const scores = weights.classes.map((cls, classIndex) => {
      let score = weights.intercept[classIndex]; // Start with intercept bias

      // Add dot product of coefs and features
      for (let i = 0; i < features.length; i++) {
        score += weights.coef[classIndex][i] * features[i];
      }
      return { class: cls, score };
    });

    // Find the class with the highest score (argmax)
    scores.sort((a, b) => b.score - a.score);
    let prediction = scores[0].class;

    // Ensure prediction is valid (0, 1, or 2)
    if (![0, 1, 2].includes(prediction)) {
      prediction = 1; // Default to moderate if invalid
    }

    return { ml_health_label: prediction };
  } catch (error) {
    console.error("❌ JS ML prediction error in worker:", error.message);
    return { ml_health_label: "unavailable" };
  }
}
