/**
 * Hand Visualization Component - Premium Design
 * Beautiful hand skeleton overlay with glowing effects
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Line, G, Defs, RadialGradient, Stop } from 'react-native-svg';
import { Landmark } from '../types/tsl.types';
import { HAND_CONNECTIONS } from '../constants/mediapipe';

interface HandVisualizationProps {
    landmarks: Landmark[];
    width: number;
    height: number;
    primaryColor?: string;
    secondaryColor?: string;
}

export function HandVisualization({
    landmarks,
    width,
    height,
    primaryColor = '#3b82f6',
    secondaryColor = '#8b5cf6',
}: HandVisualizationProps) {
    if (!landmarks || landmarks.length === 0) {
        return null;
    }

    // Convert normalized coordinates to pixel coordinates
    const points = landmarks.map(lm => ({
        x: lm.x * width,
        y: lm.y * height,
    }));

    return (
        <View style={[styles.container, { width, height }]} pointerEvents="none">
            <Svg width={width} height={height}>
                <Defs>
                    {/* Gradient for joints */}
                    <RadialGradient id="jointGradient" cx="50%" cy="50%" r="50%">
                        <Stop offset="0%" stopColor={primaryColor} stopOpacity="1" />
                        <Stop offset="70%" stopColor={primaryColor} stopOpacity="0.8" />
                        <Stop offset="100%" stopColor={primaryColor} stopOpacity="0.3" />
                    </RadialGradient>

                    {/* Gradient for wrist */}
                    <RadialGradient id="wristGradient" cx="50%" cy="50%" r="50%">
                        <Stop offset="0%" stopColor="#ec4899" stopOpacity="1" />
                        <Stop offset="70%" stopColor="#ec4899" stopOpacity="0.8" />
                        <Stop offset="100%" stopColor="#ec4899" stopOpacity="0.3" />
                    </RadialGradient>
                </Defs>

                <G>
                    {/* Draw connection glow (shadow layer) */}
                    {HAND_CONNECTIONS.map(([start, end], index) => {
                        const startPoint = points[start];
                        const endPoint = points[end];

                        if (!startPoint || !endPoint) return null;

                        return (
                            <Line
                                key={`glow-${index}`}
                                x1={startPoint.x}
                                y1={startPoint.y}
                                x2={endPoint.x}
                                y2={endPoint.y}
                                stroke={primaryColor}
                                strokeWidth={8}
                                strokeOpacity={0.2}
                                strokeLinecap="round"
                            />
                        );
                    })}

                    {/* Draw connections */}
                    {HAND_CONNECTIONS.map(([start, end], index) => {
                        const startPoint = points[start];
                        const endPoint = points[end];

                        if (!startPoint || !endPoint) return null;

                        // Determine connection type for coloring
                        const isThumb = start <= 4 && end <= 4;
                        const isIndex = start >= 5 && start <= 8 && end >= 5 && end <= 8;

                        let strokeColor = primaryColor;
                        if (isThumb) strokeColor = '#ec4899'; // Pink for thumb
                        else if (isIndex) strokeColor = '#3b82f6'; // Blue for index
                        else strokeColor = secondaryColor; // Purple for palm/other connections

                        return (
                            <Line
                                key={`connection-${index}`}
                                x1={startPoint.x}
                                y1={startPoint.y}
                                x2={endPoint.x}
                                y2={endPoint.y}
                                stroke={strokeColor}
                                strokeWidth={3}
                                strokeOpacity={0.9}
                                strokeLinecap="round"
                            />
                        );
                    })}

                    {/* Draw landmark glows (outer circles) */}
                    {points.map((point, index) => {
                        const isWrist = index === 0;
                        const isTip = [4, 8, 12, 16, 20].includes(index);
                        const radius = isWrist ? 16 : isTip ? 10 : 8;

                        return (
                            <Circle
                                key={`glow-${index}`}
                                cx={point.x}
                                cy={point.y}
                                r={radius}
                                fill={isWrist ? 'url(#wristGradient)' : 'url(#jointGradient)'}
                                fillOpacity={0.4}
                            />
                        );
                    })}

                    {/* Draw landmarks (main circles) */}
                    {points.map((point, index) => {
                        const isWrist = index === 0;
                        const isTip = [4, 8, 12, 16, 20].includes(index);
                        const radius = isWrist ? 8 : isTip ? 6 : 5;
                        const fillColor = isWrist ? '#ec4899' : isTip ? '#3b82f6' : primaryColor;

                        return (
                            <Circle
                                key={`landmark-${index}`}
                                cx={point.x}
                                cy={point.y}
                                r={radius}
                                fill={fillColor}
                                fillOpacity={1}
                                stroke="#fff"
                                strokeWidth={2}
                                strokeOpacity={0.9}
                            />
                        );
                    })}
                </G>
            </Svg>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
    },
});
