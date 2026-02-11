/**
 * Bridging Silence — About Screen
 * App info, mission, team, and sign language education
 */

import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    Animated,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const SIGN_ALPHABET = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
    'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T',
    'U', 'V', 'W', 'X', 'Y', 'Z',
];

export default function AboutScreen() {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(40)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
        ]).start();
    }, [fadeAnim, slideAnim]);

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#0C4A6E', '#0E7490', '#0891B2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0.3, y: 1 }}
                style={StyleSheet.absoluteFill}
            />

            {/* Decorative elements */}
            <View style={styles.decorCircle1} />
            <View style={styles.decorCircle2} />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.logoContainer}>
                            <Image
                                source={require('../../assets/logo.jpg')}
                                style={styles.logo}
                                resizeMode="cover"
                            />
                        </View>
                        <Text style={styles.appName}>Bridging Silence</Text>
                        <Text style={styles.appVersion}>Version 1.0.0</Text>
                    </View>

                    {/* Mission */}
                    <View style={styles.card}>
                        <LinearGradient
                            colors={['rgba(14, 165, 233, 0.15)', 'rgba(6, 182, 212, 0.08)']}
                            style={styles.cardGradient}
                        >
                            <View style={styles.cardHeader}>
                                <Ionicons name="heart" size={22} color="#F472B6" />
                                <Text style={styles.cardTitle}>Our Mission</Text>
                            </View>
                            <Text style={styles.cardText}>
                                Bridging Silence breaks communication barriers for the deaf and 
                                hard-of-hearing community in Tanzania. Using AI and hand gesture 
                                recognition, we translate Tanzanian Sign Language (TSL) into text 
                                and speech in real time.
                            </Text>
                            <Text style={styles.cardText}>
                                We believe everyone deserves to be heard. This app empowers people 
                                to communicate freely, learn sign language, and build inclusive communities.
                            </Text>
                        </LinearGradient>
                    </View>

                    {/* How it works - Technical */}
                    <View style={styles.card}>
                        <LinearGradient
                            colors={['rgba(14, 165, 233, 0.15)', 'rgba(6, 182, 212, 0.08)']}
                            style={styles.cardGradient}
                        >
                            <View style={styles.cardHeader}>
                                <Ionicons name="cog" size={22} color="#60A5FA" />
                                <Text style={styles.cardTitle}>How It Works</Text>
                            </View>

                            <View style={styles.techSteps}>
                                {[
                                    {
                                        icon: 'camera',
                                        color: '#FBBF24',
                                        title: 'Camera Capture',
                                        desc: 'Your phone camera captures an image of your hand sign',
                                    },
                                    {
                                        icon: 'hand-left',
                                        color: '#F472B6',
                                        title: 'Hand Detection',
                                        desc: 'AI identifies 21 key points on your hand',
                                    },
                                    {
                                        icon: 'cloud-upload',
                                        color: '#60A5FA',
                                        title: 'AI Prediction',
                                        desc: 'Hand data is sent to our machine learning model',
                                    },
                                    {
                                        icon: 'chatbubble-ellipses',
                                        color: '#34D399',
                                        title: 'Translation',
                                        desc: 'The sign is translated to text and spoken aloud',
                                    },
                                ].map((step, i) => (
                                    <View key={i} style={styles.techStep}>
                                        <View style={[styles.techStepIcon, { backgroundColor: step.color + '20' }]}>
                                            <Ionicons name={step.icon as any} size={22} color={step.color} />
                                        </View>
                                        <View style={styles.techStepContent}>
                                            <Text style={styles.techStepTitle}>{step.title}</Text>
                                            <Text style={styles.techStepDesc}>{step.desc}</Text>
                                        </View>
                                        {i < 3 && <View style={styles.techStepLine} />}
                                    </View>
                                ))}
                            </View>
                        </LinearGradient>
                    </View>

                    {/* TSL Alphabet Reference */}
                    <View style={styles.card}>
                        <LinearGradient
                            colors={['rgba(14, 165, 233, 0.15)', 'rgba(6, 182, 212, 0.08)']}
                            style={styles.cardGradient}
                        >
                            <View style={styles.cardHeader}>
                                <Ionicons name="school" size={22} color="#FBBF24" />
                                <Text style={styles.cardTitle}>TSL Alphabet</Text>
                            </View>
                            <Text style={styles.cardSubtext}>
                                The app can recognize these Tanzanian Sign Language letters
                            </Text>
                            <View style={styles.alphabetGrid}>
                                {SIGN_ALPHABET.map((letter, i) => (
                                    <View key={i} style={styles.letterBadge}>
                                        <Text style={styles.letterText}>{letter}</Text>
                                    </View>
                                ))}
                            </View>
                        </LinearGradient>
                    </View>

                    {/* Stats */}
                    <View style={styles.statsRow}>
                        {[
                            { number: '21', label: 'Hand Points', icon: 'finger-print' },
                            { number: '26', label: 'Letters', icon: 'text' },
                            { number: 'AI', label: 'Powered', icon: 'sparkles' },
                        ].map((stat, i) => (
                            <View key={i} style={styles.statCard}>
                                <Ionicons name={stat.icon as any} size={24} color="#0EA5E9" />
                                <Text style={styles.statNumber}>{stat.number}</Text>
                                <Text style={styles.statLabel}>{stat.label}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Accessibility */}
                    <View style={styles.card}>
                        <LinearGradient
                            colors={['rgba(14, 165, 233, 0.15)', 'rgba(6, 182, 212, 0.08)']}
                            style={styles.cardGradient}
                        >
                            <View style={styles.cardHeader}>
                                <Ionicons name="accessibility" size={22} color="#34D399" />
                                <Text style={styles.cardTitle}>Accessibility First</Text>
                            </View>
                            <View style={styles.accessList}>
                                {[
                                    { icon: 'volume-high', text: 'Voice output speaks translations aloud' },
                                    { icon: 'text', text: 'Large text display for easy reading' },
                                    { icon: 'contrast', text: 'High contrast colors for visibility' },
                                    { icon: 'phone-portrait', text: 'Simple one-tap interface' },
                                    { icon: 'wifi', text: 'Works with any internet connection' },
                                ].map((item, i) => (
                                    <View key={i} style={styles.accessItem}>
                                        <Ionicons name={item.icon as any} size={18} color="rgba(255,255,255,0.7)" />
                                        <Text style={styles.accessText}>{item.text}</Text>
                                    </View>
                                ))}
                            </View>
                        </LinearGradient>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Image
                            source={require('../../assets/logo.jpg')}
                            style={styles.footerLogo}
                            resizeMode="cover"
                        />
                        <Text style={styles.footerName}>Bridging Silence</Text>
                        <Text style={styles.footerTagline}>
                            Breaking communication barriers{'\n'}through technology and compassion
                        </Text>
                        <Text style={styles.footerCopyright}>
                            © 2025 Bridging Silence. Made in Tanzania 🇹🇿
                        </Text>
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

    decorCircle1: {
        position: 'absolute',
        width: 250,
        height: 250,
        borderRadius: 125,
        backgroundColor: 'rgba(14, 165, 233, 0.06)',
        top: -60,
        left: -80,
    },
    decorCircle2: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(6, 182, 212, 0.05)',
        bottom: 200,
        right: -60,
    },

    // Header
    header: {
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 80 : 60,
        paddingBottom: 10,
    },
    logoContainer: {
        width: 90,
        height: 90,
        borderRadius: 45,
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.3)',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    appName: {
        fontSize: 28,
        fontWeight: '800',
        color: '#fff',
        marginTop: 16,
    },
    appVersion: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.5)',
        marginTop: 4,
        fontWeight: '500',
    },

    // Cards
    card: {
        marginHorizontal: 20,
        marginTop: 24,
        borderRadius: 20,
        overflow: 'hidden',
    },
    cardGradient: {
        padding: 24,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 14,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
    },
    cardText: {
        fontSize: 15,
        lineHeight: 24,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 10,
    },
    cardSubtext: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.55)',
        marginBottom: 16,
    },

    // Tech steps
    techSteps: {
        gap: 4,
    },
    techStep: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 14,
        position: 'relative',
        paddingBottom: 16,
    },
    techStepIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    techStepContent: {
        flex: 1,
    },
    techStepTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 2,
    },
    techStepDesc: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.6)',
        lineHeight: 20,
    },
    techStepLine: {
        position: 'absolute',
        left: 21,
        top: 46,
        width: 2,
        height: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },

    // Alphabet
    alphabetGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    letterBadge: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: 'rgba(14, 165, 233, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(14, 165, 233, 0.3)',
    },
    letterText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0EA5E9',
    },

    // Stats
    statsRow: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginTop: 24,
        gap: 10,
    },
    statCard: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 16,
        paddingVertical: 20,
        alignItems: 'center',
        gap: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    statNumber: {
        fontSize: 26,
        fontWeight: '800',
        color: '#fff',
    },
    statLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.55)',
        fontWeight: '600',
    },

    // Accessibility
    accessList: {
        gap: 14,
    },
    accessItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    accessText: {
        flex: 1,
        fontSize: 14,
        color: 'rgba(255,255,255,0.75)',
        lineHeight: 20,
    },

    // Footer
    footer: {
        alignItems: 'center',
        marginTop: 48,
        paddingBottom: 20,
    },
    footerLogo: {
        width: 44,
        height: 44,
        borderRadius: 22,
        opacity: 0.6,
        marginBottom: 12,
    },
    footerName: {
        fontSize: 18,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.4)',
    },
    footerTagline: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.25)',
        textAlign: 'center',
        marginTop: 6,
        lineHeight: 20,
    },
    footerCopyright: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.2)',
        marginTop: 16,
    },
});
