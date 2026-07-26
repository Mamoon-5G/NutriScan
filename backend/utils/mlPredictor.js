import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import Piscina from "piscina";
import logger from "./logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const WORKER_PATH = resolve(__dirname, "../workers/mlWorker.js");

// Instantiate a worker pool
const pool = new Piscina({
  filename: WORKER_PATH,
  // Let Piscina manage the pool size automatically based on cores
});

export const predictHealthML = async (input_data) => {
  try {
    // Offload the heavy computation to a background thread
    const result = await pool.run(input_data);
    return result;
  } catch (error) {
    logger.error({ err: error }, "❌ JS ML prediction error in worker pool");
    return { ml_health_label: "unavailable" };
  }
};
