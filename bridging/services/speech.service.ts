/**
 * Text-to-Speech Service
 * Converts predicted letters/words to speech
 */

import * as Speech from 'expo-speech';

class SpeechService {
    private isSpeaking: boolean = false;
    private queue: string[] = [];

    /**
     * Speak a single letter or word
     */
    async speak(text: string, options?: Speech.SpeechOptions): Promise<void> {
        if (!text) return;

        try {
            await Speech.speak(text, {
                language: 'en-US',
                pitch: 1.0,
                rate: 0.85, // Slightly slower for clarity
                ...options,
                onStart: () => {
                    this.isSpeaking = true;
                },
                onDone: () => {
                    this.isSpeaking = false;
                    this.processQueue();
                },
                onError: (error) => {
                    console.error('Speech error:', error);
                    this.isSpeaking = false;
                    this.processQueue();
                },
            });
        } catch (error) {
            console.error('Failed to speak:', error);
            this.isSpeaking = false;
        }
    }

    /**
     * Add text to speech queue
     */
    addToQueue(text: string): void {
        if (!text) return;

        this.queue.push(text);

        if (!this.isSpeaking) {
            this.processQueue();
        }
    }

    /**
     * Process queued speech items
     */
    private async processQueue(): Promise<void> {
        if (this.queue.length === 0 || this.isSpeaking) {
            return;
        }

        const text = this.queue.shift();
        if (text) {
            await this.speak(text);
        }
    }

    /**
     * Stop current speech
     */
    stop(): void {
        Speech.stop();
        this.isSpeaking = false;
    }

    /**
     * Clear speech queue
     */
    clearQueue(): void {
        this.queue = [];
        this.stop();
    }

    /**
     * Check if speech is available
     */
    async isSpeechAvailable(): Promise<boolean> {
        try {
            const voices = await Speech.getAvailableVoicesAsync();
            return voices.length > 0;
        } catch (error) {
            console.error('Error checking speech availability:', error);
            return false;
        }
    }

    /**
     * Speak a spelled-out word (letter by letter)
     */
    async spellWord(word: string, delayMs: number = 500): Promise<void> {
        for (let i = 0; i < word.length; i++) {
            await this.speak(word[i]);
            if (i < word.length - 1) {
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
    }
}

// Export singleton instance
export const speechService = new SpeechService();
