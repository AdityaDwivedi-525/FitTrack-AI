import React, { useState } from 'react';
import { Flame, X } from 'lucide-react';
import { predictCalories } from '../services/api';

const CaloriePredictorModal = ({ showModal, setShowModal, stats, selectedExercise, durationSecs }) => {
  const [weight, setWeight]           = useState(65);
  const [gender, setGender]           = useState('Male');
  const [age, setAge]                 = useState(25);
  const [modelChoice, setModelChoice] = useState('Random Forest');
  const [manualReps, setManualReps]       = useState('');
  const [calorieResult, setCalorieResult] = useState(null);
  const [isPredicting, setIsPredicting]   = useState(false);

  const calculateCalories = async () => {
    setIsPredicting(true);
    try {
      const isManual = manualReps !== '';
      const effectiveReps = isManual ? (parseInt(manualReps) || 0) : stats.reps_total;
      
      // If manually inputting reps, calculate a realistic matching duration
      // (approx 3.5 sec per rep + 5s base overhead) rather than using the tiny stopwatch duration.
      let finalDuration = durationSecs > 0 ? durationSecs : 10.0;
      if (isManual && effectiveReps > 0) {
        finalDuration = effectiveReps * 3.5 + 5.0;
      }
      
      const calculatedIntensity = parseFloat((effectiveReps / finalDuration).toFixed(4));

      const reqData = {
        exercise_type:  stats.exercise || selectedExercise,
        gender:         gender,
        age:            parseInt(age),
        reps:           effectiveReps,
        duration_secs:  parseFloat(finalDuration.toFixed(2)),
        intensity:      calculatedIntensity,
        body_weight_kg: parseFloat(weight),
        model_choice:   modelChoice
      };

      const result = await predictCalories(reqData);
      setCalorieResult(result.calories_burned);
    } catch (e) {
      console.error("Prediction error:", e);
      setCalorieResult("Error");
    }
    setIsPredicting(false);
  };

  if (!showModal) return null;

  return (
    <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md rounded-3xl flex flex-col p-6 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Flame className="w-6 h-6 text-orange-500" /> AI Calorie Predictor
        </h3>
        <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-xl hover:bg-slate-800">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="space-y-4 flex-grow overflow-y-auto pr-2">

        {/* Gender */}
        <div>
          <label className="text-sm font-semibold text-slate-300 block mb-1">Gender</label>
          <div className="grid grid-cols-2 gap-2">
            {['Male', 'Female'].map(g => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(g)}
                className={`py-2.5 rounded-xl font-bold text-sm transition-all ${
                  gender === g
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-orange-950/50'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-white'
                }`}
              >
                {g === 'Male' ? '♂ Male' : '♀ Female'}
              </button>
            ))}
          </div>
        </div>

        {/* Age */}
        <div>
          <label className="text-sm font-semibold text-slate-300 block mb-1">
            Age &nbsp;<span className="text-orange-400 font-bold">{age} yrs</span>
          </label>
          <input
            type="range"
            min={10}
            max={100}
            value={age}
            onChange={e => setAge(e.target.value)}
            className="w-full accent-orange-500 cursor-pointer"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>10</span><span>100</span>
          </div>
        </div>

        {/* Body Weight */}
        <div>
          <label className="text-sm font-semibold text-slate-300 block mb-1">Body Weight (kg)</label>
          <input
            type="number"
            value={weight}
            onChange={e => setWeight(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 outline-none text-sm font-medium transition-all"
          />
        </div>

        {/* Manual Reps */}
        <div>
          <label className="text-sm font-semibold text-slate-300 block mb-1">Manual Reps Override (Optional)</label>
          <input
            type="number"
            placeholder={`Auto: ${stats.reps_total}`}
            value={manualReps}
            onChange={e => setManualReps(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 outline-none placeholder-slate-600 text-sm font-medium transition-all"
          />
        </div>

        {/* Model choice */}
        <div>
          <label className="text-sm font-semibold text-slate-300 block mb-1">Machine Learning Model</label>
          <select
            value={modelChoice}
            onChange={e => setModelChoice(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 outline-none text-sm font-medium transition-all"
          >
            <option value="Random Forest">🌲 Random Forest (High Accuracy)</option>
            <option value="XGBoost">⚡ XGBoost (Gradient Boosting)</option>
            <option value="SVM">🔷 SVM — Support Vector (RBF Kernel)</option>
            <option value="Linear Regression">📈 Linear Regression (Polynomial)</option>
          </select>
        </div>

        {/* Session info */}
        <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800/80 space-y-2 mt-2">
          <p className="text-xs text-slate-400 flex justify-between">
            <span>Reps:</span> <span className="text-slate-100 font-bold">{manualReps !== '' ? `${manualReps} (Manual)` : stats.reps_total}</span>
          </p>
          <p className="text-xs text-slate-400 flex justify-between">
            <span>Time {manualReps !== '' && '(Auto-Scaled)'}:</span> 
            <span className="text-slate-100 font-bold">
              {manualReps !== '' ? `${((parseInt(manualReps)||0) * 3.5 + 5.0).toFixed(2)} secs` : (durationSecs > 0 ? durationSecs.toFixed(2) : '10.00') + ' secs'}
            </span>
          </p>
          <p className="text-xs text-slate-400 flex justify-between pt-1 border-t border-slate-800/60"><span>Gender / Age:</span> <span className="text-orange-400 font-bold">{gender} · {age} yrs</span></p>
        </div>

        {calorieResult !== null && (
          <div className="mt-4 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-4 text-center transform transition-transform animate-in slide-in-from-bottom-2 shadow-lg shadow-orange-950/40">
            <p className="text-orange-100 text-xs font-bold uppercase tracking-wider">Estimated Burn</p>
            <p className="text-4xl font-black text-white">{calorieResult} <span className="text-base font-normal">kcal</span></p>
          </div>
        )}
      </div>

      <button
        onClick={calculateCalories}
        disabled={isPredicting || (manualReps === '' && stats.reps_total === 0)}
        className="w-full mt-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 px-6 rounded-2xl transition-all shadow-lg shadow-orange-950/50 flex justify-center items-center gap-2 text-sm uppercase tracking-wider"
      >
        {isPredicting ? "Analyzing..." : "Predict Calories"}
      </button>
    </div>
  );
};

export default CaloriePredictorModal;
