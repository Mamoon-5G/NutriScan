import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ML_SCRIPT_PATH = resolve(__dirname, "../ml/predict_health.py");

const ML_TIMEOUT = 10000; // 10 seconds timeout

export const predictHealthML = (features) => {
  return new Promise((resolve) => {
    let timedOut = false;

    // Set timeout - if ML takes too long, return unavailable
    const timeout = setTimeout(() => {
      timedOut = true;
      console.warn("⚠️ ML prediction timeout - exceeded 10s");
      resolve({ ml_health_label: "unavailable" });
    }, ML_TIMEOUT);

    try {
      const python = spawn("python3", [ML_SCRIPT_PATH], {
        stdio: ["pipe", "pipe", "pipe"],
      });

      let result = "";
      let errorOutput = "";

      python.stdout.on("data", (data) => {
        if (!timedOut) {
          result += data.toString();
        }
      });

      python.stderr.on("data", (err) => {
        if (!timedOut) {
          errorOutput += err.toString();
          console.error("ML stderr:", errorOutput);
        }
      });

      python.on("close", (code) => {
        if (timedOut) return;

        clearTimeout(timeout);

        if (code !== 0) {
          console.error(`ML script exited with code ${code}`);
          resolve({ ml_health_label: "unavailable" });
          return;
        }

        try {
          const parsed = JSON.parse(result);
          resolve(parsed);
        } catch (e) {
          console.error("Failed to parse ML output:", result, e);
          resolve({ ml_health_label: "unavailable" });
        }
      });

      python.on("error", (err) => {
        if (!timedOut) {
          clearTimeout(timeout);
          console.error("Failed to spawn ML process:", err);
          resolve({ ml_health_label: "unavailable" });
        }
      });

      // Write features to stdin
      python.stdin.write(JSON.stringify(features));
      python.stdin.end();
    } catch (err) {
      clearTimeout(timeout);
      console.error("ML execution error:", err);
      resolve({ ml_health_label: "unavailable" });
    }
  });
};

