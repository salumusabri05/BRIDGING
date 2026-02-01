# Real-time MediaPipe Integration Guide

## Overview

This document explains how to integrate actual MediaPipe hand detection for real-time video processing in the Bridging Silence app.

## Current Status

✅ **Implemented:**
- Real-time video processing pipeline
- Frame throttling (every 3rd frame)
- Continuous API communication
- Live prediction updates
- Mock hand landmark generation

⚠️ **Placeholder (Mock Data):**
- Hand detection uses `generateMockLandmarks()` in `camera.tsx`
- Need to replace with actual MediaPipe processing

## Integration Options

### Option 1: TensorFlow Lite (Recommended for Production)

**Pros:**
- Native performance
- Works offline
- Low latency
- Runs on device GPU

**Cons:**
- Requires custom native modules
- More complex setup

**Implementation:**
```bash
# Install TensorFlow Lite
npm install @tensorflow/tfjs @tensorflow/tfjs-react-native

# Install MediaPipe hand model
# Download from: https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task
```

```typescript
// services/tflite-hand-detection.service.ts
import * as tf from '@tensorflow/tfjs';
import { fetch, bundleResourceIO } from '@tensorflow/tfjs-react-native';

class TFLiteHandDetection {
  private model: tf.GraphModel | null = null;

  async initialize() {
    await tf.ready();
    
    // Load MediaPipe hand landmark model
    this.model = await tf.loadGraphModel(
      bundleResourceIO(
        require('../assets/models/hand_landmarker.json'),
        require('../assets/models/hand_landmarker.bin')
      )
    );
  }

  async detectHands(imageData: ImageData): Promise<Landmark[]> {
    if (!this.model) {
      throw new Error('Model not initialized');
    }

    // Convert image to tensor
    const imageTensor = tf.browser.fromPixels(imageData);
    
    // Preprocess
    const resized = tf.image.resizeBilinear(imageTensor, [192, 192]);
    const normalized = resized.div(255.0);
    const batched = normalized.expandDims(0);

    // Run inference
    const predictions = await this.model.predict(batched) as tf.Tensor;
    const landmarkData = await predictions.data();

    // Convert to Landmark format
    const landmarks: Landmark[] = [];
    for (let i = 0; i < 21; i++) {
      landmarks.push({
        x: landmarkData[i * 3],
        y: landmarkData[i * 3 + 1],
        z: landmarkData[i * 3 + 2],
      });
    }

    return landmarks;
  }
}

export const tfliteHandDetection = new TFLiteHandDetection();
```

### Option 2: React Native WebView with MediaPipe Web

**Pros:**
- Uses official MediaPipe library
- Easier setup
- Good accuracy

**Cons:**
- Requires WebView overhead
- Slightly higher latency

**Implementation:**
```bash
npm install react-native-webview
```

