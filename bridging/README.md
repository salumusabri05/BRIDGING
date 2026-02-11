# Bridging Silence 🤟

**Tanzanian Sign Language Recognition App** - Converting sign language to text and speech using AI-powered hand landmark detection.

## ⚠️ PROJECT STATUS - IN ACTIVE DEVELOPMENT

**Current Phase:** Hand Detection Implementation

### ✅ What Currently Works:
- Beautiful camera UI with smooth animations
- Backend API integration and communication
- Text-to-speech functionality
- User interface and navigation
- Camera permissions and controls

### 🚧 Under Active Development:
- **Real-time hand detection** (implementing TensorFlow Lite)
- **Live sign recognition** (pending hand detection completion)
- **Hand landmark visualization** (pending hand detection)

### 📅 Development Timeline:
- **Phase 1** (Current): TensorFlow Lite integration - In Progress
- **Phase 2** (Next 2 weeks): End-to-end testing and optimization
- **Phase 3** (1 month): Beta testing with users
- **Phase 4** (6 weeks): Production release

**Note:** The app's core feature (hand detection) is being reimplemented with TensorFlow Lite for better performance and accuracy. The previous MediaPipe WebView approach had architectural limitations.

---

# Original Vision & Target Architecture

## 🎯 Overview

Bridging Silence is a React Native mobile application built with Expo that will enable real-time recognition of Tanzanian Sign Language (TSL). The app will capture hand gestures through the device camera, process them using TensorFlow Lite for landmark detection, and send the data to a machine learning model for sign prediction.

## ✨ Planned Features

- 🎥 **Real-time Video Detection** - Continuous hand tracking and recognition
- 📸 **Live Camera Feed** - Front/back camera with real-time preview
- 🤖 **AI-Powered Recognition** - MediaPipe Hands detects 21 hand landmarks per frame
- ⚡ **Frame Throttling** - Optimized processing (10 FPS) for performance and battery
- 🔊 **Text-to-Speech** - Converts recognized signs to spoken words
- 📊 **Live Confidence Meter** - Visual feedback on recognition accuracy
- 📝 **History Tracking** - Builds words from sequential letter signs
- 🎨 **Hand Visualization** - Real-time overlay showing detected hand skeleton
- 🔴 **Live Indicator** - Shows detection status and FPS counter
- 🌙 **Dark/Light Mode** - Automatic theme switching

## 🏗️ Architecture

```
┌─────────────────┐
│   Camera View   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   MediaPipe     │ ← Detects 21 landmarks
│   Hands API     │   (x, y, z) × 21
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Normalization  │ ← Min-max scaling
│   (63 features) │   to [0, 1] range
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Backend API   │ ← ML model prediction
│ (TSL Classifier)│   returns letter + confidence
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Text-to-Speech  │ ← Spoken output
└─────────────────┘
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator or Android Emulator (or physical device with Expo Go)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd bridging
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npx expo start
   ```

4. **Run on your device**
   - Scan the QR code with Expo Go (Android/iOS)
   - Or press `a` for Android emulator
   - Or press `i` for iOS simulator

## 📱 Usage

1. **Grant Camera Permission** - Allow camera access when prompted
2. **Position Your Hand** - Place your hand in front of the camera
3. **Capture Gesture** - Tap the blue capture button
4. **View Results** - See the predicted letter and confidence score
5. **Hear It Spoken** - The app automatically speaks the recognized letter
6. **Build Words** - Capture multiple letters to form words
7. **Speak Word** - Tap "Speak" to hear the complete word

## 🛠️ Technical Stack

### Frontend
- **React Native** - Cross-platform mobile framework
- **Expo** - Development platform and SDK
- **TypeScript** - Type-safe JavaScript
- **Expo Camera** - Camera access and frame capture
- **Expo Speech** - Text-to-speech synthesis
- **react-native-svg** - Hand skeleton visualization

### Computer Vision
- **MediaPipe Hands** - Hand landmark detection
- **@mediapipe/tasks-vision** - Web-compatible MediaPipe library

