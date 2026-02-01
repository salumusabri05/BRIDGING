/**
 * MediaPipe Hand Detection Service
 * Handles hand landmark detection using MediaPipe Tasks Vision
 */

import { HandLandmarker, FilesetResolver, HandLandmarkerResult } from '@mediapipe/tasks-vision';
import { Landmark, HandDetectionResult } from '../types/tsl.types';
import { MEDIAPIPE_CONFIG } from '../constants/mediapipe';
import { convertMediaPipeLandmarks } from '../utils/landmark-processor';

class MediaPipeService {
    private handLandmarker: HandLandmarker | null = null;
    private initialized: boolean = false;
    private initializing: boolean = false;

    /**
     * Initialize MediaPipe Hand Landmarker
     */
    async initialize(): Promise<void> {
        if (this.initialized || this.initializing) {
            return;
        }

        this.initializing = true;

        try {
            console.log('Initializing MediaPipe Hand Landmarker...');

            const vision = await FilesetResolver.forVisionTasks(
                'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
            );

            this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: MEDIAPIPE_CONFIG.MODEL_ASSET_PATH,
                    delegate: 'GPU',
                },
                runningMode: MEDIAPIPE_CONFIG.RUNNING_MODE,
                numHands: MEDIAPIPE_CONFIG.MAX_NUM_HANDS,
                minHandDetectionConfidence: MEDIAPIPE_CONFIG.MIN_DETECTION_CONFIDENCE,
                minHandPresenceConfidence: MEDIAPIPE_CONFIG.MIN_PRESENCE_CONFIDENCE,
                minTrackingConfidence: MEDIAPIPE_CONFIG.MIN_TRACKING_CONFIDENCE,
            });

            this.initialized = true;
            console.log('MediaPipe initialized successfully');
        } catch (error) {
            console.error('Failed to initialize MediaPipe:', error);
            this.initialized = false;
            throw error;
        } finally {
            this.initializing = false;
        }
    }

    /**
     * Detect hand landmarks from video frame
     */
    async detectFromVideo(
        videoElement: HTMLVideoElement,
        timestamp: number
    ): Promise<HandDetectionResult> {
        if (!this.initialized || !this.handLandmarker) {
            await this.initialize();
        }

        try {
            const result = this.handLandmarker!.detectForVideo(videoElement, timestamp);
            return this.processResult(result);
        } catch (error) {
            console.error('Hand detection error:', error);
            return { detected: false };
        }
    }

    /**
     * Detect hand landmarks from image
     */
    async detectFromImage(imageElement: HTMLImageElement): Promise<HandDetectionResult> {
        if (!this.initialized || !this.handLandmarker) {
            await this.initialize();
        }

        try {
            const result = this.handLandmarker!.detect(imageElement);
            return this.processResult(result);
        } catch (error) {
            console.error('Hand detection error:', error);
            return { detected: false };
        }
    }

    /**
     * Process MediaPipe detection result
     */
    private processResult(result: HandLandmarkerResult): HandDetectionResult {
        if (!result.landmarks || result.landmarks.length === 0) {
            return { detected: false };
        }

        // Get first hand landmarks
        const handLandmarks = result.landmarks[0];

        if (handLandmarks.length !== MEDIAPIPE_CONFIG.HAND_LANDMARK_COUNT) {
            console.warn(`Expected ${MEDIAPIPE_CONFIG.HAND_LANDMARK_COUNT} landmarks, got ${handLandmarks.length}`);
            return { detected: false };
        }

        const landmarks = convertMediaPipeLandmarks(handLandmarks);

        // Get hand score if available
        const confidence = result.handednesses?.[0]?.[0]?.score ?? 0.8;

        return {
            detected: true,
            landmarks,
            confidence,
        };
    }

    /**
     * Check if service is ready
     */
    isReady(): boolean {
        return this.initialized && this.handLandmarker !== null;
    }

    /**
     * Clean up resources
     */
    dispose(): void {
        if (this.handLandmarker) {
            this.handLandmarker.close();
            this.handLandmarker = null;
        }
        this.initialized = false;
    }
}

// Export singleton instance
export const mediaPipeService = new MediaPipeService();
