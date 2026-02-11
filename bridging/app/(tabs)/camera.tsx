/**
 * TSL Camera - Hand Sign Recognition
 * Capture hand gestures and translate Tanzanian Sign Language
 * 
 * Flow: Camera → Photo → MediaPipe (WebView) → Landmarks → API → Prediction → Speech
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Animated,
    Dimensions,
    Alert,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import HandLandmarkDetector, { HandDetectorRef } from '../../components/HandLandmarkDetector';
import { apiService } from '../../services/api.service';
import { speechService } from '../../services/speech.service';

const { width } = Dimensions.get('window');

export default function TSLCameraScreen() {
    const [permission, requestPermission] = useCameraPermissions();
    const [facing, setFacing] = useState<CameraType>('front');
    const [isCapturing, setIsCapturing] = useState(false);
    const [lastPrediction, setLastPrediction] = useState<string>('');
    const [confidence, setConfidence] = useState<number>(0);
    const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
    const [isDetectorReady, setIsDetectorReady] = useState(false);
    const [statusText, setStatusText] = useState('Loading hand detector...');

    const cameraRef = useRef<CameraView>(null);
    const detectorRef = useRef<HandDetectorRef>(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (permission?.granted) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }).start();
        }
    }, [permission, fadeAnim]);

    /**
     * Called when MediaPipe model is loaded in WebView
     */
    const onDetectorReady = () => {
        setIsDetectorReady(true);
        setStatusText('Show your hand sign here');
        console.log('✅ Hand detector ready');
    };

    /**
     * Called if detector fails to load
     */
    const onDetectorError = (error: string) => {
        console.error('❌ Detector error:', error);
        setStatusText('Detector error - use Test API instead');
    };

    /**
     * Capture photo and detect hand landmarks
     */
    const handleCapture = async () => {
        if (!cameraRef.current || isCapturing) return;

        if (!isDetectorReady) {
            Alert.alert('Please Wait', 'Hand detection model is still loading. This may take a few seconds on first use.');
            return;
        }

        setIsCapturing(true);
        setStatusText('Capturing...');

        try {
            // Step 1: Take photo
            console.log('📸 Taking photo...');
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.8,
                base64: true,
            });

            if (!photo) {
                Alert.alert('Error', 'Could not take photo. Please try again.');
                return;
            }

            setStatusText('Detecting hand...');

            // Step 2: Get base64 data
            const base64Data = photo.base64;

            if (!base64Data) {
                Alert.alert('Error', 'Could not process photo. Please try again.');
                return;
            }

            // Step 3: Send to WebView for hand detection
            console.log('🤖 Detecting hand landmarks...');
            const detection = await detectorRef.current?.detectFromBase64(base64Data);

            if (!detection) {
                setStatusText('Show your hand sign here');
                Alert.alert(
                    'No Hand Detected',
                    'Please show your hand clearly within the blue guide box and try again.',
                    [{ text: 'OK' }]
                );
                return;
            }

            console.log(`✅ Detected ${detection.landmarks.length} landmarks`);
            setStatusText('Sending to AI...');

            // Step 4: Send landmarks to API
            console.log('🚀 Sending landmarks to API...');
            const response = await apiService.predictSign(detection.landmarks);

            if (response.error) {
                setStatusText('Show your hand sign here');
                Alert.alert('Prediction Error', response.error);
                return;
            }

            // Step 5: Display result
            const letter = response.letter || 'Unknown';
            const conf = response.confidence || detection.confidence;

            setLastPrediction(letter);
            setConfidence(conf);
            setStatusText(`Detected: ${letter}`);

            console.log(`🎯 Prediction: ${letter} (${(conf * 100).toFixed(1)}%)`);

            // Step 6: Speak result
            if (isSpeechEnabled && letter && letter !== 'Unknown') {
                await speechService.speak(letter);
            }

        } catch (error) {
            console.error('❌ Capture error:', error);
            Alert.alert('Error', 'Something went wrong. Please try again.');
            setStatusText('Show your hand sign here');
        } finally {
            setIsCapturing(false);
        }
    };

    /**
     * Test API connection with sample landmarks from API docs
     */
    const testAPIConnection = async () => {
        try {
            // Sample landmarks from detectionapi.md
            const sampleLandmarks = [
                { x: 0.338775, y: 0.707677, z: 0.000000 },
                { x: 0.359596, y: 0.690019, z: -0.064400 },
                { x: 0.402614, y: 0.697840, z: -0.079851 },
                { x: 0.442001, y: 0.742977, z: -0.082639 },
                { x: 0.478297, y: 0.772598, z: -0.079987 },
                { x: 0.481200, y: 0.624843, z: -0.038444 },
                { x: 0.540103, y: 0.598855, z: -0.051450 },
                { x: 0.579200, y: 0.580494, z: -0.059732 },
                { x: 0.611820, y: 0.569921, z: -0.064929 },
                { x: 0.484388, y: 0.664041, z: -0.011230 },
                { x: 0.522004, y: 0.718519, z: -0.034067 },
                { x: 0.490152, y: 0.736844, z: -0.042311 },
                { x: 0.466428, y: 0.731174, z: -0.039971 },
                { x: 0.479003, y: 0.698777, z: 0.009253 },
                { x: 0.507311, y: 0.745670, z: -0.019042 },
                { x: 0.473320, y: 0.753283, z: -0.027947 },
                { x: 0.456450, y: 0.737558, z: -0.024299 },
                { x: 0.467371, y: 0.723029, z: 0.025279 },
                { x: 0.494282, y: 0.756875, z: 0.004044 },
                { x: 0.473828, y: 0.764333, z: -0.002101 },
                { x: 0.456327, y: 0.749471, z: 0.000011 },
            ];

            console.log('🧪 Testing API with sample landmarks...');
            const response = await apiService.predictSign(sampleLandmarks);

            if (response.error) {
                Alert.alert('API Error', response.error);
                return;
            }

            setLastPrediction(response.letter || 'Unknown');
            setConfidence(response.confidence || 0);

            if (isSpeechEnabled && response.letter) {
                await speechService.speak(response.letter);
            }

            Alert.alert(
                'API Connected! ✅',
                `Sign: ${response.letter}\nConfidence: ${((response.confidence || 0) * 100).toFixed(1)}%`,
                [{ text: 'Great!' }]
            );
        } catch (error) {
            console.error('API test error:', error);
            Alert.alert('Connection Error', 'Could not reach the prediction server. Check your internet.');
        }
    };

    const toggleCamera = () => {
        setFacing((current) => (current === 'back' ? 'front' : 'back'));
    };

    const toggleSpeech = () => {
        setIsSpeechEnabled((current) => !current);
    };

    // Loading state
    if (!permission) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0EA5E9" />
            </View>
        );
    }

    // Permission request screen
    if (!permission.granted) {
        return (
            <LinearGradient
                colors={['#0C4A6E', '#0891B2', '#0EA5E9']}
                style={styles.permissionContainer}
            >
                <Animated.View style={[styles.permissionContent, { opacity: fadeAnim }]}>
                    <View style={styles.iconWrapper}>
                        <LinearGradient
                            colors={['#0EA5E9', '#06B6D4']}
                            style={styles.iconGradient}
                        >
                            <Ionicons name="camera" size={48} color="#fff" />
                        </LinearGradient>
                    </View>

                    <Text style={styles.permissionTitle}>Camera Access Needed</Text>
                    <Text style={styles.permissionText}>
                        We need camera access to see your hand signs and translate them
                    </Text>

                    <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                        <LinearGradient
                            colors={['#0EA5E9', '#06B6D4']}
                            style={styles.permissionButtonGradient}
                        >
                            <Text style={styles.permissionButtonText}>Allow Camera</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>
            </LinearGradient>
        );
    }

    // Main camera screen
    return (
        <View style={styles.container}>
            {/* Hidden WebView that runs MediaPipe hand detection */}
            <HandLandmarkDetector
                ref={detectorRef}
                onReady={onDetectorReady}
                onError={onDetectorError}
            />

            <Animated.View style={[styles.cameraWrapper, { opacity: fadeAnim }]}>
                <CameraView
                    ref={cameraRef}
                    style={styles.camera}
                    facing={facing}
                >
                    <View style={styles.overlay}>
                        {/* Top Controls */}
                        <View style={styles.topBar}>
                            <TouchableOpacity
                                style={styles.topButton}
                                onPress={toggleCamera}
                            >
                                <LinearGradient
                                    colors={['rgba(14, 165, 233, 0.9)', 'rgba(6, 182, 212, 0.9)']}
                                    style={styles.topButtonGradient}
                                >
                                    <Ionicons name="camera-reverse" size={26} color="#fff" />
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Status indicator */}
                            <View style={styles.statusBadge}>
                                {!isDetectorReady && (
                                    <ActivityIndicator size="small" color="#0EA5E9" style={{ marginRight: 6 }} />
                                )}
                                <View style={[styles.statusDot, isDetectorReady ? styles.statusReady : styles.statusLoading]} />
                                <Text style={styles.statusLabel}>
                                    {isDetectorReady ? 'Ready' : 'Loading'}
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={styles.topButton}
                                onPress={toggleSpeech}
                            >
                                <LinearGradient
                                    colors={isSpeechEnabled
                                        ? ['rgba(14, 165, 233, 0.9)', 'rgba(6, 182, 212, 0.9)']
                                        : ['rgba(156, 163, 175, 0.9)', 'rgba(107, 114, 128, 0.9)']
                                    }
                                    style={styles.topButtonGradient}
                                >
                                    <Ionicons
                                        name={isSpeechEnabled ? 'volume-high' : 'volume-mute'}
                                        size={26}
                                        color="#fff"
                                    />
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                        {/* Hand Guide Window */}
                        <View style={styles.centerGuide}>
                            <View style={styles.guideBorder} />
                            <Text style={styles.guideText}>{statusText}</Text>
                        </View>

                        {/* Result Display */}
                        {lastPrediction !== '' && (
                            <View style={styles.resultContainer}>
                                <LinearGradient
                                    colors={['rgba(14, 165, 233, 0.95)', 'rgba(6, 182, 212, 0.95)']}
                                    style={styles.resultGradient}
                                >
                                    <Text style={styles.resultLetter}>{lastPrediction}</Text>
                                    <Text style={styles.resultConfidence}>
                                        {(confidence * 100).toFixed(0)}% confident
                                    </Text>
                                </LinearGradient>
                            </View>
                        )}

                        {/* Bottom Controls */}
                        <View style={styles.bottomBar}>
                            {/* Test API - left */}
                            <TouchableOpacity
                                style={styles.sideButton}
                                onPress={testAPIConnection}
                            >
                                <LinearGradient
                                    colors={['rgba(14, 165, 233, 0.9)', 'rgba(6, 182, 212, 0.9)']}
                                    style={styles.sideButtonGradient}
                                >
                                    <Ionicons name="cloud-done" size={22} color="#fff" />
                                    <Text style={styles.sideButtonText}>Test</Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Capture Button - center */}
                            <TouchableOpacity
                                style={styles.captureButton}
                                onPress={handleCapture}
                                disabled={isCapturing}
                            >
                                <LinearGradient
                                    colors={isCapturing
                                        ? ['#6B7280', '#9CA3AF']
                                        : ['#0EA5E9', '#06B6D4']
                                    }
                                    style={styles.captureGradient}
                                >
                                    {isCapturing ? (
                                        <ActivityIndicator size="large" color="#fff" />
                                    ) : (
                                        <View style={styles.captureContent}>
                                            <Ionicons name="hand-left" size={32} color="#fff" />
                                            <Text style={styles.captureText}>Capture</Text>
                                        </View>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Spacer for symmetry */}
                            <View style={styles.sideButton}>
                                <View style={styles.sideButtonPlaceholder} />
                            </View>
                        </View>
                    </View>
                </CameraView>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    permissionContent: {
        alignItems: 'center',
        maxWidth: 400,
    },
    iconWrapper: {
        marginBottom: 32,
    },
    iconGradient: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    permissionTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 12,
        textAlign: 'center',
    },
    permissionText: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    permissionButton: {
        width: '100%',
    },
    permissionButtonGradient: {
        paddingVertical: 18,
        paddingHorizontal: 48,
        borderRadius: 16,
        alignItems: 'center',
    },
    permissionButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    cameraWrapper: {
        flex: 1,
    },
    camera: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 20,
    },
    topButton: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    topButtonGradient: {
        width: 52,
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusReady: {
        backgroundColor: '#22C55E',
    },
    statusLoading: {
        backgroundColor: '#F59E0B',
    },
    statusLabel: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    centerGuide: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 30,
    },
    guideBorder: {
        width: width * 0.85,
        height: width * 0.85,
        borderWidth: 3,
        borderColor: 'rgba(14, 165, 233, 0.6)',
        borderRadius: 24,
        borderStyle: 'dashed',
    },
    guideText: {
        marginTop: 16,
        fontSize: 17,
        color: '#fff',
        fontWeight: '600',
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
        textAlign: 'center',
    },
    resultContainer: {
        position: 'absolute',
        top: 130,
        left: 20,
        right: 20,
    },
    resultGradient: {
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    resultLetter: {
        fontSize: 52,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    resultConfidence: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.95)',
        fontWeight: '500',
    },
    bottomBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 100,
        paddingHorizontal: 24,
    },
    sideButton: {
        width: 70,
        alignItems: 'center',
    },
    sideButtonGradient: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 16,
        gap: 2,
    },
    sideButtonText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
    },
    sideButtonPlaceholder: {
        width: 60,
        height: 60,
    },
    captureButton: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 12,
    },
    captureGradient: {
        width: 88,
        height: 88,
        borderRadius: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#fff',
    },
    captureContent: {
        alignItems: 'center',
        gap: 2,
    },
    captureText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
    },
});
