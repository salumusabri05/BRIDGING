/**
 * Development Banner Component
 * Shows when hand detection is not yet implemented
 */

import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export function DevelopmentBanner() {
    return (
        <LinearGradient
            colors={['#f59e0b', '#d97706']}
            style={styles.banner}
        >
            <Ionicons name="construct" size={18} color="#fff" />
            <Text style={styles.text}>
                Development Mode - Hand Detection In Progress
            </Text>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginHorizontal: 20,
    },
    text: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
});
