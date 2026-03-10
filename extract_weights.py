import joblib
import json
import os

model_path = os.path.join(os.path.dirname(__file__), "ml/models/health_model.pkl")
model = joblib.load(model_path)

weights = {
    "coef": model.coef_.tolist(),
    "intercept": model.intercept_.tolist(),
    "classes": model.classes_.tolist()
}

out_path = os.path.join(os.path.dirname(__file__), "backend/utils/model_weights.json")
with open(out_path, "w") as f:
    json.dump(weights, f, indent=2)

print("Weights extracted to", out_path)
