// app/HydrationPage.tsx

import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import AppHeader from "@/components/AppHeader";
import { useHydration } from "@/context/hydrationContext";
import { COLORS } from "@/theme/color";
import { getTodayWindow } from "@/utils/date";

export const HydrationPage = () => {
  const insets = useSafeAreaInsets();
  const { entries, addMl, removeEntry, isLoading } = useHydration();

  const [customMl, setCustomMl] = useState("");

  const { start, end } = getTodayWindow();
  const startMs = start.getTime();
  const endMs = end.getTime();

  const todayEntries = useMemo(() => {
    return entries.filter((e) => e.timestamp >= startMs && e.timestamp < endMs);
  }, [entries, startMs, endMs]);

  const totalMl = useMemo(() => {
    return todayEntries.reduce((sum, e) => sum + (e.amount_ml ?? 0), 0);
  }, [todayEntries]);

  const parsedCustomMl = useMemo(() => {
    // allow "250" / "250.5" but store integer ml
    const n = Number(customMl.replace(",", "."));
    if (!Number.isFinite(n)) return null;
    return Math.round(n);
  }, [customMl]);

  const canAddCustom = parsedCustomMl !== null && parsedCustomMl > 0;

  const handleAddCustom = async () => {
    if (!canAddCustom || parsedCustomMl === null) return;

    // guardrail (optional)
    if (parsedCustomMl > 5000) return;

    await addMl(parsedCustomMl);
    setCustomMl("");
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: COLORS.background,
        paddingBottom: insets.bottom,
      }}
    >
      {/* Header */}
      <AppHeader title="Water" showBack onBackPress={() => router.back()} />

      <View style={[styles.container]}>
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Today</Text>
          <Text style={styles.totalValue}>{totalMl} ml</Text>
        </View>

        <View style={styles.quickRow}>
          <TouchableOpacity style={styles.quickBtn} onPress={() => addMl(250)}>
            <Text style={styles.quickText}>+250 ml</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => addMl(350)}>
            <Text style={styles.quickText}>+350 ml</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => addMl(500)}>
            <Text style={styles.quickText}>+500 ml</Text>
          </TouchableOpacity>
        </View>

        {/* Custom input */}
        <View style={styles.customRow}>
          <View style={styles.customInputWrap}>
            <Text style={styles.customLabel}>Custom</Text>
            <TextInput
              value={customMl}
              onChangeText={setCustomMl}
              placeholder="e.g. 180"
              keyboardType="numeric"
              inputMode="numeric"
              returnKeyType="done"
              onSubmitEditing={handleAddCustom}
              style={styles.customInput}
            />
            <Text style={styles.customUnit}>ml</Text>
          </View>

          <TouchableOpacity
            style={[styles.customAddBtn, !canAddCustom && { opacity: 0.4 }]}
            disabled={!canAddCustom}
            onPress={handleAddCustom}
          >
            <Text style={styles.customAddText}>Add</Text>
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
                  {e.amount_ml} ml •{" "}
                  {new Date(e.timestamp).toLocaleTimeString()}
                </Text>
                <TouchableOpacity onPress={() => removeEntry(e.id)}>
                  <Text style={styles.delete}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },

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

  // custom input styles
  customRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  customInputWrap: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  customLabel: { fontSize: 12, opacity: 0.7, fontWeight: "700" },
  customInput: { flex: 1, fontSize: 14 },
  customUnit: { fontSize: 12, opacity: 0.7, fontWeight: "700" },
  customAddBtn: {
    width: 90,
    borderRadius: 12,
    borderWidth: 1,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  customAddText: { fontWeight: "800" },

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

export default HydrationPage;
