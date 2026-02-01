import { StyleSheet, ScrollView, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function AboutScreen() {
  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.section}>
        <ThemedText type="title">About Bridging Silence</ThemedText>
        <ThemedText style={styles.description}>
          Bridging Silence is an AI-powered mobile application designed to convert Tanzanian Sign Language (TSL) into text and speech, facilitating seamless communication between deaf and hearing communities.
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.section}>
        <View style={styles.sectionHeader}>
          <IconSymbol size={24} name="brain" color="#3b82f6" />
          <ThemedText type="subtitle">How It Works</ThemedText>
        </View>
        <ThemedView style={styles.card}>
          <ThemedText type="defaultSemiBold">1. Hand Landmark Detection</ThemedText>
          <ThemedText style={styles.cardText}>
            Using MediaPipe's advanced computer vision technology, the app detects 21 key points on your hand in real-time.
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.card}>
          <ThemedText type="defaultSemiBold">2. Data Normalization</ThemedText>
          <ThemedText style={styles.cardText}>
            The 3D coordinates (x, y, z) of each landmark are normalized using min-max scaling to ensure consistent recognition across different hand sizes and camera angles.
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.card}>
          <ThemedText type="defaultSemiBold">3. AI Recognition</ThemedText>
          <ThemedText style={styles.cardText}>
            The normalized 63-feature vector is sent to our trained machine learning model hosted on the cloud, which predicts the corresponding TSL letter or gesture.
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.card}>
          <ThemedText type="defaultSemiBold">4. Text & Speech Output</ThemedText>
          <ThemedText style={styles.cardText}>
            The recognized sign is converted to text and spoken aloud using text-to-speech technology, enabling real-time communication.
          </ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.section}>
        <View style={styles.sectionHeader}>
          <IconSymbol size={24} name="info.circle" color="#10b981" />
          <ThemedText type="subtitle">Technical Specifications</ThemedText>
        </View>
        <ThemedView style={styles.specContainer}>
          <ThemedView style={styles.specRow}>
            <ThemedText style={styles.specLabel}>Landmarks:</ThemedText>
            <ThemedText style={styles.specValue}>21 hand points</ThemedText>
          </ThemedView>
          <ThemedView style={styles.specRow}>
            <ThemedText style={styles.specLabel}>Features:</ThemedText>
            <ThemedText style={styles.specValue}>63 (x, y, z × 21)</ThemedText>
          </ThemedView>
          <ThemedView style={styles.specRow}>
            <ThemedText style={styles.specLabel}>Detection Engine:</ThemedText>
            <ThemedText style={styles.specValue}>MediaPipe Hands</ThemedText>
          </ThemedView>
          <ThemedView style={styles.specRow}>
            <ThemedText style={styles.specLabel}>ML Model:</ThemedText>
            <ThemedText style={styles.specValue}>MLP Classifier</ThemedText>
          </ThemedView>
          <ThemedView style={styles.specRow}>
            <ThemedText style={styles.specLabel}>API:</ThemedText>
            <ThemedText style={styles.specValue}>production-model.onrender.com</ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.section}>
        <View style={styles.sectionHeader}>
          <IconSymbol size={24} name="hand.raised.fill" color="#f59e0b" />
          <ThemedText type="subtitle">Supported Signs</ThemedText>
        </View>
        <ThemedText style={styles.description}>
          Currently, Bridging Silence recognizes static hand gestures corresponding to letters and basic signs in Tanzanian Sign Language. The model is continuously being improved with more data and signs.
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.section}>
        <View style={styles.sectionHeader}>
          <IconSymbol size={24} name="lightbulb.fill" color="#8b5cf6" />
          <ThemedText type="subtitle">Best Practices</ThemedText>
        </View>
        <ThemedView style={styles.tipsList}>
          <ThemedText>• Use in well-lit environments</ThemedText>
          <ThemedText>• Keep hand fully visible in frame</ThemedText>
          <ThemedText>• Maintain steady hand position</ThemedText>
          <ThemedText>• Ensure plain background when possible</ThemedText>
          <ThemedText>• Hold sign for 1-2 seconds before capturing</ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.section}>
        <View style={styles.sectionHeader}>
          <IconSymbol size={24} name="globe" color="#06b6d4" />
          <ThemedText type="subtitle">Mission</ThemedText>
        </View>
        <ThemedText style={styles.description}>
          Our mission is to break down communication barriers and create an inclusive society where sign language users can communicate effortlessly with everyone. By leveraging AI technology, we're making sign language recognition accessible to all.
        </ThemedText>
      </ThemedView>

      <ThemedView style={[styles.section, styles.footer]}>
        <ThemedText style={styles.footerText}>
          Version 1.0.0
        </ThemedText>
        <ThemedText style={styles.footerText}>
          © 2026 Bridging Silence
        </ThemedText>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    padding: 20,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.9,
  },
  card: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  cardText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  specContainer: {
    gap: 8,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(156, 163, 175, 0.2)',
  },
  specLabel: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.7,
  },
  specValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  tipsList: {
    gap: 8,
    paddingLeft: 8,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 48,
    borderTopWidth: 1,
    borderTopColor: 'rgba(156, 163, 175, 0.2)',
  },
  footerText: {
    fontSize: 12,
    opacity: 0.5,
  },
});
