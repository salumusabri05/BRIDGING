/**
 * TSL Camera — Hand Sign Recognition + Sentence Builder
 * 
 * Supports two modes:
 *  • Manual: Tap capture button to detect one sign at a time
 *  • Auto:   Continuously captures every ~1.5s, compares hand landmarks,
 *            and only sends to API when the pose has changed significantly.
 * 
 * Flow: Camera → Photo → MediaPipe (WebView) → Landmarks → (change?) → API → Letter
 * Letters accumulate into words, words form sentences.
 * User can add spaces, backspace, clear, and speak the result in Swahili.
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
    Alert,
    ScrollView,
    Easing,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HandLandmarkDetector, { HandDetectorRef } from '../../components/HandLandmarkDetector';
import { apiService } from '../../services/api.service';
import { speechService } from '../../services/speech.service';
import type { SpeechLanguage } from '../../services/speech.service';

const { width } = Dimensions.get('window');
const GUIDE_SIZE = width * 0.72;

// ── Auto-detect tuning constants ──
const AUTO_CAPTURE_INTERVAL = 1500;      // ms between auto-captures
const POSE_CHANGE_THRESHOLD = 0.035;     // min avg landmark movement to count as "new pose"
const STABILITY_FRAMES = 2;              // consecutive similar frames before we accept a pose
const DUPLICATE_LETTER_COOLDOWN = 2000;  // ms before accepting the same letter again

/** Calculate average Euclidean distance between two landmark arrays */
function landmarkDistance(
    a: { x: number; y: number; z: number }[],
    b: { x: number; y: number; z: number }[],
): number {
    if (a.length !== b.length || a.length === 0) return Infinity;
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
        const dx = a[i].x - b[i].x;
        const dy = a[i].y - b[i].y;
        const dz = a[i].z - b[i].z;
        sum += Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    return sum / a.length;
}

