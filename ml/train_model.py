import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score
import joblib
import os

# ===============================
# 1. LOAD DATA
# ===============================

csv_path = "../backend/data/training_data.csv"
df = pd.read_csv(csv_path)

print("✅ Dataset loaded")
print("Initial shape:", df.shape)

# ===============================
# 2. DATA CLEANING
# ===============================

# Remove duplicate rows
df = df.drop_duplicates()
print("After removing duplicates:", df.shape)

# Replace missing values with 0
df = df.fillna(0)

# Ensure all columns are numeric
df = df.apply(pd.to_numeric, errors="coerce").fillna(0)

# Optional: remove obviously invalid rows
df = df[df["sugar"] >= 0]
df = df[df["fat"] >= 0]
df = df[df["salt"] >= 0]

print("After cleaning:", df.shape)

# ===============================
# 3. LABEL DISTRIBUTION CHECK
# ===============================

print("\n📊 Health label distribution:")
print(df["health_label"].value_counts())

# ===============================
# 4. SPLIT FEATURES & LABELS
# ===============================

X = df.drop(["health_label", "eco_label"], axis=1)
y = df["health_label"]

# ===============================
# 5. TRAIN-TEST SPLIT
# ===============================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y if len(y.unique()) > 1 else None
)

# ===============================
# 6. TRAIN MODEL
# ===============================

model = LogisticRegression(max_iter=1000)
model.fit(X_train, y_train)

# ===============================
# 7. EVALUATION
# ===============================

y_pred = model.predict(X_test)

print("\n📊 Accuracy:", accuracy_score(y_test, y_pred))
print("\n📄 Classification Report:")
print(classification_report(y_test, y_pred, zero_division=0))

# ===============================
# 8. SAVE MODEL
# ===============================

os.makedirs("models", exist_ok=True)
joblib.dump(model, "models/health_model.pkl")

print("\n💾 Model saved at: ml/models/health_model.pkl")
