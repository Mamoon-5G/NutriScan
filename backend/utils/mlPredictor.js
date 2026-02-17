import { spawn } from "child_process";

export const predictHealthML = (features) => {
  return new Promise((resolve, reject) => {
    const python = spawn("python", ["../ml/predict_health.py"]);

    python.stdin.write(JSON.stringify(features));
    python.stdin.end();

    let result = "";

    python.stdout.on("data", (data) => {
      result += data.toString();
    });

    python.stderr.on("data", (err) => {
      console.error("ML stderr:", err.toString());
    });

    python.on("close", () => {
      try {
        resolve(JSON.parse(result));
      } catch (e) {
        reject("Failed to parse ML output");
      }
    });
  });
};