export default function TSLCameraScreen() {
    const insets = useSafeAreaInsets();
    const [permission, requestPermission] = useCameraPermissions();
    const [facing, setFacing] = useState<CameraType>('front');
    const [isCapturing, setIsCapturing] = useState(false);
    const [lastLetter, setLastLetter] = useState('');
    const [confidence, setConfidence] = useState(0);
    const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
    const [isDetectorReady, setIsDetectorReady] = useState(false);
    const [statusText, setStatusText] = useState('Loading hand detector...');
    const [speechLang, setSpeechLang] = useState<SpeechLanguage>('sw');

    // Sentence builder state
    const [sentence, setSentence] = useState('');

    // Auto-detect state
    const [autoMode, setAutoMode] = useState(false);
    const autoModeRef = useRef(false);   // non-stale ref for async loop
    const prevLandmarksRef = useRef<{ x: number; y: number; z: number }[] | null>(null);
    const stableCountRef = useRef(0);
    const lastAcceptedLetterRef = useRef('');
    const lastAcceptedTimeRef = useRef(0);
    const autoLoopRunningRef = useRef(false);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    const cameraRef = useRef<CameraView>(null);
    const detectorRef = useRef<HandDetectorRef>(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const sentenceScrollRef = useRef<ScrollView>(null);
    const letterPopAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        speechService.setLanguage(speechLang);
    }, [speechLang]);

    useEffect(() => {
        if (permission?.granted) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }).start();
        }
    }, [permission, fadeAnim]);

    // Animate new letter pop-in
    const animateLetterPop = useCallback(() => {
        letterPopAnim.setValue(0);
        Animated.sequence([
            Animated.spring(letterPopAnim, {
                toValue: 1.3,
                friction: 4,
                tension: 120,
                useNativeDriver: true,
            }),
            Animated.spring(letterPopAnim, {
                toValue: 1,
                friction: 5,
                tension: 80,
                useNativeDriver: true,
            }),
        ]).start();
    }, [letterPopAnim]);

    // ── Auto-detect pulse animation ──
    useEffect(() => {
        let anim: Animated.CompositeAnimation;
        if (autoMode) {
            anim = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.15,
                        duration: 800,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 800,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ]),
            );
            anim.start();
        } else {
            pulseAnim.setValue(1);
        }
        return () => anim?.stop();
    }, [autoMode, pulseAnim]);

    // ── Single auto-capture cycle ──
    const runSingleAutoCapture = useCallback(async () => {
        if (!cameraRef.current || !detectorRef.current || !autoModeRef.current) return;

        try {
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.6,     // lower quality for speed
                base64: true,
            });
            if (!photo?.base64 || !autoModeRef.current) return;

            const detection = await detectorRef.current.detectFromBase64(photo.base64);
            if (!autoModeRef.current) return;

            // No hand detected — reset stability counter
            if (!detection) {
                prevLandmarksRef.current = null;
                stableCountRef.current = 0;
                setStatusText('Show your hand sign');
                return;
            }

            const newLandmarks = detection.landmarks;

            // First frame or returning after no-hand
            if (!prevLandmarksRef.current) {
                prevLandmarksRef.current = newLandmarks;
                stableCountRef.current = 1;
                setStatusText('Hold steady...');
                return;
            }

            const dist = landmarkDistance(newLandmarks, prevLandmarksRef.current);

            if (dist > POSE_CHANGE_THRESHOLD) {
                // Hand moved significantly — new pose candidate
                prevLandmarksRef.current = newLandmarks;
                stableCountRef.current = 1;
                setStatusText('New pose detected — hold...');
                return;
            }

            // Hand is stable in this position
            stableCountRef.current += 1;

            if (stableCountRef.current < STABILITY_FRAMES) {
                setStatusText('Hold steady...');
                return;
            }

            // Stable long enough — send to API
            stableCountRef.current = 0; // reset so we don't re-send the same pose
            setStatusText('Recognizing...');

            const response = await apiService.predictSign(detection.landmarks);
            if (!autoModeRef.current) return;

            if (response.error) {
                setStatusText('Auto-detect active');
                return;
            }

            const letter = response.letter || '';
            const conf = response.confidence || detection.confidence;

            if (!letter || letter === 'Unknown') {
                setStatusText('Auto-detect active');
                return;
            }

            // Duplicate suppression — same letter within cooldown
            const now = Date.now();
            if (
                letter === lastAcceptedLetterRef.current &&
                now - lastAcceptedTimeRef.current < DUPLICATE_LETTER_COOLDOWN
            ) {
                setStatusText(`Holding "${letter}" — move hand for next`);
                return;
            }

            // Accept this letter!
            lastAcceptedLetterRef.current = letter;
            lastAcceptedTimeRef.current = now;
            prevLandmarksRef.current = newLandmarks;

            setLastLetter(letter);
            setConfidence(conf);
            setStatusText(`Auto: ${letter}`);
            animateLetterPop();

            setSentence(prev => prev + letter);

            if (isSpeechEnabled) {
                speechService.speak(letter);
            }

            setTimeout(() => {
                sentenceScrollRef.current?.scrollToEnd({ animated: true });
            }, 100);

        } catch (err) {
            console.log('Auto-capture cycle error (non-fatal):', err);
        }
    }, [animateLetterPop, isSpeechEnabled]);

    // ── Auto-capture loop ──
    useEffect(() => {
        if (!autoMode || !isDetectorReady) {
            autoLoopRunningRef.current = false;
            return;
        }

        let timer: ReturnType<typeof setTimeout>;
        autoLoopRunningRef.current = true;

        const loop = async () => {
            if (!autoModeRef.current) return;
            await runSingleAutoCapture();
            if (autoModeRef.current) {
                timer = setTimeout(loop, AUTO_CAPTURE_INTERVAL);
            }
        };

        setStatusText('Auto-detect active');
        loop();

        return () => {
            autoLoopRunningRef.current = false;
            clearTimeout(timer);
        };
    }, [autoMode, isDetectorReady, runSingleAutoCapture]);

    // ── Toggle auto mode ──
    const toggleAutoMode = useCallback(() => {
        setAutoMode(prev => {
            const next = !prev;
            autoModeRef.current = next;
            if (!next) {
                // Turning off — clean up
                prevLandmarksRef.current = null;
                stableCountRef.current = 0;
                lastAcceptedLetterRef.current = '';
                setStatusText('Show your hand sign');
            }
            return next;
        });
    }, []);

    const onDetectorReady = () => {
        setIsDetectorReady(true);
        setStatusText('Show your hand sign');
        console.log('✅ Hand detector ready');
    };

    const onDetectorError = (error: string) => {
        console.error('❌ Detector error:', error);
        setStatusText('Detector error');
    };

    /**
     * Capture photo → detect hand → predict letter → add to sentence
     */
    const handleCapture = async () => {
        if (!cameraRef.current || isCapturing) return;

        if (!isDetectorReady) {
            Alert.alert('Please Wait', 'Hand detection model is still loading.');
            return;
        }

        setIsCapturing(true);
        setStatusText('Capturing...');

        try {
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.8,
                base64: true,
            });

            if (!photo?.base64) {
                Alert.alert('Error', 'Could not take photo. Please try again.');
                return;
            }

            setStatusText('Detecting hand...');
            const detection = await detectorRef.current?.detectFromBase64(photo.base64);

            if (!detection) {
                setStatusText('Show your hand sign');
                Alert.alert('No Hand Detected', 'Show your hand clearly within the guide and try again.');
                return;
            }

            setStatusText('Sending to AI...');
            const response = await apiService.predictSign(detection.landmarks);

            if (response.error) {
                setStatusText('Show your hand sign');
                Alert.alert('Prediction Error', response.error);
                return;
            }

            const letter = response.letter || '';
            const conf = response.confidence || detection.confidence;

            if (letter && letter !== 'Unknown') {
                setLastLetter(letter);
                setConfidence(conf);
                setStatusText(`Detected: ${letter}`);
                animateLetterPop();

                // Add letter to sentence
                setSentence(prev => prev + letter);

                // Speak the letter
                if (isSpeechEnabled) {
                    await speechService.speak(letter);
                }

                // Scroll sentence view to end
                setTimeout(() => {
                    sentenceScrollRef.current?.scrollToEnd({ animated: true });
                }, 100);
            } else {
                setStatusText('Could not recognize. Try again.');
            }
        } catch (error) {
            console.error('❌ Capture error:', error);
            Alert.alert('Error', 'Something went wrong. Please try again.');
            setStatusText('Show your hand sign');
        } finally {
            setIsCapturing(false);
        }
    };

    /** Add a space between words */
    const handleSpace = () => {
        if (sentence.length === 0) return;
        if (sentence.endsWith(' ')) return; // no double spaces
        setSentence(prev => prev + ' ');
        setTimeout(() => {
            sentenceScrollRef.current?.scrollToEnd({ animated: true });
        }, 100);
    };

    /** Delete the last character */
    const handleBackspace = () => {
        if (sentence.length === 0) return;
        setSentence(prev => prev.slice(0, -1));
    };

    /** Clear everything */
    const handleClear = () => {
        setSentence('');
        setLastLetter('');
        setConfidence(0);
        setStatusText('Show your hand sign');
        speechService.stop();
    };

    /** Speak the entire sentence */
    const handleSpeakSentence = async () => {
        const text = sentence.trim();
        if (!text) {
            Alert.alert('Nothing to read', 'Capture some signs first to build a sentence.');
            return;
        }
        speechService.stop();
        await speechService.speak(text);
    };

    /** Toggle language between Swahili and English */
    const toggleLanguage = () => {
        setSpeechLang(prev => {
            const next: SpeechLanguage = prev === 'sw' ? 'en' : 'sw';
            speechService.setLanguage(next);
            return next;
        });
    };

    const toggleCamera = () => {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    };

    const toggleSpeech = () => {
        setIsSpeechEnabled(current => !current);
    };

    // --- Permission screens ---

    if (!permission) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0EA5E9" />
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <LinearGradient colors={['#0C4A6E', '#0891B2', '#0EA5E9']} style={styles.permissionContainer}>
                <View style={styles.permissionContent}>
                    <View style={styles.iconWrapper}>
                        <LinearGradient colors={['#0EA5E9', '#06B6D4']} style={styles.iconGradient}>
                            <Ionicons name="camera" size={48} color="#fff" />
                        </LinearGradient>
                    </View>
                    <Text style={styles.permissionTitle}>Camera Access Needed</Text>
                    <Text style={styles.permissionText}>
                        We need camera access to see your hand signs and translate them
                    </Text>
                    <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                        <LinearGradient colors={['#0EA5E9', '#06B6D4']} style={styles.permissionButtonGradient}>
                            <Text style={styles.permissionButtonText}>Allow Camera</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        );
    }

    // --- Main camera screen ---

    const words = sentence.split(' ');

    return (
        <View style={styles.container}>
            {/* Hidden WebView for MediaPipe */}
            <HandLandmarkDetector
                ref={detectorRef}
                onReady={onDetectorReady}
                onError={onDetectorError}
            />

            <Animated.View style={[styles.mainContent, { opacity: fadeAnim }]}>
                {/* === Sentence Builder Bar (top) === */}
                <View style={[styles.sentenceBar, { paddingTop: Math.max(insets.top, 20) + 4 }]}>
                    <LinearGradient
                        colors={['rgba(8, 47, 73, 0.97)', 'rgba(12, 74, 110, 0.95)']}
                        style={styles.sentenceBarGradient}
                    >
                        {/* Language toggle */}
                        <View style={styles.sentenceHeader}>
                            <TouchableOpacity style={styles.langBadge} onPress={toggleLanguage}>
                                <Ionicons name="language" size={16} color="#38BDF8" />
                                <Text style={styles.langBadgeText}>
                                    {speechLang === 'sw' ? '🇹🇿 Swahili' : '🇬🇧 English'}
                                </Text>
                            </TouchableOpacity>
                            <Text style={styles.sentenceLabel}>Sentence Builder</Text>
                            <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
                                <Ionicons name="trash-outline" size={18} color="#F87171" />
                            </TouchableOpacity>
                        </View>

                        {/* Sentence display */}
                        <View style={styles.sentenceDisplayWrap}>
                            <ScrollView
                                ref={sentenceScrollRef}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.sentenceScrollContent}
                            >
                                {sentence.length === 0 ? (
                                    <Text style={styles.sentencePlaceholder}>
                                        Capture signs to build words...
                                    </Text>
                                ) : (
                                    <View style={styles.sentenceWordsRow}>
                                        {words.map((word, wi) => (
                                            <React.Fragment key={wi}>
                                                {wi > 0 && <View style={styles.wordSpacer} />}
                                                <View style={styles.wordChip}>
                                                    {word.split('').map((char, ci) => (
                                                        <Text
                                                            key={ci}
                                                            style={[
                                                                styles.sentenceLetter,
                                                                wi === words.length - 1 &&
                                                                ci === word.length - 1 &&
                                                                styles.sentenceLetterLatest,
                                                            ]}
                                                        >
                                                            {char}
                                                        </Text>
                                                    ))}
                                                </View>
                                            </React.Fragment>
                                        ))}
                                        <View style={styles.cursor} />
                                    </View>
                                )}
                            </ScrollView>
                        </View>

                        {/* Word builder action buttons */}
                        <View style={styles.sentenceActions}>
                            <TouchableOpacity style={styles.sentenceActionBtn} onPress={handleBackspace}>
                                <Ionicons name="backspace-outline" size={20} color="#fff" />
                                <Text style={styles.sentenceActionLabel}>Delete</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.sentenceActionBtn, styles.spaceBtn]}
                                onPress={handleSpace}
                            >
                                <Ionicons name="remove-outline" size={22} color="#fff" />
                                <Text style={styles.sentenceActionLabel}>Space</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.sentenceActionBtn, styles.speakBtn]}
                                onPress={handleSpeakSentence}
                            >
                                <Ionicons name="volume-high" size={20} color="#fff" />
                                <Text style={styles.sentenceActionLabel}>
                                    {speechLang === 'sw' ? 'Soma' : 'Read'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                </View>

                {/* === Camera === */}
                <View style={styles.cameraSection}>
                    <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
                        <View style={styles.overlay}>
                            {/* Top camera controls */}
                            <View style={styles.topBar}>
                                <TouchableOpacity style={styles.topButton} onPress={toggleCamera}>
                                    <LinearGradient
                                        colors={['rgba(14,165,233,0.9)', 'rgba(6,182,212,0.9)']}
                                        style={styles.topButtonGradient}
                                    >
                                        <Ionicons name="camera-reverse" size={22} color="#fff" />
                                    </LinearGradient>
                                </TouchableOpacity>

                                <View style={styles.statusBadge}>
                                    {!isDetectorReady && (
                                        <ActivityIndicator size="small" color="#0EA5E9" style={{ marginRight: 4 }} />
                                    )}
                                    <View style={[
                                        styles.statusDot,
                                        autoMode ? styles.dotAuto : (isDetectorReady ? styles.dotReady : styles.dotLoading),
                                    ]} />
                                    <Text style={styles.statusLabel}>
                                        {autoMode ? 'Auto' : isDetectorReady ? 'Ready' : 'Loading'}
                                    </Text>
                                </View>

                                <View style={styles.topButtonGroup}>
                                    {/* Auto-detect toggle */}
                                    <TouchableOpacity
                                        style={styles.topButton}
                                        onPress={toggleAutoMode}
                                        disabled={!isDetectorReady}
                                    >
                                        <Animated.View style={{ transform: [{ scale: autoMode ? pulseAnim : 1 }] }}>
                                            <LinearGradient
                                                colors={
                                                    autoMode
                                                        ? ['rgba(34,197,94,0.95)', 'rgba(16,185,129,0.95)']
                                                        : ['rgba(100,116,139,0.8)', 'rgba(71,85,105,0.8)']
                                                }
                                                style={styles.topButtonGradient}
                                            >
                                                <Ionicons
                                                    name={autoMode ? 'scan' : 'scan-outline'}
                                                    size={22}
                                                    color="#fff"
                                                />
                                            </LinearGradient>
                                        </Animated.View>
                                    </TouchableOpacity>

                                    {/* Sound toggle */}
                                    <TouchableOpacity style={styles.topButton} onPress={toggleSpeech}>
                                        <LinearGradient
                                            colors={
                                                isSpeechEnabled
                                                    ? ['rgba(14,165,233,0.9)', 'rgba(6,182,212,0.9)']
                                                    : ['rgba(156,163,175,0.9)', 'rgba(107,114,128,0.9)']
                                            }
                                            style={styles.topButtonGradient}
                                        >
                                            <Ionicons
                                                name={isSpeechEnabled ? 'volume-high' : 'volume-mute'}
                                                size={22}
                                                color="#fff"
                                            />
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Guide box */}
                            <View style={styles.guideArea}>
                                <Animated.View style={[
                                    styles.guideBorder,
                                    autoMode && styles.guideBorderAuto,
                                    autoMode && { transform: [{ scale: pulseAnim }] },
                                ]}>
                                    {/* Corner accents */}
                                    <View style={[styles.corner, styles.cornerTL, autoMode && styles.cornerAuto]} />
                                    <View style={[styles.corner, styles.cornerTR, autoMode && styles.cornerAuto]} />
                                    <View style={[styles.corner, styles.cornerBL, autoMode && styles.cornerAuto]} />
                                    <View style={[styles.corner, styles.cornerBR, autoMode && styles.cornerAuto]} />
                                </Animated.View>
                                <Text style={styles.guideText}>{statusText}</Text>
                            </View>

                            {/* Last letter result floating badge */}
                            {lastLetter !== '' && (
                                <Animated.View
                                    style={[
                                        styles.letterBadge,
                                        { transform: [{ scale: letterPopAnim }] },
                                    ]}
                                >
                                    <LinearGradient
                                        colors={['#0EA5E9', '#06B6D4']}
                                        style={styles.letterBadgeInner}
                                    >
                                        <Text style={styles.letterBadgeChar}>{lastLetter}</Text>
                                        <Text style={styles.letterBadgeConf}>
                                            {(confidence * 100).toFixed(0)}%
                                        </Text>
                                    </LinearGradient>
                                </Animated.View>
                            )}

                            {/* Capture button row */}
                            <View style={styles.captureRow}>
                                {autoMode ? (
                                    /* ── Auto-mode: pulsing indicator + stop button ── */
                                    <View style={styles.autoCaptureWrap}>
                                        <Animated.View style={{ opacity: pulseAnim }}>
                                            <LinearGradient
                                                colors={['#22C55E', '#16A34A']}
                                                style={styles.captureGradient}
                                            >
                                                {isCapturing ? (
                                                    <ActivityIndicator size="large" color="#fff" />
                                                ) : (
                                                    <View style={styles.captureContent}>
                                                        <Ionicons name="scan" size={28} color="#fff" />
                                                        <Text style={styles.captureLabel}>Auto</Text>
                                                    </View>
                                                )}
                                            </LinearGradient>
                                        </Animated.View>
                                        <TouchableOpacity
                                            style={styles.stopAutoBtn}
                                            onPress={toggleAutoMode}
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons name="stop-circle" size={20} color="#EF4444" />
                                            <Text style={styles.stopAutoLabel}>Stop</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    /* ── Manual capture button ── */
                                    <TouchableOpacity
                                        style={styles.captureButton}
                                        onPress={handleCapture}
                                        disabled={isCapturing}
                                        activeOpacity={0.8}
                                    >
                                        <LinearGradient
                                            colors={
                                                isCapturing
                                                    ? ['#6B7280', '#9CA3AF']
                                                    : ['#0EA5E9', '#06B6D4']
                                            }
                                            style={styles.captureGradient}
                                        >
                                            {isCapturing ? (
                                                <ActivityIndicator size="large" color="#fff" />
                                            ) : (
                                                <View style={styles.captureContent}>
                                                    <Ionicons name="hand-left" size={28} color="#fff" />
                                                    <Text style={styles.captureLabel}>Capture</Text>
                                                </View>
                                            )}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </CameraView>
                </View>
            </Animated.View>
        </View>
    );
}

