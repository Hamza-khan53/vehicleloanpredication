
from pathlib import Path
import json

import pandas as pd
import xgboost as xgb
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Locate the model files relative to this file
MODEL_DIR = Path(__file__).resolve().parent / "models"

model = xgb.XGBClassifier()
model.load_model(str(MODEL_DIR / "vehicle_loan_model.json"))

with open(MODEL_DIR / "model_features.json", "r") as f:
    FEATURES = json.load(f)


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "Vehicle Loan Prediction API",
        "status": "running"
    })


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "model_loaded": True,
        "feature_count": len(FEATURES)
    })


@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "error": "Send a JSON object containing the model features."
        }), 400

    missing = [feature for feature in FEATURES if feature not in data]

    if missing:
        return jsonify({
            "error": "Some required features are missing.",
            "missing_features": missing
        }), 400

    try:
        row = pd.DataFrame(
            [[float(data[feature]) for feature in FEATURES]],
            columns=FEATURES
        )

        if row.isna().any().any():
            raise ValueError("Feature values cannot be empty.")

        if not row.map(lambda value: abs(value) != float("inf")).all().all():
            raise ValueError("Feature values must be finite numbers.")

        prediction = int(model.predict(row)[0])

        result = {
            "prediction": prediction,
            "label": (
                "Loan default risk"
                if prediction == 1
                else "No loan default predicted"
            )
        }

        if hasattr(model, "predict_proba"):
            result["probabilities"] = (
                model.predict_proba(row)[0].tolist()
            )

        return jsonify(result)

    except (TypeError, ValueError, OverflowError) as exc:
        return jsonify({"error": str(exc)}), 400


if __name__ == "__main__":
    app.run(debug=True, port=5000)
