import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { COLORS } from "../theme/color";

const ProgressRing = ({ percent }: { percent: number }) => {
  const size = 138;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, percent));
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View style={styles.ringWrap}>
      <Svg width={size} height={size}>
        <Circle
          stroke="#E5E7EB"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />

        <Circle
          stroke={COLORS.taguigBlue}
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
        <Ionicons name="water" size={30} color={COLORS.taguigBlue} />
        <Text style={styles.percentText}>{progress}%</Text>
        <Text style={styles.completedText}>Completed</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  ringWrap: {
    width: 138,
    height: 138,
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
    fontSize: 30,
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
