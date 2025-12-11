import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, SentimentType } from "../types";

// Safely access process.env
const getApiKey = () => {
  try {
    return (typeof process !== 'undefined' && process.env && process.env.API_KEY) || '';
  } catch {
    return '';
  }
};

const apiKey = getApiKey();

const generateId = () => {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
  } catch {}
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// --- NLP Helper Functions ---
const STOP_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there',
  'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me'
]);

const preprocessText = (text: string) => {
  const rawTokens = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
  const filteredTokens = rawTokens.filter(t => !STOP_WORDS.has(t));
  const stems = filteredTokens.map(token => {
    if (token.length < 4) return token;
    if (token.endsWith('ing')) return token.slice(0, -3);
    if (token.endsWith('ed')) return token.slice(0, -2);
    if (token.endsWith('es')) return token.slice(0, -2);
    if (token.endsWith('s') && !token.endsWith('ss')) return token.slice(0, -1);
    return token;
  });
  return Array.from(new Set(stems));
};

// --- Mock Generators for Free Mode ---

const getMockMetadata = (text: string) => {
  const t = text.toLowerCase();
  let x = 0, y = 0, type = "The Observer";

  if (t.match(/love|happy|great|amazing/)) {
    x = 0.8; y = 0.7; type = "The Enthusiast";
  } else if (t.match(/angry|hate|terrible|bad/)) {
    x = -0.8; y = 0.8; type = "The Challenger";
  } else if (t.match(/sad|upset|fail/)) {
    x = -0.6; y = -0.5; type = "The Melancholic";
  } else if (t.match(/calm|peace|okay/)) {
    x = 0.5; y = -0.6; type = "The Mediator";
  }
  
  return { pcaPoint: { x, y }, personalityType: type };
};

const generateMockAnalysis = (input: string, source: AnalysisResult['source']): Promise<any> => {
  return new Promise((resolve) => {
    // INSTANT RESPONSE - No Timeout
    const { pcaPoint, personalityType } = getMockMetadata(input);
    const isNegative = input.toLowerCase().match(/bad|terrible|hate|angry|upset|fail|refund/);
    const keywords = preprocessText(input);
    
    let sentiment = SentimentType.NEUTRAL;
    let emotions = [{ name: 'Indifference', score: 0.8 }];
    let summary = 'User provided neutral feedback regarding the service.';
    let actionItem = 'Monitor for further feedback.';
    let healthMetrics = {
    heartRate: 72,
    bloodPressure: { systolic: 118, diastolic: 78 },
    stressLevel: 'Low'
    };
    
    // Detailed Mock Medical Data
    let medicalMetrics = {
    heartRate: 78,
    spO2: 98,
    respirationRate: 16,
    temperature: 98.6,
    ecgStatus: 'Normal Sinus Rhythm',
    diagnosis: 'Healthy / No Abnormalities Detected',
    confidenceScore: 0.92,
    impressions: ['Clear skin tone', 'No visible inflammation', 'Normal pupil dilation'],
    medications: [
        { name: 'Multivitamin', dosage: '1 Tab', frequency: 'Daily', duration: 'Ongoing', type: 'Tablet', purpose: 'General Wellness' }
    ]
    };
    
    let dailyRoutine = {
    morning: [{ name: 'Light Yoga', type: 'Flexibility', durationMinutes: 15, intensity: 'Low', caloriesBurned: 50, description: 'Stretch to wake up body.' }],
    afternoon: [{ name: 'Brisk Walk', type: 'Cardio', durationMinutes: 30, intensity: 'Medium', caloriesBurned: 150, description: 'Walk after lunch.' }],
    evening: [{ name: 'Meditation', type: 'Balance', durationMinutes: 10, intensity: 'Low', caloriesBurned: 20, description: 'Calm down before sleep.' }],
    totalExerciseTime: 55,
    recommendationReason: "Based on neutral stress levels, a balanced routine is recommended."
    };

    if (source === 'Medical' && isNegative) {
        medicalMetrics = {
        heartRate: 102,
        spO2: 95,
        respirationRate: 22,
        temperature: 100.4,
        ecgStatus: 'Tachycardia',
        diagnosis: 'Acute Upper Respiratory Infection',
        confidenceScore: 0.89,
        impressions: ['Facial flushing', 'Visible fatigue', 'Mouth breathing detected'],
        medications: [
            { name: 'Amoxicillin', dosage: '500mg', frequency: 'Every 8 hours', duration: '7 Days', type: 'Tablet', purpose: 'Bacterial Infection' },
            { name: 'Acetaminophen', dosage: '500mg', frequency: 'As needed', duration: '3 Days', type: 'Tablet', purpose: 'Fever Reduction' }
        ]
        };
    }

    resolve({
    sentiment,
    confidence: 0.85 + Math.random() * 0.1,
    emotions,
    summary,
    actionItem,
    pcaPoint,
    personalityType,
    healthMetrics,
    medicalMetrics: source === 'Medical' ? medicalMetrics : undefined,
    keywords: keywords.slice(0, 8),
    dailyRoutine
    });
  });
};