// ─── Styles ──────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#0C4A6E',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainContent: {
        flex: 1,
    },

    // Permission screen
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
        color: 'rgba(255,255,255,0.9)',
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

    // ─── Sentence Builder ───
    sentenceBar: {
        backgroundColor: '#082F49',
    },
    sentenceBarGradient: {
        paddingHorizontal: 16,
        paddingBottom: 10,
    },
    sentenceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
        paddingTop: 6,
    },
    langBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: 'rgba(14,165,233,0.15)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(14,165,233,0.25)',
    },
    langBadgeText: {
        color: '#38BDF8',
        fontSize: 12,
        fontWeight: '700',
    },
    sentenceLabel: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    clearBtn: {
        padding: 6,
    },

    sentenceDisplayWrap: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(14,165,233,0.12)',
        minHeight: 52,
        justifyContent: 'center',
    },
    sentenceScrollContent: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        alignItems: 'center',
    },
    sentencePlaceholder: {
        color: 'rgba(255,255,255,0.25)',
        fontSize: 15,
        fontStyle: 'italic',
    },
    sentenceWordsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    wordChip: {
        flexDirection: 'row',
        backgroundColor: 'rgba(14,165,233,0.1)',
        borderRadius: 8,
        paddingHorizontal: 4,
        paddingVertical: 3,
    },
    wordSpacer: {
        width: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sentenceLetter: {
        fontSize: 22,
        fontWeight: '700',
        color: '#E0F2FE',
        paddingHorizontal: 2,
    },
    sentenceLetterLatest: {
        color: '#38BDF8',
    },
    cursor: {
        width: 2,
        height: 24,
        backgroundColor: '#38BDF8',
        marginLeft: 3,
        borderRadius: 1,
    },

    sentenceActions: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
    },
    sentenceActionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        backgroundColor: 'rgba(255,255,255,0.08)',
        paddingVertical: 9,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    spaceBtn: {
        backgroundColor: 'rgba(14,165,233,0.2)',
        borderColor: 'rgba(14,165,233,0.3)',
    },
    speakBtn: {
        backgroundColor: 'rgba(34,197,94,0.2)',
        borderColor: 'rgba(34,197,94,0.3)',
    },
    sentenceActionLabel: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },

    // ─── Camera ───
    cameraSection: {
        flex: 1,
    },
    camera: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        justifyContent: 'space-between',
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 10,
        paddingHorizontal: 16,
    },
    topButton: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    topButtonGradient: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    statusDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        marginRight: 5,
    },
    dotReady: {
        backgroundColor: '#22C55E',
    },
    dotLoading: {
        backgroundColor: '#F59E0B',
    },
    statusLabel: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },

    // Guide
    guideArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    guideBorder: {
        width: GUIDE_SIZE,
        height: GUIDE_SIZE,
        borderWidth: 2,
        borderColor: 'rgba(14,165,233,0.35)',
        borderRadius: 20,
        borderStyle: 'dashed',
    },
    corner: {
        position: 'absolute',
        width: 28,
        height: 28,
        borderColor: '#0EA5E9',
    },
    cornerTL: {
        top: -1,
        left: -1,
        borderTopWidth: 4,
        borderLeftWidth: 4,
        borderTopLeftRadius: 12,
    },
    cornerTR: {
        top: -1,
        right: -1,
        borderTopWidth: 4,
        borderRightWidth: 4,
        borderTopRightRadius: 12,
    },
    cornerBL: {
        bottom: -1,
        left: -1,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
        borderBottomLeftRadius: 12,
    },
    cornerBR: {
        bottom: -1,
        right: -1,
        borderBottomWidth: 4,
        borderRightWidth: 4,
        borderBottomRightRadius: 12,
    },
    guideText: {
        marginTop: 12,
        fontSize: 15,
        color: '#fff',
        fontWeight: '600',
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
        textAlign: 'center',
    },

    // Letter badge
    letterBadge: {
        position: 'absolute',
        top: 58,
        right: 16,
    },
    letterBadgeInner: {
        width: 64,
        height: 72,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 10,
    },
    letterBadgeChar: {
        fontSize: 36,
        fontWeight: '800',
        color: '#fff',
    },
    letterBadgeConf: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '600',
    },

    // Capture row
    captureRow: {
        alignItems: 'center',
        paddingBottom: 100,
    },
    captureButton: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 12,
    },
    captureGradient: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#fff',
    },
    captureContent: {
        alignItems: 'center',
        gap: 1,
    },
    captureLabel: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },

    // ─── Auto-mode styles ───
    autoCaptureWrap: {
        alignItems: 'center',
        gap: 10,
    },
    stopAutoBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: 'rgba(239,68,68,0.15)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.3)',
    },
    stopAutoLabel: {
        color: '#EF4444',
        fontSize: 13,
        fontWeight: '700',
    },
    dotAuto: {
        backgroundColor: '#22C55E',
    },
    guideBorderAuto: {
        borderColor: 'rgba(34,197,94,0.5)',
        borderStyle: 'solid' as any,
    },
    cornerAuto: {
        borderColor: '#22C55E',
    },
    topButtonGroup: {
        flexDirection: 'row' as const,
        alignItems: 'center',
        gap: 10,
    },
});
