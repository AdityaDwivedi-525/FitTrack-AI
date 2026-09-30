"""
evaluate_models.py
------------------
Saves one individual confusion matrix PNG per model.

Calorie bins:
    Low       : < 50 kcal
    Moderate  : 50 - 150 kcal
    High      : 150 - 300 kcal
    Very High : > 300 kcal

Run from the backend/ directory:
    python evaluate_models.py
"""

import os
import sys
import numpy as np
import pandas as pd
import joblib
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.metrics import confusion_matrix, classification_report

sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf8', buffering=1)
np.random.seed(42)

# ---- Paths -------------------------------------------------------------------
BACKEND_DIR  = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BACKEND_DIR, "datasets", "fitness_tracker_dataset.csv")
OUTPUT_DIR   = os.path.join(BACKEND_DIR, "evaluation_results")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ---- Bin definitions ---------------------------------------------------------
BIN_LABELS   = ["Low\n(<50 kcal)", "Moderate\n(50-150 kcal)",
                 "High\n(150-300 kcal)", "Very High\n(>300 kcal)"]
BIN_KEYS     = ["Low(<50)", "Moderate(50-150)", "High(150-300)", "VeryHigh(>300)"]

def to_bins(values):
    result = []
    for v in values:
        if   v < 50:  result.append("Low(<50)")
        elif v < 150: result.append("Moderate(50-150)")
        elif v < 300: result.append("High(150-300)")
        else:         result.append("VeryHigh(>300)")
    return result

# ---- Load dataset ------------------------------------------------------------
print("Loading dataset ...")
df = pd.read_csv(DATASET_PATH)
X  = df[["exercise_type", "intensity", "body_weight_kg", "duration_secs", "reps"]]
y  = df["calories_burned"]

_, X_test, _, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
y_true = to_bins(y_test.values)

# ---- Load models -------------------------------------------------------------
MODEL_FILES = {
    "Random Forest"     : "rf_model.pkl",
    "Linear Regression" : "lr_model.pkl",
    "XGBoost"           : "xgb_model.pkl",
    "SVM (SVR)"         : "svm_model.pkl",
}

PALETTE = {
    "Random Forest"     : ("#6C3FC8", "Purples"),
    "Linear Regression" : ("#1A8FE3", "Blues"),
    "XGBoost"           : ("#E05C2A", "Oranges"),
    "SVM (SVR)"         : ("#27AE60", "Greens"),
}

models = {}
for name, fname in MODEL_FILES.items():
    path = os.path.join(BACKEND_DIR, fname)
    if os.path.exists(path):
        models[name] = joblib.load(path)
        print(f"  [OK] Loaded {name}")
    else:
        print(f"  [!] {fname} not found - skipping {name}")

if not models:
    raise RuntimeError("No .pkl files found. Run train_calorie_model.py first.")

# ---- Generate one confusion matrix per model ---------------------------------
for model_name, model in models.items():
    title_color, cmap = PALETTE.get(model_name, ("#FFFFFF", "Blues"))

    y_pred = to_bins(model.predict(X_test))
    cm     = confusion_matrix(y_true, y_pred, labels=BIN_KEYS)

    # Row-normalise (recall perspective)
    cm_norm     = cm.astype(float)
    row_sums    = cm_norm.sum(axis=1, keepdims=True)
    row_sums[row_sums == 0] = 1
    cm_norm     = cm_norm / row_sums

    # ---------- Plot ----------------------------------------------------------
    fig, ax = plt.subplots(figsize=(8, 6))
    fig.patch.set_facecolor("#0D0D1A")
    ax.set_facecolor("#14142B")

    sns.heatmap(
        cm_norm,
        annot=False,
        cmap=cmap,
        linewidths=1.2,
        linecolor="#0D0D1A",
        xticklabels=BIN_LABELS,
        yticklabels=BIN_LABELS,
        ax=ax,
        cbar=True,
        vmin=0, vmax=1
    )

    # Annotate each cell
    n = len(BIN_KEYS)
    for r in range(n):
        for c in range(n):
            count     = cm[r, c]
            pct       = cm_norm[r, c] * 100
            txt_color = "white" if cm_norm[r, c] > 0.4 else "#AAAACC"
            ax.text(c + 0.5, r + 0.5,
                    f"{count:,}\n({pct:.1f}%)",
                    ha="center", va="center",
                    fontsize=11, color=txt_color, fontweight="bold")

    # Title & labels
    ax.set_title(f"Confusion Matrix  -  {model_name}",
                 color=title_color, fontsize=15, fontweight="bold", pad=14)
    ax.set_xlabel("Predicted Calorie Range", color="#BBBBCC", fontsize=11, labelpad=10)
    ax.set_ylabel("Actual Calorie Range",    color="#BBBBCC", fontsize=11, labelpad=10)
    ax.tick_params(colors="#AAAACC", labelsize=9)
    for spine in ax.spines.values():
        spine.set_edgecolor("#333366")

    # Colour-bar: show as %
    cbar = ax.collections[0].colorbar
    cbar.ax.tick_params(colors="#AAAACC", labelsize=9)
    cbar.ax.yaxis.set_major_formatter(
        mticker.FuncFormatter(lambda val, _: f"{val*100:.0f}%")
    )

    # Accuracy as sub-title
    acc = cm.diagonal().sum() / cm.sum() * 100
    fig.text(0.5, 0.01, f"Overall Accuracy: {acc:.2f}%  |  Test set: {cm.sum():,} samples",
             ha="center", color="#888899", fontsize=9)

    plt.tight_layout(rect=[0, 0.03, 1, 1])

    # Save
    safe_name = model_name.replace(" ", "_").replace("(", "").replace(")", "")
    out_path  = os.path.join(OUTPUT_DIR, f"cm_{safe_name}.png")
    fig.savefig(out_path, dpi=150, bbox_inches="tight", facecolor=fig.get_facecolor())
    plt.close(fig)

    # Console report
    print(f"\n  --- {model_name} (Accuracy: {acc:.2f}%) ---")
    print(classification_report(y_true, y_pred, labels=BIN_KEYS,
                                 target_names=["Low", "Moderate", "High", "VeryHigh"],
                                 zero_division=0))
    print(f"  [SAVED] {out_path}")

print("\nDone! All confusion matrices saved to:", OUTPUT_DIR)