### Backend Integration
- **Axios** - HTTP client for API requests
- **Backend URL**: `https://production-model.onrender.com`
- **Model**: MLP Classifier for TSL recognition

## 📂 Project Structure

```
bridging/
├── app/
│   ├── (tabs)/
│   │   ├── camera.tsx       # Main camera screen
│   │   ├── index.tsx        # Home screen
│   │   ├── explore.tsx      # About screen
│   │   └── _layout.tsx      # Tab navigation
│   ├── _layout.tsx          # Root layout
│   └── modal.tsx
├── components/
│   ├── PredictionDisplay.tsx    # Results UI
│   ├── HandVisualization.tsx    # Hand skeleton overlay
│   └── ...
├── services/
│   ├── api.service.ts           # Backend API integration
│   ├── mediapipe.service.ts     # Hand detection service
│   └── speech.service.ts        # Text-to-speech
├── utils/
│   └── landmark-processor.ts    # Data normalization
├── types/
│   └── tsl.types.ts            # TypeScript definitions
├── constants/
│   ├── api.ts                  # API configuration
│   └── mediapipe.ts            # MediaPipe settings
├── docs/
│   ├── instructions.md         # TSL data format spec
│   ├── data.md                 # Backend API info
│   └── app.md                  # App overview
└── package.json
```

## 🔧 Configuration

### API Endpoint
Update the backend URL in `constants/api.ts`:
```typescript
export const API_CONFIG = {
  BASE_URL: 'https://production-model.onrender.com',
  ENDPOINTS: {
    PREDICT: '/predict',
  },
};
```

### MediaPipe Settings
Adjust detection thresholds in `constants/mediapipe.ts`:
```typescript
export const MEDIAPIPE_CONFIG = {
  MIN_DETECTION_CONFIDENCE: 0.7,
  MIN_TRACKING_CONFIDENCE: 0.5,
  MAX_NUM_HANDS: 1,
};
```

## 📊 Data Format

### Input (to Backend)
```json
{
  "landmarks": [
    [0.338775, 0.707677, 0.000000],  // Wrist
    [0.359596, 0.690019, -0.064400], // Thumb CMC
    // ... 19 more landmarks
  ]
}
```

### Output (from Backend)
```json
{
  "letter": "A",
  "confidence": 0.95
}
```

For detailed data specifications, see [docs/instructions.md](docs/instructions.md).

## 🧪 Testing

### Run on Android
```bash
npm run android
```

### Run on iOS
```bash
npm run ios
```

### Run on Web
```bash
npm run web
```

## 🐛 Troubleshooting

### Camera Not Working
- Ensure camera permissions are granted
- Restart the Expo development server
- Check if camera is working in another app

### Detection Issues
- Improve lighting conditions
- Keep hand fully visible in frame
- Use plain background
- Ensure hand is not too close or far from camera

### API Connection Errors
- Check internet connection
- Verify backend URL is correct
- Check backend server status

## 🚧 Known Current Limitations

- **Hand Detection**: Not yet fully implemented - transitioning from MediaPipe WebView to TensorFlow Lite native
- **Real-time Recognition**: Pending hand detection implementation
- **Static Signs Only**: Will initially support static gestures, dynamic/motion-based signs planned for v2.0
- **Single Hand**: Currently designed for one hand detection at a time

## 🔮 Future Enhancements (Post-Launch)

- [ ] Native MediaPipe integration for real-time detection
- [ ] Support for dynamic/motion-based signs
- [ ] Offline mode with local TensorFlow Lite model
- [ ] Two-hand sign recognition
- [ ] Custom sign training
- [ ] Sign language tutorials
- [ ] Social features (share signs, challenges)

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- MediaPipe team for hand landmark detection
- Expo team for the amazing development platform
- TSL community for inspiration and feedback

## 📞 Support

For issues, questions, or contributions, please open an issue on GitHub.

---

**Built with ❤️ for the deaf community in Tanzania**
