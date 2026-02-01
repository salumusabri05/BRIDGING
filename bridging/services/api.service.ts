/**
 * Backend API Service
 * Handles communication with the TSL prediction model
 */

import axios, { AxiosInstance } from 'axios';
import { PredictionRequest, PredictionResponse, Landmark } from '../types/tsl.types';
import { API_CONFIG } from '../constants/api';
import { landmarksToApiFormat } from '../utils/landmark-processor';

class ApiService {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: API_CONFIG.BASE_URL,
            timeout: API_CONFIG.TIMEOUT,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    /**
     * Send landmarks to backend for prediction
     */
    async predictSign(landmarks: Landmark[]): Promise<PredictionResponse> {
        try {
            const formattedLandmarks = landmarksToApiFormat(landmarks);

            const request: PredictionRequest = {
                landmarks: formattedLandmarks,
            };

            console.log('Sending prediction request:', {
                landmarkCount: formattedLandmarks.length,
                firstLandmark: formattedLandmarks[0],
            });

            const response = await this.client.post<PredictionResponse>(
                API_CONFIG.ENDPOINTS.PREDICT,
                request
            );

            console.log('Prediction response:', response.data);

            return response.data;
        } catch (error) {
            console.error('Prediction API error:', error);

            if (axios.isAxiosError(error)) {
                if (error.response) {
                    // Server responded with error status
                    return {
                        letter: '',
                        error: `Server error: ${error.response.status} - ${error.response.statusText}`,
                    };
                } else if (error.request) {
                    // Request made but no response
                    return {
                        letter: '',
                        error: 'No response from server. Check your internet connection.',
                    };
                }
            }

            return {
                letter: '',
                error: 'Failed to predict sign. Please try again.',
            };
        }
    }

    /**
     * Retry prediction with exponential backoff
     */
    async predictSignWithRetry(
        landmarks: Landmark[],
        maxAttempts: number = API_CONFIG.RETRY_ATTEMPTS
    ): Promise<PredictionResponse> {
        let lastError: string = '';

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                const result = await this.predictSign(landmarks);

                if (!result.error) {
                    return result;
                }

                lastError = result.error;

                // Don't retry on server errors (4xx, 5xx)
                if (result.error.includes('Server error')) {
                    return result;
                }
            } catch (error) {
                lastError = 'Unknown error occurred';
            }

            // Wait before retry (exponential backoff)
            if (attempt < maxAttempts) {
                const delay = API_CONFIG.RETRY_DELAY * Math.pow(2, attempt - 1);
                console.log(`Retrying in ${delay}ms... (Attempt ${attempt}/${maxAttempts})`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        return {
            letter: '',
            error: lastError || 'Max retry attempts reached',
        };
    }

    /**
     * Health check endpoint (if available)
     */
    async checkHealth(): Promise<boolean> {
        try {
            const response = await this.client.get('/health', { timeout: 5000 });
            return response.status === 200;
        } catch (error) {
            console.warn('Health check failed:', error);
            return false;
        }
    }
}

// Export singleton instance
export const apiService = new ApiService();
