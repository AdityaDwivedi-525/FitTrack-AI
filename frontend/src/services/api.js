import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Request interceptor to automatically attach JWT token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const startExercise = async (exercise) => {
  const response = await axios.post(`${API_URL}/start`, { exercise });
  return response.data;
};

export const stopExercise = async () => {
  const response = await axios.post(`${API_URL}/stop`);
  return response.data;
};

export const resetExercise = async () => {
  const response = await axios.post(`${API_URL}/reset`);
  return response.data;
};

export const getReps = async () => {
  const response = await axios.get(`${API_URL}/get_reps`);
  return response.data;
};

export const predictCalories = async (predictionData) => {
  const response = await axios.post(`${API_URL}/predict_calories`, predictionData);
  return response.data;
};

export const registerUser = async (userData) => {
  const response = await axios.post(`${API_URL}/api/auth/register`, userData);
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await axios.post(`${API_URL}/api/auth/login`, credentials);
  return response.data;
};

export const getMe = async (token) => {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const response = await axios.get(`${API_URL}/api/auth/me`, { headers });
  return response.data;
};

export const createWorkoutSession = async (workoutData) => {
  const response = await axios.post(`${API_URL}/api/workouts`, workoutData);
  return response.data;
};

export const getUserWorkouts = async () => {
  const response = await axios.get(`${API_URL}/api/workouts`);
  return response.data;
};

export const getWorkoutById = async (workoutId) => {
  const response = await axios.get(`${API_URL}/api/workouts/${workoutId}`);
  return response.data;
};

export const getWorkoutStats = async () => {
  const response = await axios.get(`${API_URL}/api/workouts/stats`);
  return response.data;
};

export const getWorkoutAnalytics = async () => {
  const response = await axios.get(`${API_URL}/api/workouts/analytics`);
  return response.data;
};
