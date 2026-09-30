"""
confusion_matrices.py
---------------------
Generates crisp, readable confusion matrices for all 4 calorie-prediction models.

Regression outputs are binned into 4 calorie categories:
  Low  <=50 kcal | Medium 51-150 | High 151-300 | Very High >300
"""

import os
import numpy as np
import pandas as pd
import joblib
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.metrics import confusion_matrix, classification_report, accuracy_score

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR     = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BASE_DIR, 'datasets', 'fitness_tracker_dataset.csv')
OUTPUT_DIR   = os.path.join(BASE_DIR, 'evaluation_results')
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ── Load dataset ──────────────────────────────────────────────────────────────
print("Loading dataset...")
df = pd.read_csv(DATASET_PATH)
print(f"  {len(df):,} rows  |  columns: {list(df.columns)}")

FEATURES = ['exercise_type', 'gender', 'age', 'intensity',
            'body_weight_kg', 'duration_secs', 'reps']
X = df[FEATURES]
y = df['calories_burned']

_, X_test, _, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# ── Binning ────────────────────────────────────────────────────────────────────
BINS        = [0, 50, 150, 300, np.inf]
CLASS_NAMES = ['Low\n(<=50)', 'Medium\n(51-150)', 'High\n(151-300)', 'Very High\n(>300)']

def bin_calories(series):
    return pd.cut(
        series,
        bins=BINS,
        labels=CLASS_NAMES,
        right=True,
        include_lowest=True
    )

y_test_cls = bin_calories(y_test)

# ── Load models ────────────────────────────────────────────────────────────────
MODEL_INFO = [
    ('Random Forest',     'rf_model.pkl',  '#1565C0'),   # dark blue
    ('Linear Regression', 'lr_model.pkl',  '#E65100'),   # dark orange
    ('XGBoost',           'xgb_model.pkl', '#1B5E20'),   # dark green
    ('SVM (SVR)',         'svm_model.pkl', '#4A148C'),   # dark purple
]

models = []
for name, fname, colour in MODEL_INFO:
    path = os.path.join(BASE_DIR, fname)
    if os.path.exists(path):
        m = joblib.load(path)
        models.append((name, m, colour))
        print(f"  Loaded: {name}")
    else:
        print(f"  MISSING: {name}")

# ── Plot helper ───────────────────────────────────────────────────────────────
def plot_cm(ax, cm, title, acc, colour, fontsize=13):
    """Draw a seaborn heatmap confusion matrix on `ax`."""

    # Build a custom white → colour palette
    from matplotlib.colors import LinearSegmentedColormap
    cmap = LinearSegmentedColormap.from_list(
        'custom', ['#FFFFFF', colour], N=256
    )

    annot = np.array([[f"{v}" for v in row] for row in cm])

    sns.heatmap(
        cm,
        ax=ax,
        cmap=cmap,
        annot=annot,
        fmt='',
        linewidths=1.5,
        linecolor='#cccccc',
        cbar=False,
        vmin=0,
        vmax=cm.max() if cm.max() > 0 else 1,
        annot_kws={'size': fontsize + 1, 'weight': 'bold', 'color': 'black'}
    )

    # Axis labels
    ax.set_xlabel('Predicted Category', fontsize=fontsize - 1,
                  fontweight='bold', labelpad=8, color='#222222')
    ax.set_ylabel('True Category', fontsize=fontsize - 1,
                  fontweight='bold', labelpad=8, color='#222222')

    # Tick labels
    ax.set_xticks(np.arange(len(CLASS_NAMES)) + 0.5)
    ax.set_xticklabels(CLASS_NAMES, fontsize=fontsize - 3,
                       ha='center', rotation=0, color='#111111')
    ax.set_yticks(np.arange(len(CLASS_NAMES)) + 0.5)
    ax.set_yticklabels(CLASS_NAMES, fontsize=fontsize - 3,
                       va='center', rotation=0, color='#111111')

    ax.set_title(f'{title}\nAccuracy: {acc*100:.1f}%',
                 fontsize=fontsize + 1, fontweight='bold',
                 color='#111111', pad=12)

    # Fix annotation text colour based on cell darkness
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            val = cm[i, j]
            # dark cell → white text; light cell → black text
            brightness = val / (cm.max() + 1e-9)
            txt_color  = 'white' if brightness > 0.55 else 'black'
            ax.texts[i * cm.shape[1] + j].set_color(txt_color)

# ── Generate all matrices ─────────────────────────────────────────────────────
print("\nBuilding confusion matrices...")

cms, accs = [], []
for name, model, colour in models:
    y_pred_raw = model.predict(X_test)
    y_pred_cls = bin_calories(pd.Series(y_pred_raw, index=X_test.index))

    # Remove NaN from bin boundaries
    mask      = (~y_test_cls.isna()) & (~y_pred_cls.isna())
    y_true_f  = y_test_cls[mask]
    y_pred_f  = y_pred_cls[mask]

    cm  = confusion_matrix(y_true_f, y_pred_f, labels=CLASS_NAMES)
    acc = accuracy_score(y_true_f, y_pred_f)
    cms.append(cm)
    accs.append(acc)

    print(f"\n{'='*55}")
    print(f"  {name}  |  Category Accuracy: {acc*100:.1f}%")
    print('='*55)
    print(classification_report(y_true_f, y_pred_f,
                                 labels=CLASS_NAMES, zero_division=0))

# ── 1. Combined 2x2 figure ────────────────────────────────────────────────────
fig, axes = plt.subplots(2, 2, figsize=(16, 13))
fig.patch.set_facecolor('white')
fig.suptitle(
    'Fit-Track AI -- Confusion Matrices for Calorie Category Prediction\n'
    'Categories: Low (<=50 kcal)  |  Medium (51-150)  |  High (151-300)  |  Very High (>300)',
    fontsize=13, fontweight='bold', color='#111111', y=0.99
)

for ax, (name, _, colour), cm, acc in zip(axes.flat, models, cms, accs):
    plot_cm(ax, cm, name, acc, colour, fontsize=12)

plt.tight_layout(pad=2.5, rect=[0, 0, 1, 0.96])
combined_path = os.path.join(OUTPUT_DIR, 'confusion_matrices_all_models.png')
plt.savefig(combined_path, dpi=180, bbox_inches='tight',
            facecolor='white', edgecolor='none')
plt.close()
print(f"\nSaved combined -> {combined_path}")

# ── 2. Individual high-res images ─────────────────────────────────────────────
print("\nSaving individual matrices...")
for (name, _, colour), cm, acc in zip(models, cms, accs):
    fig_i, ax_i = plt.subplots(figsize=(8, 7))
    fig_i.patch.set_facecolor('white')
    plot_cm(ax_i, cm, name, acc, colour, fontsize=14)
    plt.tight_layout(pad=2)

    safe = name.replace(' ', '_').replace('(', '').replace(')', '').replace('/', '')
    out  = os.path.join(OUTPUT_DIR, f'cm_{safe}.png')
    plt.savefig(out, dpi=180, bbox_inches='tight',
                facecolor='white', edgecolor='none')
    plt.close(fig_i)
    print(f"  Saved: {out}")

print("\nAll confusion matrices generated successfully!")
