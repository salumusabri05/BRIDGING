/**
 * TSL (Tanzanian Sign Language) Type Definitions
 */

// Single landmark coordinate
export interface Landmark {
  x: number;
  y: number;
  z: number;
}

// Complete hand landmarks (21 points)
export interface HandLandmarks {
  landmarks: Landmark[];
}

// Normalized landmarks for model input
export interface NormalizedLandmarks {
  data: number[]; // Flattened array of 63 features
}

// API Request format
export interface PredictionRequest {
  landmarks: number[][]; // Array of [x, y, z] coordinates
}

// API Response format
export interface PredictionResponse {
  letter: string;
  confidence?: number;
  error?: string;
}

// Prediction history item
export interface PredictionHistoryItem {
  id: string;
  letter: string;
  confidence: number;
  timestamp: Date;
}

// Camera frame data
export interface CameraFrame {
  uri: string;
  width: number;
  height: number;
}

// Hand detection result
export interface HandDetectionResult {
  detected: boolean;
  landmarks?: Landmark[];
  confidence?: number;
}
