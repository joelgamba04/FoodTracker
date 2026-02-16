// app/(tabs)/hydration.tsx

import { router } from "expo-router";
import React, { useMemo } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useHydration } from "@/context/hydrationContext";
import { getTodayWindow } from "@/utils/date";

export default function HydrationScreen() {
  const insets = useSafeAreaInsets();
  const { entries, addMl, removeEntry, isLoading } = useHydration();

  const { start, end } = getTodayWindow();
  const startMs = start.getTime();
  const endMs = end.getTime();

  const todayEntries = useMemo(() => {
    return entries.filter((e) => e.timestamp >= startMs && e.timestamp < endMs);
  }, [entries, startMs, endMs]);

  const totalMl = useMemo(() => {
    return todayEntries.reduce((sum, e) => sum + e.amount_ml, 0);
  }, [todayEntries]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Water</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Today</Text>
        <Text style={styles.totalValue}>{totalMl} ml</Text>
      </View>

      <View style={styles.quickRow}>
        <TouchableOpacity style={styles.quickBtn} onPress={() => addMl(250)}>
          <Text style={styles.quickText}>+250</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickBtn} onPress={() => addMl(350)}>
          <Text style={styles.quickText}>+350</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickBtn} onPress={() => addMl(500)}>
          <Text style={styles.quickText}>+500</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <Text style={styles.sectionTitle}>Entries</Text>

        {isLoading ? (
          <Text style={styles.muted}>Loading...</Text>
        ) : todayEntries.length === 0 ? (
          <Text style={styles.muted}>No water entries yet today.</Text>
        ) : (
          todayEntries.map((e) => (
            <View key={e.id} style={styles.entryRow}>
              <Text style={styles.entryText}>
                {e.amount_ml} ml • {new Date(e.timestamp).toLocaleTimeString()}
              </Text>
              <TouchableOpacity onPress={() => removeEntry(e.id)}>
                <Text style={styles.delete}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  back: { fontSize: 16 },
  title: { fontSize: 18, fontWeight: "700" },

  totalCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  totalLabel: { fontSize: 12, opacity: 0.7 },
  totalValue: { fontSize: 28, fontWeight: "800", marginTop: 6 },

  quickRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  quickBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  quickText: { fontWeight: "700" },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 6,
  },
  muted: { opacity: 0.65 },

  entryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  entryText: { fontSize: 14 },
  delete: { fontSize: 14, fontWeight: "700" },
});
