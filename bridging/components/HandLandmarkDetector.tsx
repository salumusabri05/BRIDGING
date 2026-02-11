/**
 * Hand Landmark Detection via WebView
 * 
 * Uses MediaPipe Hands JavaScript inside a hidden WebView to detect
 * hand landmarks from captured camera images.
 * 
 * Flow: Camera photo (base64) → WebView (MediaPipe JS) → 21 landmarks → API
 */

import React, { useRef, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

export interface DetectedLandmarks {
    landmarks: { x: number; y: number; z: number }[];
    confidence: number;
}

export interface HandDetectorRef {
    detectFromBase64: (base64Image: string) => Promise<DetectedLandmarks | null>;
}

interface Props {
    onReady?: () => void;
    onError?: (error: string) => void;
}

/**
 * Hidden WebView component that runs MediaPipe Hands
 * Use ref.detectFromBase64(base64) to detect landmarks
 */
const HandLandmarkDetector = forwardRef<HandDetectorRef, Props>(({ onReady, onError }, ref) => {
    const webViewRef = useRef<WebView>(null);
    const resolverRef = useRef<{
        resolve: (value: DetectedLandmarks | null) => void;
        reject: (error: Error) => void;
    } | null>(null);
    const [isReady, setIsReady] = useState(false);

    // Expose detect method to parent via ref
    useImperativeHandle(ref, () => ({
        detectFromBase64: (base64Image: string): Promise<DetectedLandmarks | null> => {
            return new Promise((resolve, reject) => {
                if (!isReady) {
                    reject(new Error('Detector not ready'));
                    return;
                }

                // Store resolver for when WebView responds
                resolverRef.current = { resolve, reject };

                // Set a timeout in case detection hangs
                setTimeout(() => {
                    if (resolverRef.current) {
                        resolverRef.current.resolve(null);
                        resolverRef.current = null;
                    }
                }, 15000);

                // Send image to WebView for processing
                webViewRef.current?.injectJavaScript(`
                    processImage("${base64Image}");
                    true;
                `);
            });
        },
    }), [isReady]);

    const handleMessage = useCallback((event: WebViewMessageEvent) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);

            if (data.type === 'ready') {
                console.log('✅ MediaPipe hand detector ready');
                setIsReady(true);
                onReady?.();
            } else if (data.type === 'landmarks') {
                console.log(`✅ Detected ${data.landmarks.length} landmarks`);
                resolverRef.current?.resolve({
                    landmarks: data.landmarks,
                    confidence: data.confidence || 0.9,
                });
                resolverRef.current = null;
            } else if (data.type === 'no_hand') {
                console.log('⚠️ No hand detected');
                resolverRef.current?.resolve(null);
                resolverRef.current = null;
            } else if (data.type === 'error') {
                console.error('❌ WebView detection error:', data.message);
                onError?.(data.message);
                resolverRef.current?.resolve(null);
                resolverRef.current = null;
            }
        } catch (e) {
            console.error('Failed to parse WebView message:', e);
        }
    }, [onReady, onError]);

    // The HTML that runs MediaPipe Hands in the WebView
    const html = getMediaPipeHTML();

    return (
        <View style={styles.hidden}>
            <WebView
                ref={webViewRef}
                source={{ html }}
                style={styles.webview}
                onMessage={handleMessage}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                allowFileAccess={true}
                mixedContentMode="always"
                originWhitelist={['*']}
                onError={(e) => {
                    console.error('WebView error:', e.nativeEvent.description);
                    onError?.('WebView failed to load');
                }}
            />
        </View>
    );
});

HandLandmarkDetector.displayName = 'HandLandmarkDetector';
export default HandLandmarkDetector;

/**
 * Returns the HTML string that loads MediaPipe Hands and processes images
 */
function getMediaPipeHTML(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; padding: 0; background: #000; }
        canvas { display: none; }
    </style>
</head>
<body>
    <canvas id="canvas"></canvas>
    <script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/hands.min.js"></script>
    <script>
        let handsDetector = null;
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');

        // Send message to React Native
        function sendMessage(data) {
            window.ReactNativeWebView.postMessage(JSON.stringify(data));
        }

        // Initialize MediaPipe Hands
        async function initHands() {
            try {
                handsDetector = new Hands({
                    locateFile: (file) => {
                        return 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/' + file;
                    }
                });

                handsDetector.setOptions({
                    maxNumHands: 1,
                    modelComplexity: 1,
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5
                });

                handsDetector.onResults(onResults);

                // Send a blank frame to initialize the model
                canvas.width = 10;
                canvas.height = 10;
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, 10, 10);
                await handsDetector.send({ image: canvas });

                sendMessage({ type: 'ready' });
            } catch (err) {
                sendMessage({ type: 'error', message: 'Failed to init MediaPipe: ' + err.message });
            }
        }

        // Handle detection results
        function onResults(results) {
            if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                const landmarks = results.multiHandLandmarks[0].map(lm => ({
                    x: lm.x,
                    y: lm.y,
                    z: lm.z
                }));

                const confidence = results.multiHandedness && results.multiHandedness.length > 0
                    ? results.multiHandedness[0].score
                    : 0.9;

                sendMessage({
                    type: 'landmarks',
                    landmarks: landmarks,
                    confidence: confidence
                });
            } else {
                sendMessage({ type: 'no_hand' });
            }
        }

        // Process a base64 image
        async function processImage(base64Data) {
            try {
                if (!handsDetector) {
                    sendMessage({ type: 'error', message: 'Detector not initialized' });
                    return;
                }

                const img = new Image();
                img.onload = async function() {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);

                    await handsDetector.send({ image: canvas });
                };
                img.onerror = function() {
                    sendMessage({ type: 'error', message: 'Failed to load image' });
                };

                // Handle both with and without data URI prefix
                if (base64Data.startsWith('data:')) {
                    img.src = base64Data;
                } else {
                    img.src = 'data:image/jpeg;base64,' + base64Data;
                }
            } catch (err) {
                sendMessage({ type: 'error', message: 'Process error: ' + err.message });
            }
        }

        // Start initialization
        initHands();
    </script>
</body>
</html>
    `.trim();
}

const styles = StyleSheet.create({
    hidden: {
        width: 0,
        height: 0,
        position: 'absolute',
        overflow: 'hidden',
        opacity: 0,
    },
    webview: {
        width: 1,
        height: 1,
    },
});
