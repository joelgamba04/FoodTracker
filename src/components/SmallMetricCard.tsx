import { COLORS } from "@/theme/color";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

const SmallMetricCard = ({
  color,
  icon,
  title,
  value,
  subtitle,
  percent,
  onPress,
}: any) => (
  <Pressable style={styles.smallCard} onPress={onPress}>
    <View style={[styles.smallIcon, { backgroundColor: color }]}>
      <Ionicons name={icon} size={22} color="#FFFFFF" />
    </View>
    <Text style={styles.smallTitle}>{title}</Text>
    <Text style={styles.smallValue}>{value}</Text>
    <Text style={styles.smallSubtitle}>{subtitle}</Text>
    <View style={styles.progressTrack}>
      <View
        style={[
          styles.progressFill,
          { width: `${percent}%`, backgroundColor: color },
        ]}
      />
    </View>
    <Text style={styles.percentText}>{percent}%</Text>
  </Pressable>
);

export default SmallMetricCard;

const styles = StyleSheet.create({
  smallCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },

  smallIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },

  smallTitle: {
    marginTop: 8,
    fontSize: 12,
  },

  smallValue: {
    marginTop: 2,
    fontSize: 22,
    color: COLORS.textPrimary,
  },

  smallSubtitle: {
    marginTop: 2,
    fontSize: 11,
    color: COLORS.taguigBlue,
  },

  progressTrack: {
    height: 7,
    borderRadius: 99,
    backgroundColor: "#DCEAFF",
    marginTop: 10,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 99,
  },

  percentText: {
    marginTop: 4,
    fontSize: 10,
    color: COLORS.textSecondary,
  },
});
