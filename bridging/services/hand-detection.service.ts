/**
 * TensorFlow Lite Hand Detection Service
 * Real-time hand landmark detection using TensorFlow.js
 */

import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';
import { Landmark, HandDetectionResult } from '../types/tsl.types';

class HandDetectionService {
    private detector: handPoseDetection.HandDetector | null = null;
    private isInitialized = false;
    private isInitializing = false;

    /**
     * Initialize TensorFlow and hand detector
     */
    async initialize(): Promise<void> {
        if (this.isInitialized || this.isInitializing) {
            return;
        }

        this.isInitializing = true;

        try {
            console.log('🤖 Initializing TensorFlow.js...');
            
            // Wait for TensorFlow to be ready
            await tf.ready();
            console.log('✅ TensorFlow.js ready');

            console.log('🖐️ Loading MediaPipeHands model...');
            
            // Create hand detector with MediaPipe model
            this.detector = await handPoseDetection.createDetector(
                handPoseDetection.SupportedModels.MediaPipeHands,
                {
                    runtime: 'tfjs',
                    modelType: 'full', // 'full' or 'lite' - full is more accurate
                    maxHands: 1,
                    detectorModelUrl: undefined, // uses default CDN
                    landmarkModelUrl: undefined, // uses default CDN
                }
            );

            this.isInitialized = true;
            console.log('✅ Hand detection initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize hand detection:', error);
            this.isInitialized = false;
            throw error;
        } finally {
            this.isInitializing = false;
        }
    }

    /**
     * Detect hands from video frame or image tensor
     */
    async detectHands(imageData: any, flipHorizontal: boolean = false): Promise<HandDetectionResult> {
        if (!this.isInitialized || !this.detector) {
            console.warn('⚠️ Detector not initialized, call initialize() first');
            return { detected: false };
        }

        try {
            const hands = await this.detector.estimateHands(imageData, {
                flipHorizontal,
            });

            if (hands.length === 0) {
                return { detected: false };
            }

            // Get first hand
            const hand = hands[0];

            // Convert keypoints to our Landmark format
            const landmarks: Landmark[] = hand.keypoints.map(kp => ({
                x: kp.x,
                y: kp.y,
                z: kp.z || 0,
            }));

            // Get confidence score
            const confidence = hand.score || 0.8;

            return {
                detected: true,
                landmarks,
                confidence,
            };
        } catch (error) {
            console.error('❌ Hand detection error:', error);
            return { detected: false };
        }
    }

    /**
     * Check if service is ready
     */
    isReady(): boolean {
        return this.isInitialized && this.detector !== null;
    }

    /**
     * Get initialization status
     */
    getStatus(): string {
        if (this.isInitializing) return 'initializing';
        if (this.isInitialized) return 'ready';
        return 'not_initialized';
    }

    /**
     * Clean up resources
     */
    async dispose(): Promise<void> {
        if (this.detector) {
            this.detector.dispose();
            this.detector = null;
        }
        this.isInitialized = false;
        console.log('🗑️ Hand detection service disposed');
    }
}

// Export singleton instance
export const handDetectionService = new HandDetectionService();
