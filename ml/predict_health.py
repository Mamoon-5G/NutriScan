import os
import sys
import json
import joblib
import numpy as np

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "health_model.pkl")

model = joblib.load(MODEL_PATH)

# Read features from stdin
input_data = json.loads(sys.stdin.read())

features = [
    input_data["sugar"],
    input_data["fat"],
    input_data["salt"],
    input_data["fiber"],
    input_data["protein"],
    input_data["energy"],
    input_data["additives"],
    input_data["nova"],
    input_data["plastic"],
    input_data["palm_oil"],
]

X = np.array(features).reshape(1, -1)

prediction = int(model.predict(X)[0])

# Send result back to Node.js
print(json.dumps({ "ml_health_label": prediction }))
