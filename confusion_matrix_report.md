# Confusion Matrices – Calorie Burn Prediction

> [!NOTE]
> All four models are **regressors** (they predict a continuous calorie value).
> To produce a confusion matrix, predictions are bucketed into four calorie-range classes:
> | Bin | Range |
> |-----|-------|
> | Low | < 50 kcal |
> | Moderate | 50 – 150 kcal |
> | High | 150 – 300 kcal |
> | Very High | > 300 kcal |
>
> Evaluated on the **20 % hold-out test set (2,000 samples)**.

---

## Confusion Matrices (row-normalised)

Each cell shows **raw count** and **row % (recall view)** — how well each true class was predicted.

![Confusion Matrices for all 4 models](C:\Users\Aditya Dwivedi\.gemini\antigravity\brain\97dde7f9-7813-472e-a28b-1791d5af36ec\confusion_matrices.png)

---

## Performance Summary Heatmap

All metrics are on a **0 – 100 % scale** for uniform coloring.

![Model Performance Summary Heatmap](C:\Users\Aditya Dwivedi\.gemini\antigravity\brain\97dde7f9-7813-472e-a28b-1791d5af36ec\model_summary_heatmap.png)

---

## Numeric Results

| Model | Accuracy | Macro F1 | Macro Precision | Macro Recall |
|---|---|---|---|---|
| **Random Forest** | **98.70%** | **0.7377** | **0.7399** | **0.7356** |
| Linear Regression | 91.60% | 0.6653 | 0.6935 | 0.6434 |
| XGBoost | 98.40% | 0.7361 | 0.7382 | 0.7342 |
| SVM (SVR) | 97.80% | 0.7237 | 0.7316 | 0.7163 |

---

## Key Observations

- **Random Forest** is the best performer — 98.7% accuracy with the highest Macro F1.
- **XGBoost** is a very close second (98.4%) — virtually tied with RF in all bins.
- **SVM (SVR)** is solid at 97.8%, but marginally weaker on the High bin.
- **Linear Regression** lags at 91.6%; it misclassifies more High-calorie workouts as Moderate.
- The **VeryHigh (>300 kcal)** class has 0 test samples — this is a dataset distribution issue (synthetic data rarely produces sessions >300 kcal). No model can be judged on that bin.

> [!TIP]
> To improve VeryHigh class coverage, increase `duration_secs` upper bound or `body_weight_kg` upper bound in `generate_synthetic_data()` so that the MET formula produces more >300 kcal samples.
