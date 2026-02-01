/**
 * Real-time Video Processing Service
 * Handles continuous frame processing for live detection
 */

export interface VideoProcessingConfig {
    frameSkip: number; // Process every Nth frame
    minFrameInterval: number; // Minimum ms between processing
    enableThrottling: boolean;
}

export const DEFAULT_VIDEO_CONFIG: VideoProcessingConfig = {
    frameSkip: 3, // Process every 3rd frame (10 FPS at 30 FPS camera)
    minFrameInterval: 100, // Process at most every 100ms
    enableThrottling: true,
};

class VideoProcessingService {
    private frameCount: number = 0;
    private lastProcessTime: number = 0;
    private isProcessing: boolean = false;

    /**
     * Check if current frame should be processed
     */
    shouldProcessFrame(config: VideoProcessingConfig = DEFAULT_VIDEO_CONFIG): boolean {
        if (this.isProcessing) {
            return false; // Skip if still processing previous frame
        }

        this.frameCount++;

        // Frame skip check
        if (config.enableThrottling && this.frameCount % config.frameSkip !== 0) {
            return false;
        }

        // Time interval check
        const now = Date.now();
        if (now - this.lastProcessTime < config.minFrameInterval) {
            return false;
        }

        return true;
    }

    /**
     * Mark frame processing as started
     */
    startProcessing(): void {
        this.isProcessing = true;
        this.lastProcessTime = Date.now();
    }

    /**
     * Mark frame processing as complete
     */
    endProcessing(): void {
        this.isProcessing = false;
    }

    /**
     * Reset counters
     */
    reset(): void {
        this.frameCount = 0;
        this.lastProcessTime = 0;
        this.isProcessing = false;
    }

    /**
     * Get current FPS based on processing rate
     */
    getCurrentFPS(): number {
        const now = Date.now();
        const elapsed = now - this.lastProcessTime;
        if (elapsed === 0) return 0;
        return Math.round(1000 / elapsed);
    }
}

export const videoProcessingService = new VideoProcessingService();
