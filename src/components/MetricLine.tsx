import { COLORS } from "@/theme/color";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

const MetricLine = ({ icon, color, label, value }: any) => (
  <View style={styles.metricLine}>
    <Ionicons name={icon} size={24} color={color} />
    <View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  </View>
);

export default MetricLine;

const styles = StyleSheet.create({
  metricLine: { flexDirection: "row", alignItems: "center", gap: 10 },
  metricLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: "800" },
  metricValue: { fontSize: 15, color: COLORS.textPrimary, fontWeight: "900" },
});
