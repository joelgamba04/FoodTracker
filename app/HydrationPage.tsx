// app/HydrationPage.tsx

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import ProgressRing from "@/components/ProgressRing";
import { useHydration } from "@/context/hydrationContext";
import { COLORS } from "@/theme/color";
import { getTodayWindow } from "@/utils/date";

const glassMap = {
  250: require("../assets/images/water/glass_outline.png"),
  500: require("../assets/images/water/glass_partial.png"),
  750: require("../assets/images/water/glass_full.png"),
  1000: require("../assets/images/water/bottle.png"),
};

export const HydrationPage = () => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [showCustomInput, setShowCustomInput] = useState(false);
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
    <ImageBackground
      source={require("../assets/images/foodlogbg.png")}
      style={styles.bg}
      resizeMode="cover"
    >
      <SafeAreaView style={[styles.screen, { paddingBottom: insets.bottom }]}>
        <View style={styles.topBar}>
          <Pressable style={styles.circleBtn} onPress={() => router.back()}>
            <Ionicons
              name="chevron-back"
              size={28}
              color={COLORS.textPrimary}
            />
          </Pressable>
        </View>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.hero}>
            <View style={styles.heroText}>
              <Text style={styles.title}>
                <Text style={styles.blue}>Water </Text>
                <Text style={styles.red}>Intake</Text>
              </Text>
              <Text style={styles.subtitle}>Stay hydrated, stay healthy!</Text>
            </View>

            <Image
              source={require("../assets/images/water/real_glass.png")}
              style={[
                styles.waterImage,
                {
                  width: width * 0.42,
                  height: width * 0.63,
                  right: -width * 0.04,
                  bottom: -width * 0.18,
                },
              ]}
              resizeMode="contain"
            />
          </View>

          <View style={styles.progressCard}>
            <View style={styles.progressLeft}>
              <Text style={styles.cardTitle}>Today's Progress</Text>
              <Text style={styles.liters}>{(totalMl / 1000).toFixed(1)} L</Text>
              <Text style={styles.goalText}>of 2.5 L goal</Text>

              <View style={styles.goalPill}>
                <Ionicons name="water" size={15} color={COLORS.taguigBlue} />
                <Text style={styles.goalPillText}>
                  {Math.round((totalMl / 2500) * 100)}% of daily goal
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <ProgressRing
              percent={(totalMl / 2500) * 100}
              color={COLORS.taguigBlue}
            />
          </View>

          <Text style={styles.sectionTitle}>Quick Add</Text>

          <View style={styles.quickRow}>
            {[250, 500, 750, 1000].map((ml) => (
              <Pressable
                key={ml}
                style={styles.quickCard}
                onPress={() => addMl(ml)}
              >
                <Image
                  source={glassMap[ml as keyof typeof glassMap]}
                  style={styles.glassImage}
                  resizeMode="contain"
                />

                <Text style={styles.quickText}>
                  {ml === 1000 ? "1 L" : `${ml} ml`}
                </Text>
              </Pressable>
            ))}

            <Pressable
              style={[
                styles.quickCard,
                showCustomInput && styles.quickCardActive,
              ]}
              onPress={() => setShowCustomInput((prev) => !prev)}
            >
              <Ionicons
                name="create-outline"
                size={32}
                color={COLORS.taguigBlue}
              />
              <Text style={styles.quickText}>Custom</Text>
            </Pressable>
          </View>

          {showCustomInput && (
            <View style={styles.customRow}>
              <TextInput
                value={customMl}
                onChangeText={setCustomMl}
                placeholder="Enter amount in ml"
                keyboardType="numeric"
                style={styles.customInput}
              />

              <Pressable
                style={[styles.addBtn, !canAddCustom && { opacity: 0.4 }]}
                disabled={!canAddCustom}
                onPress={handleAddCustom}
              >
                <Text style={styles.addBtnText}>Add</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.logHeader}>
            <Text style={styles.sectionTitle}>Today's Log</Text>
            <Text style={styles.editText}>Edit</Text>
          </View>

          <View style={styles.logCard}>
            {isLoading ? (
              <Text style={styles.muted}>Loading...</Text>
            ) : todayEntries.length === 0 ? (
              <Text style={styles.muted}>No water entries yet today.</Text>
            ) : (
              todayEntries.map((e) => (
                <View key={e.id} style={styles.logRow}>
                  <View style={styles.logIcon}>
                    <Ionicons
                      name="water"
                      size={22}
                      color={COLORS.taguigBlue}
                    />
                  </View>

                  <Text style={styles.logTime}>
                    {new Date(e.timestamp).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </Text>

                  <Text style={styles.logAmount}>{e.amount_ml} ml</Text>

                  <Pressable
                    style={styles.checkIcon}
                    onPress={() => removeEntry(e.id)}
                  >
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={COLORS.taguigBlue}
                    />
                  </Pressable>
                </View>
              ))
            )}
          </View>

          <Image
            source={require("../assets/images/water/bottom_banner.png")}
            style={[
              styles.banner,
              {
                width: width * 0.92,
                height: width * 0.38,
              },
            ]}
            resizeMode="contain"
          />

          <View style={{ height: 110 }} />
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};

export default HydrationPage;

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  screen: {
    flex: 1,
    backgroundColor: "transparent",
  },

  content: {
    paddingHorizontal: 22,
  },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  circleBtn: {
    marginLeft: 18,
    marginTop: 18,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  hero: {
    width: "100%",
    minHeight: 185,
    marginTop: 34,
    justifyContent: "center",
    position: "relative",
    overflow: "visible",
  },

  heroText: {
    zIndex: 3,
    maxWidth: "64%",
  },

  title: {
    fontSize: 38,
    fontWeight: "900",
  },

  subtitle: {
    marginTop: 8,
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },

  waterImage: {
    position: "absolute",
    zIndex: 2,
  },

  blue: {
    color: COLORS.taguigBlue,
  },

  red: {
    color: COLORS.taguigRed,
  },

  progressCard: {
    marginTop: -10,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    padding: 22,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
    zIndex: 3,
  },

  progressLeft: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },

  liters: {
    marginTop: 20,
    fontSize: 52,
    fontWeight: "900",
    color: COLORS.taguigBlue,
  },

  goalText: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },

  goalPill: {
    marginTop: 20,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EAF2FF",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  goalPillText: {
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.taguigBlue,
  },

  divider: {
    width: 1,
    height: 120,
    backgroundColor: "#EEF1F7",
    marginHorizontal: 20,
  },

  circleProgress: {
    width: 138,
    height: 138,
    borderRadius: 69,
    borderWidth: 10,
    borderColor: COLORS.taguigBlue,
    alignItems: "center",
    justifyContent: "center",
  },

  sectionTitle: {
    marginTop: 28,
    marginBottom: 14,
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },

  quickRow: {
    flexDirection: "row",
    gap: 12,
  },

  quickCard: {
    flex: 1,
    minHeight: 96,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EEF1F7",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  quickCardActive: {
    borderColor: COLORS.taguigBlue,
    borderWidth: 2,
  },

  quickText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },

  glassImage: {
    width: 32,
    height: 48,
    resizeMode: "contain",
  },

  customRow: {
    marginTop: 16,
    flexDirection: "row",
    gap: 10,
  },

  customInput: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D8DDEA",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },

  addBtn: {
    width: 92,
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.taguigBlue,
    alignItems: "center",
    justifyContent: "center",
  },

  addBtnText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 15,
  },

  logHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  editText: {
    marginTop: 28,
    marginBottom: 14,
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.taguigBlue,
  },

  logCard: {
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },

  logRow: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF1F7",
  },

  logIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#EAF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },

  logTime: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },

  logAmount: {
    flex: 1,
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },

  checkIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#EAF2FF",
    alignItems: "center",
    justifyContent: "center",
  },

  banner: {
    marginTop: 18,
    marginBottom: 24,
    alignSelf: "center",
  },

  muted: {
    padding: 18,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
});
