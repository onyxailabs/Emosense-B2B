export enum SentimentType {
  POSITIVE = 'Positive',
  NEGATIVE = 'Negative',
  NEUTRAL = 'Neutral',
}

export interface Emotion {
  name: string;
  score: number;
}

export interface PcaPoint {
  x: number; // Valence (-1 to 1)
  y: number; // Arousal (-1 to 1)
}

export interface HealthMetrics {
  heartRate: number;
  bloodPressure: {
    systolic: number;
    diastolic: number;
  };
  stressLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  type: 'Tablet' | 'Syrup' | 'Injection' | 'Cream' | 'Inhaler' | 'Drops';
  purpose: string;
}

export interface MedicalMetrics {
  heartRate: number;
  spO2: number; // Oxygen Saturation
  respirationRate: number;
  temperature: number;
  ecgStatus: 'Normal Sinus Rhythm' | 'Arrhythmia' | 'Tachycardia' | 'Bradycardia';
  diagnosis?: string;
  confidenceScore: number; // Deep learning confidence
  impressions: string[]; // List of visual symptoms detected
  medications: Medication[]; // Prescribed meds
}

export interface Exercise {
  name: string;
  type: 'Cardio' | 'Strength' | 'Flexibility' | 'Balance';
  durationMinutes: number;
  intensity: 'Low' | 'Medium' | 'High';
  caloriesBurned: number;
  description: string;
}

export interface DailyRoutine {
  morning: Exercise[];
  afternoon: Exercise[];
  evening: Exercise[];
  totalExerciseTime: number;
  recommendationReason: string; // Why this specific routine was chosen
}

export interface AnalysisResult {
  id: string;
  text: string; // Or description of image/audio
  timestamp: Date;
  sentiment: SentimentType;
  confidence: number;
  emotions: Emotion[];
  summary: string;
  actionItem: string;
  source: 'Manual' | 'Salesforce' | 'Zendesk' | 'Email' | 'Camera' | 'Voice' | 'Medical';
  pcaPoint: PcaPoint;
  personalityType: string; // e.g., "The Diplomat", "The Commander"
  healthMetrics?: HealthMetrics;
  medicalMetrics?: MedicalMetrics;
  keywords?: string[]; // Extracted NLP tokens
  dailyRoutine?: DailyRoutine; // New personalized routine
}

export interface IntegrationStatus {
  id: string;
  name: string;
  connected: boolean;
  lastSync?: Date;
  icon: string;
}

export type Tab = 'dashboard' | 'analyze' | 'integrations' | 'history' | 'schema' | 'admin';

// --- Auth & User Types ---

export type PlanType = 'Starter' | 'Pro' | 'Enterprise';

export interface User {
  email: string;
  fullName: string;
  passwordHash: string; // In a real app, never store plain text. We will simulate hashing.
  plan: PlanType;
  role: 'user' | 'admin';
  isVerified: boolean;
  verificationCode?: string;
  resetToken?: string;
  createdAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}
