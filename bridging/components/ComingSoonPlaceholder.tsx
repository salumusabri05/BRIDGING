/**
 * Coming Soon Placeholder Component
 * Shows while hand detection is being implemented
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export function ComingSoonPlaceholder() {
    return (
        <View style={styles.container}>
            <View style={styles.iconWrapper}>
                <LinearGradient
                    colors={['#3b82f6', '#8b5cf6']}
                    style={styles.iconGradient}
                >
                    <Ionicons name="hand-left-outline" size={48} color="#fff" />
                </LinearGradient>
            </View>
            
            <Text style={styles.title}>Hand Detection Coming Soon</Text>
            <Text style={styles.subtitle}>We&apos;re implementing TensorFlow Lite</Text>
            <Text style={styles.description}>
                Real-time hand tracking and sign language recognition will be available soon.
                The camera, API, and speech features are ready!
            </Text>

            <View style={styles.statusContainer}>
                <View style={styles.statusItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                    <Text style={styles.statusText}>Camera Ready</Text>
                </View>
                <View style={styles.statusItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                    <Text style={styles.statusText}>API Connected</Text>
                </View>
                <View style={styles.statusItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                    <Text style={styles.statusText}>Speech Working</Text>
                </View>
                <View style={styles.statusItem}>
                    <Ionicons name="time-outline" size={20} color="#f59e0b" />
                    <Text style={styles.statusTextPending}>Detection In Progress</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        padding: 24,
        gap: 12,
    },
    iconWrapper: {
        marginBottom: 8,
    },
    iconGradient: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#a5b4fc',
        fontWeight: '600',
        textAlign: 'center',
    },
    description: {
        fontSize: 14,
        color: '#cbd5e1',
        textAlign: 'center',
        lineHeight: 20,
        marginTop: 8,
        paddingHorizontal: 12,
    },
    statusContainer: {
        marginTop: 20,
        gap: 10,
        alignSelf: 'stretch',
    },
    statusItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 16,
    },
    statusText: {
        color: '#10b981',
        fontSize: 14,
        fontWeight: '600',
    },
    statusTextPending: {
        color: '#f59e0b',
        fontSize: 14,
        fontWeight: '600',
    },
});
