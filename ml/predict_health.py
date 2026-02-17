import os
import sys
import json
import joblib
import numpy as np

def main():
    try:
        # Get absolute path to model
        BASE_DIR = os.path.dirname(os.path.abspath(__file__))
        MODEL_PATH = os.path.join(BASE_DIR, "models", "health_model.pkl")

        # Check if model exists
        if not os.path.exists(MODEL_PATH):
            print(json.dumps({"error": "Model file not found", "ml_health_label": "unavailable"}))
            sys.exit(0)

        # Load the model
        model = joblib.load(MODEL_PATH)

        # Read features from stdin
        input_data = json.loads(sys.stdin.read())

        # Extract features in correct order
        features = [
            input_data.get("sugar", 0),
            input_data.get("fat", 0),
            input_data.get("salt", 0),
            input_data.get("fiber", 0),
            input_data.get("protein", 0),
            input_data.get("energy", 0),
            input_data.get("additives", 0),
            input_data.get("nova", 0),
            input_data.get("plastic", 0),
            input_data.get("palm_oil", 0),
        ]

        # Reshape for model prediction
        X = np.array(features, dtype=float).reshape(1, -1)

        # Make prediction
        prediction = int(model.predict(X)[0])

        # Ensure prediction is valid (0, 1, or 2)
        if prediction not in [0, 1, 2]:
            prediction = 1  # Default to moderate if invalid

        # Send result back to Node.js as clean JSON
        print(json.dumps({"ml_health_label": prediction}))
        sys.exit(0)

    except json.JSONDecodeError as e:
        print(json.dumps({"error": "Invalid input JSON", "ml_health_label": "unavailable"}))
        sys.exit(0)
    except KeyError as e:
        print(json.dumps({"error": f"Missing feature: {e}", "ml_health_label": "unavailable"}))
        sys.exit(0)
    except Exception as e:
        print(json.dumps({"error": str(e), "ml_health_label": "unavailable"}))
        sys.exit(0)

if __name__ == "__main__":
    main()

