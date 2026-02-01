import { StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';

import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function HomeScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#3b82f6', dark: '#1e3a8a' }}
      headerImage={
        <LinearGradient
          colors={['#3b82f6', '#8b5cf6', '#ec4899']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <ThemedText style={styles.headerEmoji}>🤟</ThemedText>
        </LinearGradient>
      }>

      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Bridging Silence</ThemedText>
          <HelloWave />
        </ThemedView>

        <ThemedView style={styles.descriptionContainer}>
          <ThemedText style={styles.description}>
            AI-powered Tanzanian Sign Language recognition. Translate sign language gestures into text and speech in real-time.
          </ThemedText>
        </ThemedView>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/(tabs)/camera')}
        >
          <LinearGradient
            colors={['#3b82f6', '#8b5cf6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cameraButton}
          >
            <IconSymbol size={28} name="camera.fill" color="#fff" />
            <ThemedText style={styles.cameraButtonText}>Start Detecting</ThemedText>
          </LinearGradient>
        </TouchableOpacity>

        <ThemedView style={styles.sectionContainer}>
          <ThemedText type="subtitle">✨ How It Works</ThemedText>

          <ThemedView style={styles.stepsList}>
            {[
              { icon: '📷', title: 'Open Camera', desc: 'Automatic real-time detection starts immediately' },
              { icon: '🤖', title: 'AI Analysis', desc: '21 hand landmarks processed by our ML model' },
              { icon: '📝', title: 'Get Results', desc: 'See predictions with confidence scores' },
              { icon: '🔊', title: 'Hear Speech', desc: 'Text-to-speech reads out the detected signs' },
            ].map((step, index) => (
              <ThemedView key={index} style={styles.step}>
                <ThemedView style={styles.stepIcon}>
                  <ThemedText style={styles.stepIconText}>{step.icon}</ThemedText>
                </ThemedView>
                <ThemedView style={styles.stepContent}>
                  <ThemedText type="defaultSemiBold">{step.title}</ThemedText>
                  <ThemedText style={styles.stepDesc}>{step.desc}</ThemedText>
                </ThemedView>
              </ThemedView>
            ))}
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.sectionContainer}>
          <ThemedText type="subtitle">🚀 Features</ThemedText>
          <ThemedView style={styles.featureGrid}>
            {[
              { icon: '⚡', text: 'Real-time Detection' },
              { icon: '🎯', text: 'High Accuracy' },
              { icon: '🔊', text: 'Text-to-Speech' },
              { icon: '📱', text: 'Cross-platform' },
              { icon: '🎨', text: 'Hand Visualization' },
              { icon: '📊', text: 'Confidence Scores' },
            ].map((feature, index) => (
              <ThemedView key={index} style={styles.featureBadge}>
                <ThemedText style={styles.featureIcon}>{feature.icon}</ThemedText>
                <ThemedText style={styles.featureText}>{feature.text}</ThemedText>
              </ThemedView>
            ))}
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.sectionContainer}>
          <ThemedText type="subtitle">💡 Tips for Best Results</ThemedText>
          <ThemedView style={styles.tipsList}>
            {[
              'Ensure good lighting conditions',
              'Keep your hand centered in frame',
              'Use a plain background when possible',
              'Hold gestures steady for a moment',
              'Keep hand fully visible to camera',
            ].map((tip, index) => (
              <ThemedView key={index} style={styles.tipItem}>
                <ThemedText style={styles.tipBullet}>•</ThemedText>
                <ThemedText style={styles.tipText}>{tip}</ThemedText>
              </ThemedView>
            ))}
          </ThemedView>
        </ThemedView>
      </Animated.View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerGradient: {
    height: 200,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerEmoji: {
    fontSize: 80,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  descriptionContainer: {
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.8,
  },
  cameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    marginBottom: 32,
    elevation: 4,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cameraButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionContainer: {
    gap: 16,
    marginBottom: 24,
  },
  stepsList: {
    gap: 16,
  },
  step: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  stepIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIconText: {
    fontSize: 24,
  },
  stepContent: {
    flex: 1,
    gap: 4,
  },
  stepDesc: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  featureIcon: {
    fontSize: 20,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  tipBullet: {
    fontSize: 20,
    color: '#3b82f6',
    lineHeight: 24,
  },
  tipText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 24,
    opacity: 0.8,
  },
});
