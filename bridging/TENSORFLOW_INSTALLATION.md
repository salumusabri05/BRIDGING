# TensorFlow Lite Installation Guide

## Step 1: Install Required Dependencies

Run these commands in your terminal:

```bash
# Navigate to the project
cd bridging

# Install TensorFlow.js core
npm install @tensorflow/tfjs @tensorflow/tfjs-react-native

# Install hand pose detection model
npm install @tensorflow-models/hand-pose-detection

# Install platform-specific dependencies
npm install @react-native-async-storage/async-storage
npm install react-native-fs
npm install expo-file-system

# Install Expo GL for tensor camera
npm install expo-gl expo-gl-cpp

# Install peer dependencies
npm install @tensorflow/tfjs-backend-webgl
```

## Step 2: Update app.json

Add this to your `app.json` under the `expo` section:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-build-properties",
        {
          "android": {
            "extraMavenRepos": [
              "../node_modules/@tensorflow/tfjs-react-native/android/maven"
            ]
          }
        }
      ]
    ]
  }
}
```

## Step 3: Clear cache and reinstall

```bash
# Clear Expo cache
npx expo start -c

# Or if that doesn't work:
rm -rf node_modules
npm install
```

## Step 4: Test the installation

Create a test file to verify TensorFlow is working:

```typescript
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';

async function testTensorFlow() {
    await tf.ready();
    console.log('TensorFlow version:', tf.version.tfjs);
    console.log('Backend:', tf.getBackend());
    
    const tensor = tf.tensor([1, 2, 3, 4]);
    console.log('Test tensor:', tensor);
    tensor.dispose();
    
    console.log('✅ TensorFlow is working!');
}

testTensorFlow();
```

## Troubleshooting

### iOS Issues
If you encounter iOS build issues:
```bash
cd ios
pod install
cd ..
```

### Android Issues
If you get Android build errors, ensure you have:
- Android SDK 28+
- Gradle 7.0+
- NDK installed

### WebGL Backend Issues
If the WebGL backend fails:
```bash
npm install @tensorflow/tfjs-backend-cpu
```

Then in your code:
```typescript
import '@tensorflow/tfjs-backend-cpu';
await tf.setBackend('cpu');
```

## Next Steps

Once installed successfully:
1. Run `npm start`
2. Open the app
3. Navigate to the Camera tab
4. The hand detection should initialize automatically
5. Check console for "✅ Hand detection initialized successfully"

## Performance Tips

### For better performance:
- Use 'lite' model type instead of 'full'
- Reduce camera resolution (320x240 or 480x640)
- Increase frame skip (process every 3rd or 4th frame)
- Use CPU backend on lower-end devices

### Example optimization:
```typescript
this.detector = await handPoseDetection.createDetector(
    handPoseDetection.SupportedModels.MediaPipeHands,
    {
        runtime: 'tfjs',
        modelType: 'lite', // Changed from 'full'
        maxHands: 1,
    }
);
```