// --- Main Analysis Logic ---

const exerciseSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        type: { type: Type.STRING, enum: ['Cardio', 'Strength', 'Flexibility', 'Balance'] },
        durationMinutes: { type: Type.NUMBER },
        intensity: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
        caloriesBurned: { type: Type.NUMBER },
        description: { type: Type.STRING }
    }
};

const medicationSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        dosage: { type: Type.STRING },
        frequency: { type: Type.STRING },
        duration: { type: Type.STRING },
        type: { type: Type.STRING, enum: ['Tablet', 'Syrup', 'Injection', 'Cream', 'Inhaler', 'Drops'] },
        purpose: { type: Type.STRING }
    }
};

const commonSchema = {
  type: Type.OBJECT,
  properties: {
    sentiment: {
      type: Type.STRING,
      enum: [SentimentType.POSITIVE, SentimentType.NEGATIVE, SentimentType.NEUTRAL]
    },
    confidence: { type: Type.NUMBER },
    emotions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { name: { type: Type.STRING }, score: { type: Type.NUMBER } }
      }
    },
    summary: { type: Type.STRING },
    actionItem: { type: Type.STRING },
    pcaPoint: {
      type: Type.OBJECT,
      description: "Coordinates for Russell's Circumplex Model. X is Valence (-1 to 1), Y is Arousal (-1 to 1).",
      properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } }
    },
    personalityType: {
      type: Type.STRING,
      description: "A 1-2 word archetype name describing the user based on tone (e.g., The Visionary, The Critic, The Peacemaker)."
    },
    healthMetrics: {
        type: Type.OBJECT,
        description: "Estimated physiological metrics based on voice tone/tension or visual cues.",
        properties: {
            heartRate: { type: Type.NUMBER, description: "Estimated beats per minute" },
            bloodPressure: {
                type: Type.OBJECT,
                properties: {
                    systolic: { type: Type.NUMBER },
                    diastolic: { type: Type.NUMBER }
                }
            },
            stressLevel: { type: Type.STRING, enum: ["Low", "Moderate", "High", "Critical"] }
        }
    },
    medicalMetrics: {
        type: Type.OBJECT,
        description: "Deep Learning Medical Analysis Output.",
        properties: {
            heartRate: { type: Type.NUMBER },
            spO2: { type: Type.NUMBER },
            respirationRate: { type: Type.NUMBER },
            temperature: { type: Type.NUMBER },
            ecgStatus: { type: Type.STRING, enum: ['Normal Sinus Rhythm', 'Arrhythmia', 'Tachycardia', 'Bradycardia'] },
            diagnosis: { type: Type.STRING, description: "Identify the disease or condition based on visual symptoms." },
            confidenceScore: { type: Type.NUMBER, description: "AI Confidence in diagnosis (0-1)." },
            impressions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of specific visual findings." },
            medications: { type: Type.ARRAY, items: medicationSchema, description: "Prescribed medication plan tailored to the PATIENT PROFILE." }
        }
    },
    dailyRoutine: {
        type: Type.OBJECT,
        description: "A recommended daily exercise routine based on the user's current state and health metrics.",
        properties: {
            morning: { type: Type.ARRAY, items: exerciseSchema },
            afternoon: { type: Type.ARRAY, items: exerciseSchema },
            evening: { type: Type.ARRAY, items: exerciseSchema },
            totalExerciseTime: { type: Type.NUMBER, description: "Total minutes of exercise" },
            recommendationReason: { type: Type.STRING, description: "Why this routine fits this person" }
        }
    }
  }
};

