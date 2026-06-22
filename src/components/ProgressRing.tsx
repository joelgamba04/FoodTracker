// src/components/ProgressRing.tsx

import React from "react";
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import { COLORS } from "../theme/color";

type ProgressRingProps = {
  percent: number;
  image?: ImageSourcePropType;
  color?: string;
  trackColor?: string;
  size?: number;
  strokeWidth?: number;
  label?: string;
  imageScale?: number;
};

const ProgressRing = ({
  percent,
  image,
  color = COLORS.taguigBlue,
  trackColor = "#E5E7EB",
  size = 138,
  strokeWidth = 10,
  label = "Completed",
  imageScale = 0.42,
}: ProgressRingProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, percent));
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View style={[styles.ringWrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          stroke={trackColor}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />

        <Circle
          stroke={color}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      <View style={styles.ringCenter}>
        {image && (
          <Image
            source={image}
            style={{
              width: size * imageScale,
              height: size * imageScale,
              resizeMode: "contain",
              marginBottom: -32,
            }}
          />
        )}

        <Text style={[styles.percentText, { fontSize: size * 0.2 }]}>
          {progress}%
        </Text>

        <Text style={styles.completedText}>{label}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  ringWrap: {
    alignItems: "center",
    justifyContent: "center",
  },

  ringCenter: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },

  percentText: {
    marginTop: 4,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },

  completedText: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
});

export default ProgressRing;
