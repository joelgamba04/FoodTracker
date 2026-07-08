// app/HydrationPage.tsx

import { Ionicons } from "@expo/vector-icons";
import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
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
import { useProfile } from "@/context/ProfileContext";
import { COLORS } from "@/theme/color";
import { getTodayWindow } from "@/utils/date";

const glassMap = {
  250: require("../assets/images/water/glass_outline.png"),
  500: require("../assets/images/water/glass_partial.png"),
  750: require("../assets/images/water/glass_full.png"),
  1000: require("../assets/images/water/bottle.png"),
};

const QUICK_ADD_AMOUNTS = [250, 500, 750, 1000] as const;

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

const formatLiters = (ml: number) => {
  return (ml / 1000).toFixed(1);
};

export const HydrationPage = () => {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { rdi } = useProfile();
  const { entries, addMl, removeEntry, isLoading } = useHydration();

  const screenPadding = width < 360 ? 16 : 22;
  const contentMaxWidth = 430;
  const contentWidth = Math.min(width - screenPadding * 2, contentMaxWidth);

  const isSmallPhone = width < 380 || height < 700;
  const isVerySmallPhone = width < 340;
  const isWideScreen = width >= 768;

  const quickCardGap = isSmallPhone ? 10 : 12;
  const quickCardColumns = isWideScreen ? 5 : isVerySmallPhone ? 2 : 3;
  const quickCardWidth =
    (contentWidth - quickCardGap * (quickCardColumns - 1)) / quickCardColumns;

  const waterRDI = useMemo(() => {
    const amount = rdi?.Water?.amount;
    return typeof amount === "number" && Number.isFinite(amount) && amount > 0
      ? amount
      : 2530;
  }, [rdi]);

  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customMl, setCustomMl] = useState("");

  const { start, end } = useMemo(() => getTodayWindow(), []);
  const startMs = start.getTime();
  const endMs = end.getTime();

  const todayEntries = useMemo(() => {
    return entries.filter((e) => e.timestamp >= startMs && e.timestamp < endMs);
  }, [entries, startMs, endMs]);

  const totalMl = useMemo(() => {
    return todayEntries.reduce((sum, e) => sum + (e.amount_ml ?? 0), 0);
  }, [todayEntries]);

  const progressPercent = useMemo(() => {
    return Math.round((totalMl / waterRDI) * 100);
  }, [totalMl, waterRDI]);

  const ringPercent = clamp(progressPercent, 0, 100);

  const parsedCustomMl = useMemo(() => {
    // allow "250" / "250.5" but store integer ml
    const n = Number(customMl.replace(",", "."));
    if (!Number.isFinite(n)) return null;
    return Math.round(n);
  }, [customMl]);

  const canAddCustom = parsedCustomMl !== null && parsedCustomMl > 0;

  const handleAddQuick = useCallback(
    async (ml: number) => {
      await addMl(ml);
    },
    [addMl],
  );

  const handleAddCustom = useCallback(async () => {
    if (!canAddCustom || parsedCustomMl === null) return;

    // Prevent accidental entries like 50000 ml.
    if (parsedCustomMl > 5000) return;

    await addMl(parsedCustomMl);
    setCustomMl("");
    setShowCustomInput(false);
  }, [addMl, canAddCustom, parsedCustomMl]);

  return (
    <ImageBackground
      source={require("../assets/images/foodlogbg.png")}
      style={styles.bg}
      resizeMode="cover"
    >
      <SafeAreaView
        style={[styles.screen, { paddingBottom: insets.bottom }]}
        edges={["top", "left", "right"]}
      >
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.topBar}>
            <Pressable
              style={({ pressed }) => [
                styles.circleBtn,
                pressed && styles.pressed,
              ]}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={8}
            >
              <Ionicons
                name="chevron-back"
                size={26}
                color={COLORS.textPrimary}
              />
            </Pressable>
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.content,
              {
                paddingHorizontal: screenPadding,
                paddingBottom: 120 + insets.bottom,
              },
            ]}
          >
            <View style={[styles.contentInner, { maxWidth: contentMaxWidth }]}>
              <View
                style={[
                  styles.hero,
                  {
                    minHeight: isSmallPhone ? 126 : 168,
                    marginTop: isSmallPhone ? 8 : 18,
                  },
                ]}
              >
                <View
                  style={[
                    styles.heroText,
                    { maxWidth: isSmallPhone ? "62%" : "66%" },
                  ]}
                >
                  <Text
                    style={[styles.title, { fontSize: isSmallPhone ? 26 : 34 }]}
                    numberOfLines={2}
                    adjustsFontSizeToFit
                    minimumFontScale={0.82}
                  >
                    <Text style={styles.blue}>Water </Text>
                    <Text style={styles.red}>Intake</Text>
                  </Text>

                  <Text
                    style={[
                      styles.subtitle,
                      { fontSize: isSmallPhone ? 12 : 15 },
                    ]}
                    numberOfLines={2}
                  >
                    Stay hydrated, stay healthy!
                  </Text>
                </View>

                <Image
                  source={require("../assets/images/water/real_glass.png")}
                  style={[
                    styles.waterImage,
                    {
                      width: isSmallPhone
                        ? contentWidth * 0.34
                        : contentWidth * 0.42,
                      height: isSmallPhone
                        ? contentWidth * 0.48
                        : contentWidth * 0.62,
                      right: isSmallPhone ? -4 : -18,
                      bottom: isSmallPhone ? -8 : -42,
                    },
                  ]}
                  resizeMode="contain"
                />
              </View>

              <View
                style={[
                  styles.progressCard,
                  {
                    padding: isSmallPhone ? 16 : 22,
                    flexDirection: isVerySmallPhone ? "column" : "row",
                    alignItems: isVerySmallPhone ? "stretch" : "center",
                  },
                ]}
              >
                <View style={styles.progressLeft}>
                  <Text
                    style={[
                      styles.cardTitle,
                      { fontSize: isSmallPhone ? 18 : 20 },
                    ]}
                  >
                    Today's Progress
                  </Text>

                  <Text
                    style={[
                      styles.liters,
                      { fontSize: isSmallPhone ? 40 : 52 },
                    ]}
                    adjustsFontSizeToFit
                    numberOfLines={1}
                  >
                    {formatLiters(totalMl)} L
                  </Text>

                  <Text style={styles.goalText}>
                    of {formatLiters(waterRDI)} L goal
                  </Text>

                  <View style={styles.goalPill}>
                    <Ionicons
                      name="water"
                      size={15}
                      color={COLORS.taguigBlue}
                    />
                    <Text style={styles.goalPillText}>
                      {progressPercent}% of daily goal
                    </Text>
                  </View>
                </View>

                {!isVerySmallPhone && <View style={styles.divider} />}

                <View
                  style={[
                    styles.ringWrap,
                    isVerySmallPhone && styles.ringWrapStacked,
                  ]}
                >
                  <ProgressRing
                    percent={ringPercent}
                    color={COLORS.taguigBlue}
                  />
                </View>
              </View>

              <Text style={styles.sectionTitle}>Quick Add</Text>

              <View style={[styles.quickRow, { gap: quickCardGap }]}>
                {QUICK_ADD_AMOUNTS.map((ml) => (
                  <Pressable
                    key={ml}
                    style={({ pressed }) => [
                      styles.quickCard,
                      {
                        width: quickCardWidth,
                        minHeight: isSmallPhone ? 88 : 98,
                      },
                      pressed && styles.pressed,
                    ]}
                    onPress={() => handleAddQuick(ml)}
                    accessibilityRole="button"
                    accessibilityLabel={`Add ${ml} ml of water`}
                  >
                    <Image
                      source={glassMap[ml]}
                      style={[
                        styles.glassImage,
                        {
                          width: isSmallPhone ? 28 : 32,
                          height: isSmallPhone ? 42 : 48,
                        },
                      ]}
                      resizeMode="contain"
                    />

                    <Text style={styles.quickText}>
                      {ml === 1000 ? "1 L" : `${ml} ml`}
                    </Text>
                  </Pressable>
                ))}

                <Pressable
                  style={({ pressed }) => [
                    styles.quickCard,
                    {
                      width: quickCardWidth,
                      minHeight: isSmallPhone ? 88 : 98,
                    },
                    showCustomInput && styles.quickCardActive,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => setShowCustomInput((prev) => !prev)}
                  accessibilityRole="button"
                  accessibilityLabel="Add custom water amount"
                >
                  <Ionicons
                    name="create-outline"
                    size={isSmallPhone ? 28 : 32}
                    color={COLORS.taguigBlue}
                  />
                  <Text style={styles.quickText}>Custom</Text>
                </Pressable>
              </View>

              {showCustomInput && (
                <View
                  style={[
                    styles.customRow,
                    { flexDirection: isVerySmallPhone ? "column" : "row" },
                  ]}
                >
                  <TextInput
                    value={customMl}
                    onChangeText={setCustomMl}
                    placeholder="Enter amount in ml"
                    placeholderTextColor="#8B95A7"
                    keyboardType="numeric"
                    returnKeyType="done"
                    onSubmitEditing={handleAddCustom}
                    style={styles.customInput}
                  />

                  <Pressable
                    style={({ pressed }) => [
                      styles.addBtn,
                      isVerySmallPhone && styles.addBtnFull,
                      !canAddCustom && styles.disabled,
                      pressed && canAddCustom && styles.pressed,
                    ]}
                    disabled={!canAddCustom}
                    onPress={handleAddCustom}
                    accessibilityRole="button"
                    accessibilityLabel="Add custom water amount"
                  >
                    <Text style={styles.addBtnText}>Add</Text>
                  </Pressable>
                </View>
              )}

              <View style={styles.logHeader}>
                <Text style={styles.sectionTitle}>Today's Log</Text>
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

                      <View style={styles.logTextGroup}>
                        <Text style={styles.logTime}>
                          {new Date(e.timestamp).toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </Text>

                        <Text style={styles.logAmount}>{e.amount_ml} ml</Text>
                      </View>

                      <Pressable
                        style={({ pressed }) => [
                          styles.deleteIcon,
                          pressed && styles.pressed,
                        ]}
                        onPress={() => removeEntry(e.id)}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${e.amount_ml} ml entry`}
                        hitSlop={8}
                      >
                        <Feather name="x" size={18} color={COLORS.taguigRed} />
                      </Pressable>
                    </View>
                  ))
                )}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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

  keyboardView: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
  },

  contentInner: {
    width: "100%",
    alignSelf: "center",
  },

  topBar: {
    minHeight: 54,
    justifyContent: "center",
    alignItems: "flex-start",
  },

  circleBtn: {
    width: 48,
    height: 48,
    marginLeft: 18,
    marginTop: 18,
    borderRadius: 24,
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
    justifyContent: "center",
    position: "relative",
    overflow: "visible",
  },

  heroText: {
    zIndex: 3,
  },

  title: {
    fontWeight: "900",
    lineHeight: 38,
  },

  subtitle: {
    marginTop: 8,
    fontWeight: "700",
    color: COLORS.textSecondary,
    lineHeight: 20,
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
    marginTop: -6,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
    zIndex: 3,
  },

  progressLeft: {
    flex: 1,
    minWidth: 0,
  },

  cardTitle: {
    fontWeight: "900",
    color: COLORS.textPrimary,
  },

  liters: {
    marginTop: 14,
    fontWeight: "900",
    color: COLORS.taguigBlue,
  },

  goalText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },

  goalPill: {
    marginTop: 16,
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
    height: 118,
    backgroundColor: "#EEF1F7",
    marginHorizontal: 18,
  },

  ringWrap: {
    alignItems: "center",
    justifyContent: "center",
  },

  ringWrapStacked: {
    marginTop: 18,
  },

  sectionTitle: {
    marginTop: 28,
    marginBottom: 14,
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },

  quickRow: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
  },

  quickCard: {
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
    resizeMode: "contain",
  },

  customRow: {
    marginTop: 16,
    gap: 10,
  },

  customInput: {
    flex: 1,
    minHeight: 52,
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
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: COLORS.taguigBlue,
    alignItems: "center",
    justifyContent: "center",
  },

  addBtnFull: {
    width: "100%",
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
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
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
    marginRight: 14,
  },

  logTextGroup: {
    flex: 1,
    minWidth: 0,
  },

  logTime: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },

  logAmount: {
    marginTop: 3,
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },

  deleteIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FDE8E8",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },

  muted: {
    padding: 18,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },

  disabled: {
    opacity: 0.4,
  },

  pressed: {
    opacity: 0.78,
  },
});