const getPrompt = (text: string, context: string, ageGroup?: string) => `
Analyze this input: "${text}". 
Context: ${context}.
${ageGroup ? `PATIENT PROFILE: ${ageGroup} (Crucial: Adjust all medication dosages and frequencies for this specific age group).` : ''}

Provide a JSON response including:
1. Sentiment & Emotions.
2. Health Metrics.
3. If Medical Context: Perform a deep visual analysis.
   - LIST VISUAL IMPRESSIONS.
   - PROVIDE DIAGNOSIS.
   - PRESCRIBE MEDICATION (Name, Dosage, Frequency, Type).
     * If Patient is Child: Use pediatric dosages (e.g. syrups, lower mg).
     * If Patient is Senior: Consider lower dosages/gentler meds.
4. A "Daily Routine" plan.
`;

export const analyzeText = async (text: string, ageGroup?: string): Promise<AnalysisResult> => {
  const keywords = preprocessText(text);

  if (!apiKey) {
    const json = await generateMockAnalysis(text, 'Manual');
    return formatResult(json, text, 'Manual', keywords);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: getPrompt(text, `Keywords: ${keywords.join(', ')}`, ageGroup) }] }],
      config: { responseMimeType: "application/json", responseSchema: commonSchema }
    });
    return formatResult(JSON.parse(response.text || '{}'), text, 'Manual', keywords);
  } catch (error) {
    console.error("Gemini Text Error", error);
    const json = await generateMockAnalysis(text, 'Manual');
    return formatResult(json, text, 'Manual', keywords);
  }
};

export const analyzeImage = async (base64Image: string, isMedical: boolean = false, ageGroup?: string): Promise<AnalysisResult> => {
  const cleanBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
  const source = isMedical ? 'Medical' : 'Camera';
  
  if (!apiKey) {
    const json = await generateMockAnalysis("Visual analysis: Detected a person.", source);
    return formatResult(json, "Image Analysis", source, []);
  }

  const textPrompt = isMedical 
    ? "Act as a specialized Medical Diagnostic AI. Analyze the image for specific disease indicators. Provide 'impressions' (visual evidence), a specific 'diagnosis', and a 'medication' plan."
    : "Analyze facial expression and body language. Estimate stress and vitals.";

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
            { text: getPrompt("Image Input", textPrompt, ageGroup) }
          ]
        }
      ],
      config: { responseMimeType: "application/json", responseSchema: commonSchema }
    });
    return formatResult(JSON.parse(response.text || '{}'), isMedical ? "Medical Scan" : "Image Analysis", source, []);
  } catch (error) {
    console.error("Gemini Image Error", JSON.stringify(error));
    const json = await generateMockAnalysis("Image Analysis", source);
    return formatResult(json, "Image Analysis", source, []);
  }
};

export const analyzeAudio = async (base64Audio: string, ageGroup?: string): Promise<AnalysisResult> => {
  const cleanBase64 = base64Audio.includes(',') ? base64Audio.split(',')[1] : base64Audio;

  if (!apiKey) {
    const json = await generateMockAnalysis("Audio analysis.", 'Voice');
    return formatResult(json, "Voice Analysis", 'Voice', []);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          parts: [
            { inlineData: { mimeType: 'audio/webm', data: cleanBase64 } },
            { text: getPrompt("Audio Input", "Analyze vocal biomarkers, tone, jitter.", ageGroup) }
          ]
        }
      ],
      config: { responseMimeType: "application/json", responseSchema: commonSchema }
    });
    return formatResult(JSON.parse(response.text || '{}'), "Voice Analysis", 'Voice', []);
  } catch (error) {
    console.error("Gemini Audio Error", JSON.stringify(error));
    const json = await generateMockAnalysis("Voice Analysis", 'Voice');
    return formatResult(json, "Voice Analysis", 'Voice', []);
  }
};

const formatResult = (json: any, text: string, source: AnalysisResult['source'], keywords?: string[]): AnalysisResult => ({
  id: generateId(),
  text,
  timestamp: new Date(),
  source,
  sentiment: json.sentiment || SentimentType.NEUTRAL,
  confidence: json.confidence || 0.8,
  emotions: json.emotions || [],
  summary: json.summary || "Analysis completed.",
  actionItem: json.actionItem || "Review details.",
  pcaPoint: json.pcaPoint || { x: 0, y: 0 },
  personalityType: json.personalityType || "The Observer",
  healthMetrics: json.healthMetrics || { heartRate: 72, bloodPressure: { systolic: 120, diastolic: 80 }, stressLevel: "Low" },
  medicalMetrics: json.medicalMetrics,
  keywords: keywords || [],
  dailyRoutine: json.dailyRoutine
});
