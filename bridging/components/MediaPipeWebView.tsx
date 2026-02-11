/**
 * MediaPipe WebView Component
 * Runs MediaPipe Hands in a hidden WebView and sends landmarks to React Native
 */

import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { Landmark } from '../types/tsl.types';

interface MediaPipeWebViewProps {
    onLandmarksDetected: (landmarks: Landmark[]) => void;
    onError: (error: string) => void;
    enabled: boolean;
}

export function MediaPipeWebView({
    onLandmarksDetected,
    onError,
    enabled
}: MediaPipeWebViewProps) {
    const webViewRef = useRef<WebView>(null);

    useEffect(() => {
        if (enabled) {
            // Start detection
            webViewRef.current?.injectJavaScript('startDetection();');
        } else {
            // Stop detection
            webViewRef.current?.injectJavaScript('stopDetection();');
        }
    }, [enabled]);

    const handleMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);

            if (data.type === 'landmarks') {
                // Convert MediaPipe format to our Landmark format
                const landmarks: Landmark[] = data.landmarks.map((lm: any) => ({
                    x: lm.x,
                    y: lm.y,
                    z: lm.z || 0,
                }));
                onLandmarksDetected(landmarks);
            } else if (data.type === 'error') {
                onError(data.message);
            } else if (data.type === 'no-hand') {
                // No hand detected
                onLandmarksDetected([]);
            }
        } catch (error) {
            console.error('Error parsing MediaPipe message:', error);
            onError('Failed to parse detection results');
        }
    };

    // HTML content with MediaPipe integration
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      overflow: hidden;
    }
    #video {
      position: absolute;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js" crossorigin="anonymous"></script>
</head>
<body>
  <video id="video" autoplay playsinline></video>
  
  <script>
    let camera;
    let hands;
    let isDetecting = false;

    // Initialize MediaPipe Hands
    function initializeMediaPipe() {
      hands = new Hands({
        locateFile: (file) => {
          return \`https://cdn.jsdelivr.net/npm/@mediapipe/hands/\${file}\`;
        }
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5
      });

      hands.onResults(onResults);
    }

    // Handle detection results
    function onResults(results) {
      if (!isDetecting) return;

      try {
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          // Hand detected - send landmarks
          const landmarks = results.multiHandLandmarks[0];
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'landmarks',
            landmarks: landmarks
          }));
        } else {
          // No hand detected
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'no-hand'
          }));
        }
      } catch (error) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'error',
          message: error.message || 'Detection error'
        }));
      }
    }

    // Start camera and detection
    function startDetection() {
      if (isDetecting) return;
      isDetecting = true;

      const video = document.getElementById('video');
      
      camera = new Camera(video, {
        onFrame: async () => {
          if (isDetecting && hands) {
            await hands.send({ image: video });
          }
        },
        width: 640,
        height: 480
      });

      camera.start().catch(error => {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'error',
          message: 'Camera access failed: ' + error.message
        }));
      });
    }

    // Stop detection
    function stopDetection() {
      isDetecting = false;
      if (camera) {
        camera.stop();
      }
    }

    // Initialize on load
    try {
      initializeMediaPipe();
      
      // Auto-start when ready
      setTimeout(() => {
        startDetection();
      }, 500);
    } catch (error) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'error',
        message: 'Initialization failed: ' + error.message
      }));
    }
  </script>
</body>
</html>
  `;

    return (
        <View style={styles.container}>
            <WebView
                ref={webViewRef}
                source={{ html: htmlContent }}
                onMessage={handleMessage}
                style={styles.webview}
                javaScriptEnabled
                domStorageEnabled
                mediaPlaybackRequiresUserAction={false}
                allowsInlineMediaPlayback
                onError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    onError(`WebView error: ${nativeEvent.description}`);
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        width: 1,
        height: 1,
        opacity: 0,
        overflow: 'hidden',
    },
    webview: {
        width: 1,
        height: 1,
        backgroundColor: 'transparent',
    },
});