```typescript
// components/MediaPipeWebView.tsx
import React, { useRef } from 'react';
import { WebView } from 'react-native-webview';

export function MediaPipeWebView({ onLandmarks }: { onLandmarks: (landmarks: Landmark[]) => void }) {
  const webViewRef = useRef<WebView>(null);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js"></script>
      </head>
      <body>
        <video id="video" style="display:none"></video>
        <script>
          const hands = new Hands({
            locateFile: (file) => \`https://cdn.jsdelivr.net/npm/@mediapipe/hands/\${file}\`
          });

          hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.7,
            minTrackingConfidence: 0.5
          });

          hands.onResults((results) => {
            if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
              const landmarks = results.multiHandLandmarks[0];
              window.ReactNativeWebView.postMessage(JSON.stringify(landmarks));
            }
          });

          const video = document.getElementById('video');
          const camera = new Camera(video, {
            onFrame: async () => {
              await hands.send({image: video});
            }
          });
          camera.start();
        </script>
      </body>
    </html>
  `;

  const handleMessage = (event: any) => {
    try {
      const landmarks = JSON.parse(event.nativeEvent.data);
      onLandmarks(landmarks);
    } catch (error) {
      console.error('Error parsing landmarks:', error);
    }
  };

  return (
    <WebView
      ref={webViewRef}
      source={{ html: htmlContent }}
      onMessage={handleMessage}
      style={{ width: 1, height: 1 }} // Hidden
      javaScriptEnabled
      domStorageEnabled
      mediaPlaybackRequiresUserAction={false}
    />
  );
}
```

### Option 3: Cloud Processing (Current Approach Extended)

**Pros:**
- No client-side ML complexity
- Easy to update model
- Works immediately

**Cons:**
- Requires internet
- Higher latency
- API costs

**Implementation (Already Partially Done):**
```typescript
// Update camera.tsx processVideoFrame
const processVideoFrame = async () => {
  const photo = await cameraRef.current.takePictureAsync({
    quality: 0.5,
    base64: true, // Enable base64
  });

  // Send image to backend for both detection AND prediction
  const response = await apiService.detectAndPredict(photo.base64);
  
  setDetectedLandmarks(response.landmarks);
  setCurrentLetter(response.letter);
  setConfidence(response.confidence);
};
```

```typescript
// services/api.service.ts - Add new method
async detectAndPredict(imageBase64: string): Promise<{
  landmarks: Landmark[];
  letter: string;
  confidence: number;
}> {
  const response = await this.client.post('/detect-and-predict', {
    image: imageBase64,
  });
  return response.data;
}
```

## Recommended Implementation Path

### Phase 1: Cloud Processing (Current)
1. ✅ Use mock landmarks
2. ✅ Test real-time flow
3. ✅ Verify API integration
4. Send actual images to backend
5. Backend runs MediaPipe + prediction

### Phase 2: Client-side Detection
1. Integrate TensorFlow Lite
2. Run MediaPipe model on device
3. Send only landmarks to backend
4. Reduce API latency

### Phase 3: Full Offline Mode
1. Download TSL classifier model
2. Run both detection + prediction on device
3. No internet required
4. Optional cloud sync for analytics

## Performance Optimization

### Current Settings
```typescript
// services/video-processing.service.ts
export const DEFAULT_VIDEO_CONFIG = {
  frameSkip: 3,           // Process every 3rd frame
  minFrameInterval: 100,  // Max 10 FPS
  enableThrottling: true,
};
```

### Tuning Guide
- **Lower latency**: Decrease `minFrameInterval` to 50ms (20 FPS)
- **Better battery**: Increase `frameSkip` to 5 (6 FPS)
- **High accuracy**: Process every frame (`frameSkip: 1`)
- **Smooth UI**: Keep at current settings (10 FPS)

## Testing MediaPipe Integration

### Step 1: Test with Static Image
```typescript
import { mediaPipeService } from '../services/mediapipe.service';

// In camera.tsx
const testDetection = async () => {
  await mediaPipeService.initialize();
  
  const photo = await cameraRef.current.takePictureAsync();
  // Convert to HTMLImageElement or canvas
  const image = new Image();
  image.src = photo.uri;
  
  const result = await mediaPipeService.detectFromImage(image);
  console.log('Detected landmarks:', result.landmarks);
};
```

### Step 2: Test with Video
```typescript
// Use detectForVideo instead
const videoElement = document.querySelector('video');
const timestamp = performance.now();
const result = await mediaPipeService.detectForVideo(videoElement, timestamp);
```

### Step 3: Integrate into Real-time Flow
```typescript
// Replace generateMockLandmarks() in processVideoFrame
const mockLandmarks = generateMockLandmarks();
// With:
const detectionResult = await mediaPipeService.detectFromImage(photoElement);
const landmarks = detectionResult.landmarks || [];
```

## Debugging Tips

### Check Frame Processing Rate
```
Console output should show:
- FPS: 8-12 (with current settings)
- Processing time: <100ms per frame
- API response time: <500ms
```

### Monitor Performance
```typescript
// Add to processVideoFrame
const startTime = Date.now();
await processVideoFrame();
const elapsed = Date.now() - startTime;
console.log(`Frame processed in ${elapsed}ms`);
```

### Common Issues

**Issue: High battery drain**
- Solution: Increase `frameSkip` or `minFrameInterval`

**Issue: Laggy predictions**
- Solution: Check API response times, add request debouncing

**Issue: Hand not detected**
- Solution: Improve lighting, ensure hand is in frame, adjust confidence thresholds

## Next Steps

1. **Test Current Implementation**
   - Run app with real-time detection
   - Verify frame processing works
   - Check API communication

2. **Choose Integration Option**
   - Start with Option 3 (cloud) for quick testing
   - Move to Option 1 (TFLite) for production

3. **Backend API Update**
   - Add `/detect-and-predict` endpoint
   - Accept base64 images
   - Return landmarks + prediction

4. **Performance Tuning**
   - Monitor FPS and latency
   - Adjust throttling parameters
   - Optimize model size

## Resources

- [MediaPipe Hands Documentation](https://google.github.io/mediapipe/solutions/hands.html)
- [TensorFlow.js React Native](https://www.tensorflow.org/js/tutorials/setup#react_native)
- [Expo Camera API](https://docs.expo.dev/versions/latest/sdk/camera/)
- [Performance Optimization Guide](https://reactnative.dev/docs/performance)
