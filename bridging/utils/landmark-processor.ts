/**
 * Landmark Data Processing Utilities
 * Implements the preprocessing pipeline from instructions.md
 */

import { Landmark, NormalizedLandmarks } from '../types/tsl.types';
import { MEDIAPIPE_CONFIG } from '../constants/mediapipe';

/**
 * Validates landmark data structure
 */
export function validateLandmarks(landmarks: Landmark[]): boolean {
    if (!landmarks || !Array.isArray(landmarks)) {
        return false;
    }

    if (landmarks.length !== MEDIAPIPE_CONFIG.HAND_LANDMARK_COUNT) {
        console.warn(`Invalid landmark count: ${landmarks.length}, expected ${MEDIAPIPE_CONFIG.HAND_LANDMARK_COUNT}`);
        return false;
    }

    for (const landmark of landmarks) {
        if (
            typeof landmark.x !== 'number' ||
            typeof landmark.y !== 'number' ||
            typeof landmark.z !== 'number' ||
            isNaN(landmark.x) ||
            isNaN(landmark.y) ||
            isNaN(landmark.z)
        ) {
            console.warn('Invalid landmark coordinate detected');
            return false;
        }
    }

    return true;
}

/**
 * Apply min-max normalization to landmarks
 * As specified in instructions.md Step 3
 */
export function normalizeLandmarks(landmarks: Landmark[]): NormalizedLandmarks {
    if (!validateLandmarks(landmarks)) {
        throw new Error('Invalid landmark data');
    }

    // Convert to 2D array for easier processing
    const coords: number[][] = landmarks.map(lm => [lm.x, lm.y, lm.z]);

    // Calculate min and max for each axis
    const mins = [
        Math.min(...coords.map(c => c[0])), // min_x
        Math.min(...coords.map(c => c[1])), // min_y
        Math.min(...coords.map(c => c[2])), // min_z
    ];

    const maxs = [
        Math.max(...coords.map(c => c[0])), // max_x
        Math.max(...coords.map(c => c[1])), // max_y
        Math.max(...coords.map(c => c[2])), // max_z
    ];

    // Normalize each coordinate
    const normalized = coords.map(coord => {
        return coord.map((value, axis) => {
            const range = maxs[axis] - mins[axis];
            // Add small epsilon to avoid division by zero
            return range > 1e-6 ? (value - mins[axis]) / range : 0.5;
        });
    });

    // Flatten to 1D array (step 4 from instructions.md)
    const flattened = normalized.flat();

    if (flattened.length !== MEDIAPIPE_CONFIG.TOTAL_FEATURES) {
        throw new Error(`Invalid feature count: ${flattened.length}, expected ${MEDIAPIPE_CONFIG.TOTAL_FEATURES}`);
    }

    return {
        data: flattened,
    };
}

/**
 * Convert landmarks to API request format
 * Returns array of [x, y, z] arrays
 */
export function landmarksToApiFormat(landmarks: Landmark[]): number[][] {
    if (!validateLandmarks(landmarks)) {
        throw new Error('Invalid landmark data');
    }

    return landmarks.map(lm => [lm.x, lm.y, lm.z]);
}

/**
 * Convert MediaPipe landmark result to our Landmark type
 */
export function convertMediaPipeLandmarks(mediapipeLandmarks: any[]): Landmark[] {
    return mediapipeLandmarks.map(lm => ({
        x: lm.x,
        y: lm.y,
        z: lm.z,
    }));
}

/**
 * Calculate confidence score based on landmark quality
 */
export function calculateLandmarkQuality(landmarks: Landmark[]): number {
    if (!validateLandmarks(landmarks)) {
        return 0;
    }

    // Check if landmarks are well-distributed
    const xValues = landmarks.map(lm => lm.x);
    const yValues = landmarks.map(lm => lm.y);

    const xRange = Math.max(...xValues) - Math.min(...xValues);
    const yRange = Math.max(...yValues) - Math.min(...yValues);

    // Good quality if hand covers reasonable area
    const coverage = (xRange + yRange) / 2;

    // Normalize to 0-1 range (assuming good coverage is > 0.3)
    return Math.min(coverage / 0.3, 1.0);
}
