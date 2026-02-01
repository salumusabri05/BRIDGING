/**
 * Camera Screen - Premium TSL Recognition
 * Beautiful UI with automatic real-time detection
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Animated,
    Dimensions,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { PredictionDisplay } from '../../components/PredictionDisplay';
import { HandVisualization } from '../../components/HandVisualization';
import { apiService } from '../../services/api.service';
import { speechService } from '../../services/speech.service';
import { videoProcessingService, DEFAULT_VIDEO_CONFIG } from '../../services/video-processing.service';
import { Landmark, PredictionHistoryItem } from '../../types/tsl.types';

const { width, height } = Dimensions.get('window');

export default function CameraScreen() {
    const [permission, requestPermission] = useCameraPermissions();
    const [facing, setFacing] = useState<CameraType>('front');
    const [currentLetter, setCurrentLetter] = useState('');
    const [confidence, setConfidence] = useState(0);
    const [error, setError] = useState('');
    const [history, setHistory] = useState<PredictionHistoryItem[]>([]);
    const [detectedLandmarks, setDetectedLandmarks] = useState<Landmark[]>([]);
    const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
    const [fps, setFps] = useState(0);

    const cameraRef = useRef<any>(null);
    const processingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const lastPredictionRef = useRef<string>('');

    // Animations
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Auto-start detection when camera loads
    useEffect(() => {
        if (permission?.granted) {
            startRealTimeDetection();

            // Fade in animation
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }).start();
        }

        return () => {
            stopRealTimeDetection();
        };
    }, [permission]);

    // Pulse animation for active detection
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const startRealTimeDetection = useCallback(() => {
        videoProcessingService.reset();

        processingIntervalRef.current = setInterval(async () => {
            if (!videoProcessingService.shouldProcessFrame(DEFAULT_VIDEO_CONFIG)) {
                return;
            }

            await processVideoFrame();
        }, DEFAULT_VIDEO_CONFIG.minFrameInterval);
    }, []);

    const stopRealTimeDetection = useCallback(() => {
        if (processingIntervalRef.current) {
            clearInterval(processingIntervalRef.current);
            processingIntervalRef.current = null;
        }
        videoProcessingService.reset();
    }, []);

    const processVideoFrame = async () => {
        if (!cameraRef.current) return;

        videoProcessingService.startProcessing();

        try {
            // IMPORTANT: Not taking pictures to avoid camera overload
            // In production, this is where MediaPipe would process the video stream
            // For now, we simulate detection with mock data

            const mockLandmarks = generateMockLandmarks();
            setDetectedLandmarks(mockLandmarks);

            // Send mock landmarks to API for prediction
            const response = await apiService.predictSign(mockLandmarks);

            if (response.error) {
                setError(response.error);
                videoProcessingService.endProcessing();
                return;
            }

            if (response.letter) {
                // Only update if letter changed
                if (response.letter !== lastPredictionRef.current) {
                    setCurrentLetter(response.letter);
                    setConfidence(response.confidence || 0.85);
                    lastPredictionRef.current = response.letter;

                    const historyItem: PredictionHistoryItem = {
                        id: Date.now().toString(),
                        letter: response.letter,
                        confidence: response.confidence || 0.85,
                        timestamp: new Date(),
                    };

                    setHistory((prev) => [...prev, historyItem].slice(-20));

                    if (isSpeechEnabled) {
                        speechService.speak(response.letter);
                    }
                }
                setError('');
            }

            setFps(videoProcessingService.getCurrentFPS());
        } catch (err) {
            console.error('Frame processing error:', err);
            setError('Processing error. Retrying...');
        } finally {
            videoProcessingService.endProcessing();
        }
    };

    const handleClear = () => {
        setHistory([]);
        setCurrentLetter('');
        setConfidence(0);
        setError('');
        setDetectedLandmarks([]);
        lastPredictionRef.current = '';
        speechService.clearQueue();
    };

    const handleSpeakWord = () => {
        const word = history.map((item) => item.letter).join('');
        if (word) {
            speechService.speak(word);
        }
    };

    const toggleCamera = () => {
        setFacing((current) => (current === 'back' ? 'front' : 'back'));
    };

    if (!permission) {
        return (
            <View style={styles.loadingContainer}>
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                    <LinearGradient
                        colors={['#3b82f6', '#8b5cf6']}
                        style={styles.loadingGradient}
                    >
                        <ActivityIndicator size="large" color="#fff" />
                    </LinearGradient>
                </Animated.View>
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <LinearGradient
                colors={['#1e1b4b', '#312e81', '#3b82f6']}
                style={styles.permissionContainer}
            >
                <Animated.View style={[styles.permissionContent, { opacity: fadeAnim }]}>
                    <View style={styles.iconWrapper}>
                        <LinearGradient
                            colors={['#3b82f6', '#8b5cf6']}
                            style={styles.iconGradient}
                        >
                            <Ionicons name="camera" size={48} color="#fff" />
                        </LinearGradient>
                    </View>

                    <Text style={styles.permissionTitle}>Camera Access</Text>
                    <Text style={styles.permissionSubtitle}>Required for Sign Language Detection</Text>
                    <Text style={styles.permissionText}>
                        Bridging Silence uses your camera to detect hand gestures in real-time and translate them into text and speech.
                    </Text>

                    <TouchableOpacity onPress={requestPermission}>
                        <LinearGradient
                            colors={['#3b82f6', '#8b5cf6']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.permissionButton}
                        >
                            <Text style={styles.permissionButtonText}>Grant Access</Text>
                            <Ionicons name="arrow-forward" size={20} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>
            </LinearGradient>
        );
    }

    return (
        <View style={styles.container}>
            {/* Camera View */}
            <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
                {/* Gradient Overlay */}
                <LinearGradient
                    colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.6)']}
                    style={styles.gradientOverlay}
                    pointerEvents="none"
                />

                {/* Hand Visualization */}
                {detectedLandmarks.length > 0 && (
                    <HandVisualization
                        landmarks={detectedLandmarks}
                        width={width}
                        height={height * 0.6}
                    />
                )}

                {/* Top Bar */}
                <BlurView intensity={80} tint="dark" style={styles.topBar}>
                    <View style={styles.statusBadge}>
                        <Animated.View
                            style={[
                                styles.liveDot,
                                { transform: [{ scale: pulseAnim }] }
                            ]}
                        />
                        <Text style={styles.liveText}>LIVE</Text>
                        <Text style={styles.fpsText}>{fps} FPS</Text>
                    </View>

                    <View style={styles.topControls}>
                        <TouchableOpacity
                            style={styles.topButton}
                            onPress={() => setIsSpeechEnabled(!isSpeechEnabled)}
                        >
                            <Ionicons
                                name={isSpeechEnabled ? 'volume-high' : 'volume-mute'}
                                size={22}
                                color="#fff"
                            />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.topButton} onPress={toggleCamera}>
                            <Ionicons name="camera-reverse" size={22} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </BlurView>

                {/* Detection Frame */}
                <View style={styles.detectionFrame} pointerEvents="none">
                    <View style={[styles.frameCorner, styles.topLeft]} />
                    <View style={[styles.frameCorner, styles.topRight]} />
                    <View style={[styles.frameCorner, styles.bottomLeft]} />
                    <View style={[styles.frameCorner, styles.bottomRight]} />
                </View>
            </CameraView>

            {/* Bottom Panel */}
            <Animated.View style={[styles.bottomPanel, { opacity: fadeAnim }]}>
                <BlurView intensity={100} tint="dark" style={styles.blurContainer}>
                    {/* Prediction Display */}
                    <PredictionDisplay
                        currentLetter={currentLetter}
                        confidence={confidence}
                        history={history}
                        error={error}
                    />

                    {/* Action Bar */}
                    <View style={styles.actionBar}>
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.clearBtn]}
                            onPress={handleClear}
                            disabled={history.length === 0}
                        >
                            <LinearGradient
                                colors={history.length > 0 ? ['#ef4444', '#dc2626'] : ['#4b5563', '#374151']}
                                style={styles.btnGradient}
                            >
                                <Ionicons name="trash-outline" size={20} color="#fff" />
                                <Text style={styles.btnText}>Clear</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionBtn, styles.speakBtn]}
                            onPress={handleSpeakWord}
                            disabled={history.length === 0}
                        >
                            <LinearGradient
                                colors={history.length > 0 ? ['#10b981', '#059669'] : ['#4b5563', '#374151']}
                                style={styles.btnGradient}
                            >
                                <Ionicons name="megaphone" size={20} color="#fff" />
                                <Text style={styles.btnText}>Speak Word</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </BlurView>
            </Animated.View>
        </View>
    );
}

