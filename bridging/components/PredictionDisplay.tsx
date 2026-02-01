/**
 * Prediction Display Component - Premium Design
 * Shows predicted letter, confidence, and history with beautiful animations
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PredictionHistoryItem } from '../types/tsl.types';

interface PredictionDisplayProps {
    currentLetter: string;
    confidence: number;
    history: PredictionHistoryItem[];
    error?: string;
}

export function PredictionDisplay({
    currentLetter,
    confidence,
    history,
    error,
}: PredictionDisplayProps) {
    const formedWord = history.map(item => item.letter).join('');

    return (
        <View style={styles.container}>
            {/* Current Prediction */}
            <View style={styles.currentPrediction}>
                {error ? (
                    <View style={styles.errorContainer}>
                        <LinearGradient
                            colors={['rgba(239, 68, 68, 0.2)', 'rgba(220, 38, 38, 0.1)']}
                            style={styles.errorGradient}
                        >
                            <Text style={styles.errorIcon}>⚠️</Text>
                            <Text style={styles.errorText}>{error}</Text>
                        </LinearGradient>
                    </View>
                ) : currentLetter ? (
                    <>
                        <Text style={styles.letterLabel}>Detected Sign</Text>

                        {/* Letter Display with Gradient */}
                        <View style={styles.letterContainer}>
                            <LinearGradient
                                colors={['#3b82f6', '#8b5cf6', '#ec4899']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.letterGradientBg}
                            >
                                <Text style={styles.letter}>{currentLetter}</Text>
                            </LinearGradient>
                        </View>

                        {/* Confidence Meter */}
                        {confidence > 0 && (
                            <View style={styles.confidenceContainer}>
                                <View style={styles.confidenceHeader}>
                                    <Text style={styles.confidenceLabel}>Confidence</Text>
                                    <Text style={styles.confidenceValue}>{(confidence * 100).toFixed(0)}%</Text>
                                </View>

                                <View style={styles.confidenceBarContainer}>
                                    <View style={styles.confidenceBarBg}>
                                        <LinearGradient
                                            colors={getConfidenceGradient(confidence)}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={[
                                                styles.confidenceBarFill,
                                                { width: `${confidence * 100}%` }
                                            ]}
                                        />
                                    </View>
                                </View>
                            </View>
                        )}
                    </>
                ) : (
                    <View style={styles.placeholderContainer}>
                        <Text style={styles.placeholderIcon}>✋</Text>
                        <Text style={styles.placeholder}>Show a sign to detect</Text>
                    </View>
                )}
            </View>

            {/* Formed Word */}
            {formedWord && (
                <View style={styles.wordContainer}>
                    <LinearGradient
                        colors={['rgba(59, 130, 246, 0.15)', 'rgba(139, 92, 246, 0.15)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.wordGradientBg}
                    >
                        <Text style={styles.wordLabel}>Formed Word</Text>
                        <Text style={styles.word}>{formedWord}</Text>
                    </LinearGradient>
                </View>
            )}

            {/* History */}
            {history.length > 0 && (
                <View style={styles.historyContainer}>
                    <Text style={styles.historyLabel}>Recent Signs ({history.length})</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.historyScroll}
                        contentContainerStyle={styles.historyContent}
                    >
                        {history.slice().reverse().map((item, index) => (
                            <LinearGradient
                                key={item.id}
                                colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                                style={styles.historyItem}
                            >
                                <Text style={styles.historyLetter}>{item.letter}</Text>
                                <View style={styles.historyConfidenceDot}>
                                    <View
                                        style={[
                                            styles.confidenceDot,
                                            { backgroundColor: getConfidenceColor(item.confidence) }
                                        ]}
                                    />
                                </View>
                            </LinearGradient>
                        ))}
                    </ScrollView>
                </View>
            )}
        </View>
    );
}

function getConfidenceGradient(confidence: number): string[] {
    if (confidence >= 0.8) return ['#10b981', '#059669']; // Green
    if (confidence >= 0.6) return ['#f59e0b', '#d97706']; // Orange
    return ['#ef4444', '#dc2626']; // Red
}

function getConfidenceColor(confidence: number): string {
    if (confidence >= 0.8) return '#10b981';
    if (confidence >= 0.6) return '#f59e0b';
    return '#ef4444';
}

const styles = StyleSheet.create({
    container: {
        gap: 16,
    },
    currentPrediction: {
        alignItems: 'center',
        gap: 12,
    },
    letterLabel: {
        fontSize: 14,
        color: '#a5b4fc',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    letterContainer: {
        borderRadius: 24,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    letterGradientBg: {
        paddingHorizontal: 48,
        paddingVertical: 24,
        minWidth: 120,
        alignItems: 'center',
    },
    letter: {
        fontSize: 72,
        fontWeight: 'bold',
        color: '#fff',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 8,
    },
    placeholderContainer: {
        alignItems: 'center',
        paddingVertical: 32,
        gap: 12,
    },
    placeholderIcon: {
        fontSize: 48,
        opacity: 0.5,
    },
    placeholder: {
        fontSize: 16,
        color: '#64748b',
        fontStyle: 'italic',
    },
    confidenceContainer: {
        width: '100%',
        gap: 8,
    },
    confidenceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    confidenceLabel: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    confidenceValue: {
        fontSize: 16,
        color: '#fff',
        fontWeight: 'bold',
    },
    confidenceBarContainer: {
        width: '100%',
    },
    confidenceBarBg: {
        height: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 4,
        overflow: 'hidden',
    },
    confidenceBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    errorContainer: {
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
    },
    errorGradient: {
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    errorIcon: {
        fontSize: 24,
    },
    errorText: {
        flex: 1,
        fontSize: 14,
        color: '#fca5a5',
        fontWeight: '500',
    },
    wordContainer: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    wordGradientBg: {
        padding: 16,
        alignItems: 'center',
        gap: 8,
    },
    wordLabel: {
        fontSize: 12,
        color: '#a5b4fc',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    word: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 3,
    },
    historyContainer: {
        gap: 12,
    },
    historyLabel: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    historyScroll: {
        flexGrow: 0,
    },
    historyContent: {
        gap: 8,
        paddingRight: 16,
    },
    historyItem: {
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        gap: 8,
        minWidth: 64,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    historyLetter: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    historyConfidenceDot: {
        marginTop: 4,
    },
    confidenceDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
});
