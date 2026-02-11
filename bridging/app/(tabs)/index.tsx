/**
 * Bridging Silence — Home Screen
 * Beautiful animated UI with logo, video samples, and quick actions
 */

import React, { useRef, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Image,
    FlatList,
    Animated,
    Platform,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';

const { width, height } = Dimensions.get('window');

// Sign language sample videos
const SAMPLE_VIDEOS = [
    { id: '1', title: 'Sign A', file: require('../../assets/videos/VID-20250505-WA0081.mp4') },
    { id: '2', title: 'Sign B', file: require('../../assets/videos/VID-20250505-WA0082.mp4') },
    { id: '3', title: 'Sign C', file: require('../../assets/videos/VID-20250505-WA0083.mp4') },
    { id: '4', title: 'Sign D', file: require('../../assets/videos/VID-20250505-WA0084.mp4') },
    { id: '5', title: 'Sign E', file: require('../../assets/videos/VID-20250505-WA0085.mp4') },
    { id: '6', title: 'Sign F', file: require('../../assets/videos/VID-20250505-WA0086.mp4') },
    { id: '7', title: 'Sign G', file: require('../../assets/videos/VID-20250505-WA0087.mp4') },
    { id: '8', title: 'Sign H', file: require('../../assets/videos/VID-20250505-WA0088.mp4') },
];

export default function HomeScreen() {
    // Animations
    const logoScale = useRef(new Animated.Value(0)).current;
    const titleFade = useRef(new Animated.Value(0)).current;
    const titleSlide = useRef(new Animated.Value(20)).current;
    const subtitleFade = useRef(new Animated.Value(0)).current;
    const buttonFade = useRef(new Animated.Value(0)).current;
    const buttonSlide = useRef(new Animated.Value(40)).current;
    const contentFade = useRef(new Animated.Value(0)).current;
    const contentSlide = useRef(new Animated.Value(60)).current;

    const [activeVideo, setActiveVideo] = useState<string | null>(null);

    useEffect(() => {
        // Staggered entrance animation
        Animated.sequence([
            // Logo bounce in
            Animated.spring(logoScale, {
                toValue: 1,
                friction: 6,
                tension: 80,
                useNativeDriver: true,
            }),
            // Title slide in
            Animated.parallel([
                Animated.timing(titleFade, { toValue: 1, duration: 500, useNativeDriver: true }),
                Animated.timing(titleSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
            ]),
            // Subtitle
            Animated.timing(subtitleFade, { toValue: 1, duration: 400, useNativeDriver: true }),
            // Button
            Animated.parallel([
                Animated.timing(buttonFade, { toValue: 1, duration: 400, useNativeDriver: true }),
                Animated.spring(buttonSlide, { toValue: 0, friction: 7, tension: 60, useNativeDriver: true }),
            ]),
            // Content
            Animated.parallel([
                Animated.timing(contentFade, { toValue: 1, duration: 500, useNativeDriver: true }),
                Animated.timing(contentSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
            ]),
        ]).start();
    }, [logoScale, titleFade, titleSlide, subtitleFade, buttonFade, buttonSlide, contentFade, contentSlide]);

    const renderVideoCard = ({ item }: { item: typeof SAMPLE_VIDEOS[0] }) => (
        <TouchableOpacity
            style={styles.videoCard}
            activeOpacity={0.9}
            onPress={() => setActiveVideo(activeVideo === item.id ? null : item.id)}
        >
            <View style={styles.videoWrapper}>
                <Video
                    source={item.file}
                    style={styles.video}
                    resizeMode={ResizeMode.COVER}
                    shouldPlay={activeVideo === item.id}
                    isLooping
                    isMuted
                    useNativeControls={false}
                />
                {activeVideo !== item.id && (
                    <View style={styles.videoOverlay}>
                        <LinearGradient
                            colors={['transparent', 'rgba(12, 74, 110, 0.8)']}
                            style={styles.videoGradient}
                        >
                            <Ionicons name="play-circle" size={40} color="#fff" />
                        </LinearGradient>
                    </View>
                )}
            </View>
            <View style={styles.videoLabel}>
                <Text style={styles.videoTitle}>{item.title}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Background gradient */}
            <LinearGradient
                colors={['#0C4A6E', '#0E7490', '#0891B2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0.3, y: 1 }}
                style={StyleSheet.absoluteFill}
            />

            {/* Decorative circles */}
            <View style={styles.decorCircle1} />
            <View style={styles.decorCircle2} />
            <View style={styles.decorCircle3} />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header with Logo */}
                <View style={styles.header}>
                    <Animated.View style={[styles.logoContainer, { transform: [{ scale: logoScale }] }]}>
                        <Image
                            source={require('../../assets/logo.jpg')}
                            style={styles.logo}
                            resizeMode="cover"
                        />
                    </Animated.View>

                    <Animated.Text style={[
                        styles.title,
                        { opacity: titleFade, transform: [{ translateY: titleSlide }] },
                    ]}>
                        Bridging Silence
                    </Animated.Text>

                    <Animated.Text style={[styles.subtitle, { opacity: subtitleFade }]}>
                        Tanzanian Sign Language Translator
                    </Animated.Text>
                </View>

                {/* Start Camera Button */}
                <Animated.View style={{
                    opacity: buttonFade,
                    transform: [{ translateY: buttonSlide }],
                }}>
                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => router.push('/(tabs)/camera')}
                        style={styles.ctaButtonShadow}
                    >
                        <LinearGradient
                            colors={['#0EA5E9', '#06B6D4', '#14B8A6']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.ctaButton}
                        >
                            <Ionicons name="camera" size={28} color="#fff" />
                            <Text style={styles.ctaText}>Start Translating</Text>
                            <Ionicons name="arrow-forward" size={22} color="rgba(255,255,255,0.8)" />
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>

                {/* Content Section */}
                <Animated.View style={{
                    opacity: contentFade,
                    transform: [{ translateY: contentSlide }],
                }}>
                    {/* How It Works */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>How It Works</Text>
                        <View style={styles.stepsRow}>
                            {[
                                { icon: 'camera-outline', label: 'Point Camera', step: '1' },
                                { icon: 'hand-left-outline', label: 'Show Sign', step: '2' },
                                { icon: 'text-outline', label: 'See Result', step: '3' },
                                { icon: 'volume-high-outline', label: 'Hear It', step: '4' },
                            ].map((item, i) => (
                                <View key={i} style={styles.stepItem}>
                                    <View style={styles.stepCircle}>
                                        <Text style={styles.stepNumber}>{item.step}</Text>
                                    </View>
                                    <View style={styles.stepIconBox}>
                                        <Ionicons name={item.icon as any} size={26} color="#fff" />
                                    </View>
                                    <Text style={styles.stepLabel}>{item.label}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Sample Videos */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Learn Signs</Text>
                        <Text style={styles.sectionSubtitle}>
                            Tap to play sample sign language videos
                        </Text>
                        <FlatList
                            data={SAMPLE_VIDEOS}
                            renderItem={renderVideoCard}
                            keyExtractor={(item) => item.id}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.videoList}
                            snapToInterval={width * 0.42 + 12}
                            decelerationRate="fast"
                        />
                    </View>

                    {/* Features */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Features</Text>
                        <View style={styles.featuresGrid}>
                            {[
                                { icon: 'flash', label: 'Instant Detection', color: '#FBBF24' },
                                { icon: 'volume-high', label: 'Voice Output', color: '#34D399' },
                                { icon: 'hand-left', label: 'Hand Tracking', color: '#F472B6' },
                                { icon: 'globe', label: 'TSL Support', color: '#60A5FA' },
                                { icon: 'shield-checkmark', label: 'Private & Secure', color: '#A78BFA' },
                                { icon: 'accessibility', label: 'Accessible', color: '#FB923C' },
                            ].map((feat, i) => (
                                <View key={i} style={styles.featureCard}>
                                    <View style={[styles.featureIconBg, { backgroundColor: feat.color + '20' }]}>
                                        <Ionicons name={feat.icon as any} size={24} color={feat.color} />
                                    </View>
                                    <Text style={styles.featureLabel}>{feat.label}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Tips */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Tips for Best Results</Text>
                        <View style={styles.tipsCard}>
                            {[
                                { icon: 'sunny', tip: 'Use good lighting' },
                                { icon: 'hand-left', tip: 'Keep hand centered on screen' },
                                { icon: 'resize', tip: 'Show your full hand clearly' },
                                { icon: 'pause', tip: 'Hold gesture steady' },
                            ].map((t, i) => (
                                <View key={i} style={styles.tipRow}>
                                    <View style={styles.tipIconBox}>
                                        <Ionicons name={t.icon as any} size={18} color="#0EA5E9" />
                                    </View>
                                    <Text style={styles.tipText}>{t.tip}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Image
                            source={require('../../assets/logo.jpg')}
                            style={styles.footerLogo}
                            resizeMode="cover"
                        />
                        <Text style={styles.footerText}>Bridging Silence</Text>
                        <Text style={styles.footerSub}>Breaking barriers through technology</Text>
                    </View>
                </Animated.View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100,
    },

    // Decorative background circles
    decorCircle1: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(14, 165, 233, 0.08)',
        top: -80,
        right: -100,
    },
    decorCircle2: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(6, 182, 212, 0.06)',
        top: height * 0.4,
        left: -60,
    },
    decorCircle3: {
        position: 'absolute',
        width: 250,
        height: 250,
        borderRadius: 125,
        backgroundColor: 'rgba(20, 184, 166, 0.05)',
        bottom: 100,
        right: -80,
    },

    // Header
    header: {
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 80 : 60,
        paddingBottom: 20,
    },
    logoContainer: {
        width: 110,
        height: 110,
        borderRadius: 55,
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.3)',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    title: {
        fontSize: 34,
        fontWeight: '800',
        color: '#fff',
        marginTop: 20,
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.75)',
        marginTop: 6,
        fontWeight: '500',
    },

    // CTA Button
    ctaButtonShadow: {
        marginHorizontal: 28,
        marginTop: 28,
        marginBottom: 10,
        borderRadius: 20,
        elevation: 8,
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 14,
    },
    ctaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        paddingVertical: 20,
        paddingHorizontal: 32,
        borderRadius: 20,
    },
    ctaText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
        flex: 1,
        textAlign: 'center',
    },

    // Sections
    section: {
        marginTop: 36,
        paddingHorizontal: 24,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 6,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.6)',
        marginBottom: 16,
    },

    // Steps
    stepsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    stepItem: {
        alignItems: 'center',
        flex: 1,
    },
    stepCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(14, 165, 233, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    stepNumber: {
        fontSize: 12,
        fontWeight: '800',
        color: '#0EA5E9',
    },
    stepIconBox: {
        width: 54,
        height: 54,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    stepLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '600',
        textAlign: 'center',
    },

    // Videos
    videoList: {
        paddingRight: 24,
    },
    videoCard: {
        width: width * 0.42,
        marginRight: 12,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    videoWrapper: {
        width: '100%',
        height: width * 0.56,
        backgroundColor: '#000',
    },
    video: {
        width: '100%',
        height: '100%',
    },
    videoOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-end',
    },
    videoGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    videoLabel: {
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    videoTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
        textAlign: 'center',
    },

    // Features grid
    featuresGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 12,
    },
    featureCard: {
        width: (width - 58) / 3 - 1,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        gap: 8,
    },
    featureIconBg: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.85)',
        textAlign: 'center',
    },

    // Tips
    tipsCard: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 16,
        padding: 20,
        gap: 16,
        marginTop: 12,
    },
    tipRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    tipIconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(14, 165, 233, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tipText: {
        flex: 1,
        fontSize: 15,
        color: 'rgba(255,255,255,0.85)',
        fontWeight: '500',
    },

    // Footer
    footer: {
        alignItems: 'center',
        marginTop: 48,
        paddingBottom: 20,
    },
    footerLogo: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginBottom: 10,
        opacity: 0.7,
    },
    footerText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.5)',
    },
    footerSub: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.3)',
        marginTop: 4,
    },
});