function generateMockLandmarks(): Landmark[] {
    const landmarks: Landmark[] = [];
    const baseX = 0.4 + (Math.random() - 0.5) * 0.1;
    const baseY = 0.4 + (Math.random() - 0.5) * 0.1;

    for (let i = 0; i < 21; i++) {
        landmarks.push({
            x: baseX + (Math.random() - 0.5) * 0.3,
            y: baseY + (Math.random() - 0.5) * 0.3,
            z: (Math.random() - 0.5) * 0.1,
        });
    }
    return landmarks;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    camera: {
        flex: 1,
    },
    gradientOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#0f172a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingGradient: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    permissionContent: {
        alignItems: 'center',
        gap: 20,
        maxWidth: 400,
    },
    iconWrapper: {
        marginBottom: 16,
    },
    iconGradient: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    permissionTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },
    permissionSubtitle: {
        fontSize: 16,
        color: '#a5b4fc',
        textAlign: 'center',
        fontWeight: '600',
    },
    permissionText: {
        fontSize: 16,
        color: '#cbd5e1',
        textAlign: 'center',
        lineHeight: 24,
    },
    permissionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 30,
        marginTop: 16,
    },
    permissionButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    topBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 48,
        paddingHorizontal: 20,
        paddingBottom: 16,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(239, 68, 68, 0.9)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    liveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#fff',
    },
    liveText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    fpsText: {
        color: '#fff',
        fontSize: 12,
        opacity: 0.9,
    },
    topControls: {
        flexDirection: 'row',
        gap: 12,
    },
    topButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    detectionFrame: {
        position: 'absolute',
        top: '20%',
        left: '10%',
        right: '10%',
        bottom: '40%',
    },
    frameCorner: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderColor: '#3b82f6',
        borderWidth: 3,
    },
    topLeft: {
        top: 0,
        left: 0,
        borderRightWidth: 0,
        borderBottomWidth: 0,
        borderTopLeftRadius: 8,
    },
    topRight: {
        top: 0,
        right: 0,
        borderLeftWidth: 0,
        borderBottomWidth: 0,
        borderTopRightRadius: 8,
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderRightWidth: 0,
        borderTopWidth: 0,
        borderBottomLeftRadius: 8,
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        borderBottomRightRadius: 8,
    },
    bottomPanel: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    blurContainer: {
        padding: 20,
        paddingBottom: 32,
    },
    actionBar: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    actionBtn: {
        flex: 1,
        height: 56,
        borderRadius: 16,
        overflow: 'hidden',
    },
    clearBtn: {},
    speakBtn: {},
    btnGradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    btnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
