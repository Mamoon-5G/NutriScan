import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import Piscina from "piscina";
import logger from "./logger.js";
import predictHealthMLWorker from "../workers/mlWorker.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const WORKER_PATH = resolve(__dirname, "../workers/mlWorker.js");

let pool = null;

if (!process.env.VERCEL) {
  try {
    // Instantiate a worker pool
    pool = new Piscina({
      filename: WORKER_PATH,
      // Let Piscina manage the pool size automatically based on cores
    });
  } catch (error) {
    logger.warn("Failed to initialize Piscina pool. Falling back to sync worker execution.", error);
  }
} else {
  logger.info("Running in Vercel environment. Using sync worker execution for ML predictions.");
}

export const predictHealthML = async (input_data) => {
  try {
    if (pool) {
      // Offload the heavy computation to a background thread
      const result = await pool.run(input_data);
      return result;
    } else {
      // Fallback to synchronous execution
      return predictHealthMLWorker(input_data);
    }
  } catch (error) {
    logger.error({ err: error }, "❌ JS ML prediction error in worker pool");
    return { ml_health_label: "unavailable" };
  }
};
