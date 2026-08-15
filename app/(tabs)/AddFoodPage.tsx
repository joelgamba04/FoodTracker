// app/AddFoodPage.tsx

import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { useFoodLog } from "@/context/FoodLogContext";
import { useNutrition } from "@/hooks/useNutrition";
import { isApiError } from "@/lib/apiClient";
import { mapFoodDetailToFoodItem } from "@/mappers/foodMapper";
import { FoodItem } from "@/models/models";
import { searchFoods } from "@/services/foodSearchService";
import { COLORS } from "@/theme/color";

const isDevMode = __DEV__;

const makeLocalId = () => {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const SearchBox = ({ search, setSearch, onSubmit, scan = false }: any) => (
  <View style={styles.searchBox}>
    <Ionicons name="search" size={28} color={COLORS.textPrimary} />

    <TextInput
      value={search}
      onChangeText={setSearch}
      placeholder="Search food or meal"
      placeholderTextColor="#9CA3AF"
      style={styles.searchInput}
      autoCorrect={false}
      autoCapitalize="none"
      returnKeyType="search"
      onSubmitEditing={onSubmit}
    />

    {/* <Ionicons
      name={scan ? "scan-outline" : "chevron-down"}
      size={28}
      color={COLORS.taguigBlue}
    /> */}
  </View>
);

const MealCard = ({ item, index, onPress }: any) => {
  const colors = [COLORS.taguigRed, COLORS.taguigBlue, COLORS.taguigYellow];

  if (isDevMode) {
    console.log("MealCard item:", item);
  }

  return (
    <Pressable style={styles.mealCard} onPress={onPress}>
      <View
        style={[
          styles.mealAccent,
          { backgroundColor: colors[index % colors.length] },
        ]}
      />

      <View style={styles.mealInfo}>
        <Text style={styles.mealTitle} numberOfLines={1}>
          {item?.name ?? "Food"}
        </Text>

        {!!item?.english_name && (
          <Text style={styles.mealPillText}>{item?.english_name ?? ""}</Text>
        )}

        {!!item?.category && (
          <View style={styles.mealPill}>
            <Text style={styles.mealPillText}>{item?.category ?? ""}</Text>
          </View>
        )}

        <View style={styles.mealMetaRow}>
          <Text style={styles.mealMeta}>🔥 {item.calories ?? 100} kcal</Text>
          <Text style={styles.mealDivider}>|</Text>
          <Text style={styles.mealMeta}>
            ⚖️ per {item?.serving?.label ?? "serving"}
          </Text>
        </View>
      </View>

      <Ionicons name="ellipsis-vertical" size={24} color={COLORS.taguigBlue} />
    </Pressable>
  );
};

export const AddFoodPage = () => {
  const { addEntry } = useFoodLog();

  const [selected, setSelected] = useState<FoodItem | null>(null);
  const [qty, setQty] = useState(1);
  const insets = useSafeAreaInsets();

  const [results, setResults] = useState<FoodItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const searchSequence = useRef(0); // to track latest search
  const [pauseAutoSearch, setPauseAutoSearch] = useState(false); // to pause auto-search when error is encountered

  const hasQuery = search.trim().length > 0;
  const compactMode = hasQuery || !!selected;

  const [useGrams, setUseGrams] = useState(false);
  const [grams, setGrams] = useState<number>(100);

  const canLog = !!selected && (!useGrams || (useGrams && grams > 0));
  const [isFocused, setIsFocused] = useState(false);

  const formatServing = (value: number) => {
    if (value === 0.5) return "½";
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  };

  const nutrientSummary = useNutrition(selected, qty, useGrams, grams);
  useEffect(() => {
    if (pauseAutoSearch) return;

    const q = search.trim();
    if (!q) {
      setResults([]);
      setSearchError(null);
      return;
    }

    const t = setTimeout(() => {
      handleSearch(q);
    }, 350);

    return () => clearTimeout(t);
  }, [search, pauseAutoSearch]);

  const onLog = async () => {
    if (!selected) return;

    try {
      await addEntry({
        localId: makeLocalId(),
        timestamp: Date.now(),
        food: selected,
        quantity: qty,
        syncStatus: "pending",
        lastSyncError: null,
        mealType: 1, // TODO: add a picker for mealType later (Breakfast/Lunch/Dinner)
        useGrams,
        grams,
        nutrientSummary,
      });

      // Reset state after logging
      setSelected(null);
      setSearch("");
      setQty(1);
      setUseGrams(false);
      setGrams(100);

      router.back();
    } catch (error) {
      console.error("Error logging food entry:", {
        name: (error as any)?.name,
        message: (error as any)?.message,
        kind: isApiError(error) ? error.kind : undefined,
        status: isApiError(error) ? error.status : undefined,
        body: isApiError(error) ? error.body : undefined,
      });
      alert("Failed to log food entry. Please try again later.");
    }
  };

  const handleSearch = async (raw: string) => {
    const query = (raw ?? search).trim();
    if (!query) {
      setResults([]);
      setSearchError(null);
      return;
    }

    const seq = ++searchSequence.current; // increment sequence for this search

    setSearchLoading(true);
    setSearchError(null);

    try {
      const res = await searchFoods(query);
      if (isDevMode) {
        console.log("Search response:", res);
      }

      if (seq !== searchSequence.current) {
        // A newer search has started, ignore this result
        return;
      }

      if (!res.success) {
        setResults([]);
        setSearchError(res.message || "No results found.");
        return;
      }

      const foods = (res.data ?? []).map(mapFoodDetailToFoodItem);
      setResults(foods);
      setPauseAutoSearch(false); // reset pause on successful search
    } catch (err: unknown) {
      if (seq !== searchSequence.current) return;

      console.error("Search failed:", {
        name: (err as any)?.name,
        message: (err as any)?.message,
        kind: isApiError(err) ? err.kind : undefined,
        status: isApiError(err) ? err.status : undefined,
        body: isApiError(err) ? err.body : undefined,
      });

      if (isApiError(err)) {
        switch (err.kind) {
          case "NETWORK":
            setSearchError(
              "No internet connection or server unreachable. Please connect to the internet and try again later.",
            );
            setPauseAutoSearch(true);
            break;

          case "TIMEOUT":
            setSearchError("Search timed out. Please try again.");
            break;

          case "SERVER_ERROR":
            setSearchError(
              "Server error. Please contact support or try again later.",
            );
            setPauseAutoSearch(true);
            break;
          case "SERVER_UNAVAILABLE":
            setSearchError(
              "Server is temporarily unavailable. Please contact support or try again later.",
            );
            setPauseAutoSearch(true);
            break;

          case "BAD_REQUEST":
            setSearchError(err.message || "Invalid search request.");
            break;
          case "UNAUTHORIZED":
            setSearchError("Your session expired. Please log in again.");
            setPauseAutoSearch(true);
            break;

          case "FORBIDDEN":
            setSearchError("You do not have permission to search food items.");
            setPauseAutoSearch(true);
            break;

          case "NOT_FOUND":
            setSearchError("Search endpoint was not found.");
            setPauseAutoSearch(true);
            break;

          case "VALIDATION_ERROR":
            setSearchError(err.message || "Invalid search query.");
            break;

          case "TOO_MANY_REQUESTS":
            setSearchError("Too many searches. Please wait and try again.");
            setPauseAutoSearch(true);
            break;

          default:
            setSearchError(err.message || "Search failed. Please try again.");
            break;
        }
      } else {
        setSearchError("Search failed. Please try again.");
      }

      setResults([]);
    } finally {
      if (seq === searchSequence.current) {
        setSearchLoading(false);
      }
    }
  };

  // TODO: move to utils
  // helper to remove non-digit characters and non-negative numbers
  const handleTextInputChange = (text: string) => {
    // Remove any non-digit characters
    let sanitized = text.replace(/[^0-9.]/g, "");

    // Prevent multiple dots
    const parts = sanitized.split(".");
    if (parts.length > 2) {
      sanitized = parts[0] + "." + parts[1];
    }

    // Prevent negative
    if (sanitized.startsWith("-")) sanitized = sanitized.slice(1);

    setGrams(Number(sanitized) || 0);
  };

  const handleSearchChange = (text: string) => {
    // As soon as the user starts another search, leave the selected-food view
    // and show the search state/results immediately.
    if (selected) {
      setSelected(null);
      setQty(1);
      setUseGrams(false);
      setGrams(100);
    }

    setSearch(text);
    setPauseAutoSearch(false);
    setSearchError(null);
  };

  return (
    <ImageBackground
      source={require("../../assets/images/foodlogbg.png")}
      style={styles.bg}
      resizeMode="cover"
    >
      <SafeAreaView style={[styles.screen, { paddingBottom: insets.bottom }]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.topArea}>
            <View
              style={compactMode ? styles.compactHeader : styles.fullHeader}
            >
              <Pressable
                style={styles.backBtn}
                onPress={() => {
                  if (selected) {
                    setSelected(null);
                    return;
                  }

                  router.back();
                }}
              >
                <Ionicons
                  name="arrow-back"
                  size={24}
                  color={COLORS.taguigBlue}
                />
              </Pressable>

              {!compactMode && (
                <>
                  <View style={styles.logoPlaceholder}>
                    <Image
                      source={require("../../assets/images/nutrition_logo.png")}
                      style={styles.logo}
                      resizeMode="contain"
                    />
                  </View>

                  <Text style={styles.pageTitle}>
                    <Text style={styles.red}>Log </Text>
                    <Text style={styles.blue}>Your </Text>
                    <Text style={styles.yellow}>Meal</Text>
                  </Text>

                  <View style={styles.titleLines}>
                    <View
                      style={[
                        styles.line,
                        { backgroundColor: COLORS.taguigRed },
                      ]}
                    />
                    <View
                      style={[
                        styles.line,
                        { backgroundColor: COLORS.taguigBlue },
                      ]}
                    />
                    <View
                      style={[
                        styles.line,
                        { backgroundColor: COLORS.taguigYellow },
                      ]}
                    />
                  </View>
                </>
              )}

              <View style={compactMode && styles.searchHeaderInput}>
                <SearchBox
                  search={search}
                  setSearch={handleSearchChange}
                  onSubmit={() => {
                    setPauseAutoSearch(false);
                    handleSearch(search);
                  }}
                  scan={!!selected}
                />
              </View>
            </View>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            {!selected && (
              <>
                {/* <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Recent Meals</Text>
                   <Text style={styles.viewAll}>View All ›</Text> 
                </View> */}

                {search.trim().length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.muted}>
                      Search food or meal to begin.
                    </Text>
                  </View>
                ) : searchLoading ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.muted}>Searching…</Text>
                  </View>
                ) : searchError ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.errorText}>{searchError}</Text>

                    <Pressable
                      style={styles.retryBtn}
                      disabled={searchLoading}
                      onPress={() => {
                        setPauseAutoSearch(false);
                        handleSearch(search);
                      }}
                    >
                      <Text style={styles.retryBtnText}>Retry</Text>
                    </Pressable>
                  </View>
                ) : results.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.muted}>No results found.</Text>
                  </View>
                ) : (
                  results.map((item, index) => (
                    <MealCard
                      key={String(item.id)}
                      item={item}
                      index={index}
                      onPress={() => {
                        setSelected(item);
                        setQty(1);
                      }}
                    />
                  ))
                )}
              </>
            )}

            {!!selected && (
              <>
                <View style={styles.foodDetailCard}>
                  <Text style={styles.foodTitle}>
                    <Text style={styles.darkText}>
                      {selected?.name ?? selected?.name ?? "Food"}
                    </Text>
                  </Text>
                  {!!selected?.english_name &&
                    selected.english_name !== selected.name && (
                      <Text style={styles.foodsubtitle}>
                        {selected.english_name}
                      </Text>
                    )}

                  {!!selected?.category && (
                    <View style={styles.categoryPill}>
                      <Text style={styles.foodsubtitle}>
                        {selected.category}
                      </Text>
                    </View>
                  )}

                  <View style={{ flexDirection: "row", marginVertical: 12 }}>
                    <Pressable onPress={() => setUseGrams(false)}>
                      <Text
                        style={{
                          fontWeight: !useGrams ? "bold" : "normal",
                          color: !useGrams
                            ? COLORS.taguigBlue
                            : COLORS.textSecondaryDark,
                        }}
                      >
                        Per{" "}
                        {!!selected?.serving?.label
                          ? selected.serving.label
                          : "serving"}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => setUseGrams(true)}
                      style={{ marginLeft: 20 }}
                    >
                      <Text
                        style={{
                          fontWeight: useGrams ? "bold" : "normal",
                          color: useGrams
                            ? COLORS.taguigBlue
                            : COLORS.textSecondaryDark,
                        }}
                      >
                        By Grams
                      </Text>
                    </Pressable>
                  </View>
                  {useGrams ? (
                    <TextInput
                      value={String(grams)}
                      keyboardType="numeric"
                      onChangeText={handleTextInputChange}
                      style={[styles.input, isFocused && styles.inputFocused]}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                    />
                  ) : (
                    <>
                      <View style={styles.sliderRow}>
                        <Text style={styles.sliderEdge}>½</Text>

                        <Slider
                          style={styles.slider}
                          minimumValue={0.5}
                          maximumValue={10}
                          step={0.5}
                          value={qty}
                          minimumTrackTintColor={COLORS.taguigBlue}
                          maximumTrackTintColor="#E5E7EB"
                          thumbTintColor={COLORS.taguigRed}
                          onValueChange={setQty}
                        />

                        <Text style={styles.sliderEdge}>10</Text>
                      </View>

                      <View style={styles.servingBadge}>
                        <Ionicons
                          name="fast-food-outline"
                          size={28}
                          color="#FFFFFF"
                        />
                        <Text style={styles.servingBadgeText}>
                          {" "}
                          {formatServing(qty)}
                          {" x "}
                          {selected?.serving?.label ?? "serving"}
                        </Text>
                      </View>
                    </>
                  )}
                  <View style={styles.summaryBox}>
                    <Text style={styles.summaryTitle}>This will add</Text>

                    <View style={styles.summaryGrid}>
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryValue}>
                          {nutrientSummary.calories}
                        </Text>
                        <Text style={styles.summaryLabel}>kcal</Text>
                      </View>

                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryValue}>
                          {nutrientSummary.carbs}g
                        </Text>
                        <Text style={styles.summaryLabel}>Carbs</Text>
                      </View>

                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryValue}>
                          {nutrientSummary.protein}g
                        </Text>
                        <Text style={styles.summaryLabel}>Protein</Text>
                      </View>

                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryValue}>
                          {nutrientSummary.fat}g
                        </Text>
                        <Text style={styles.summaryLabel}>Fat</Text>
                      </View>
                    </View>
                  </View>
                  <Pressable
                    style={[styles.addMealBtn, !canLog && { opacity: 0.5 }]}
                    disabled={!canLog}
                    onPress={onLog}
                  >
                    <Text style={styles.addMealText}>Add Meal</Text>
                  </Pressable>
                </View>
              </>
            )}

            <View style={{ height: 90 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },

  bg: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  screen: {
    flex: 1,
    backgroundColor: "transparent",
  },

  content: {
    paddingHorizontal: 28,
    paddingTop: 18,
  },

  backBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },

  topArea: {
    paddingHorizontal: 28,
    paddingTop: 18,
  },

  fullHeader: {},

  compactHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  searchHeaderInput: {
    flex: 1,
  },

  logoPlaceholder: {
    alignSelf: "center",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -6,
  },

  logo: {
    width: 120,
    height: 120,
  },

  logoText: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.taguigBlue,
  },

  pageTitle: {
    marginTop: 12,
    textAlign: "center",
    fontSize: 40,
    fontWeight: "900",
  },

  red: {
    color: COLORS.taguigRed,
    fontWeight: "900",
  },

  blue: {
    color: COLORS.taguigBlue,
    fontWeight: "900",
  },

  yellow: {
    color: COLORS.taguigYellow,
    fontWeight: "900",
  },

  darkText: {
    color: COLORS.textPrimary,
    fontWeight: "900",
  },

  titleLines: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 7,
    marginTop: 10,
    marginBottom: 14,
  },

  line: {
    width: 54,
    height: 5,
    borderRadius: 99,
  },

  subtitle: {
    textAlign: "center",
    fontSize: 21,
    lineHeight: 28,
    fontWeight: "700",
    color: COLORS.textSecondary,
    marginBottom: 28,
  },

  searchBox: {
    minHeight: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: COLORS.taguigBlue,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 22,
    gap: 14,
    shadowColor: COLORS.taguigBlue,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 22,
  },

  searchInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },

  sectionHeader: {
    marginTop: 34,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sectionTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },

  viewAll: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.taguigBlue,
  },

  mealCard: {
    minHeight: 132,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    marginBottom: 20,
    padding: 14,
    paddingLeft: 20,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },

  mealAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 8,
  },

  mealImagePlaceholder: {
    width: 104,
    height: 104,
    borderRadius: 14,
    backgroundColor: "#EEF2F7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },

  placeholderText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#9CA3AF",
  },

  mealInfo: {
    flex: 1,
  },

  mealTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },

  mealPill: {
    alignSelf: "flex-start",
    marginTop: 10,
    backgroundColor: "#FFF2CC",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
  },

  mealPillText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },

  mealMetaRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  mealMeta: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },

  mealDivider: {
    color: "#CBD5E1",
    fontWeight: "900",
  },

  foodDetailCard: {
    marginTop: 18,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    padding: 26,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },

  foodTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },

  foodsubtitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.textSecondary,
  },

  categoryPill: {
    alignSelf: "flex-start",
    marginTop: 14,
    marginBottom: 26,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF5D6",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 99,
  },

  categoryText: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },

  fieldLabel: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#CED4DA",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: COLORS.textPrimary,
    backgroundColor: "#F8F9FA",
  },
  inputFocused: {
    borderColor: COLORS.taguigBlue, // Blue border on focus
    backgroundColor: "#FFFFFF", // White background when focused
  },
  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  slider: {
    flex: 1,
    height: 44,
  },

  sliderEdge: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.textSecondary,
  },

  nutrientBox: {
    marginTop: 18,
    borderRadius: 16,
    backgroundColor: "#EAF2FF",
    padding: 14,
  },

  nutrientTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.taguigBlue,
    marginBottom: 12,
  },

  nutrientGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  nutrientItem: {
    alignItems: "center",
    flex: 1,
  },

  nutrientValue: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },

  nutrientLabel: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },

  sliderLine: {
    flex: 1,
    height: 6,
    borderRadius: 99,
    backgroundColor: "#E5E7EB",
    position: "relative",
  },

  sliderActiveLine: {
    width: "45%",
    height: "100%",
    borderRadius: 99,
    backgroundColor: COLORS.taguigBlue,
  },

  sliderThumb: {
    position: "absolute",
    left: "42%",
    top: -20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.taguigRed,
    alignItems: "center",
    justifyContent: "center",
  },

  sliderThumbText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },

  servingBadge: {
    alignSelf: "center",
    marginTop: 34,
    marginBottom: 24,
    width: 130,
    height: 104,
    borderRadius: 14,
    backgroundColor: "#071B52",
    alignItems: "center",
    justifyContent: "center",
  },

  servingBadgeText: {
    marginTop: 6,
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
    paddingHorizontal: 6,
    textAlign: "center",
  },

  noteInputWrap: {
    minHeight: 62,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D8DDEA",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },

  noteInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },

  summaryBox: {
    marginTop: 18,
    borderRadius: 16,
    backgroundColor: "#EAF2FF",
    padding: 14,
  },

  summaryTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.taguigBlue,
    marginBottom: 12,
  },

  summaryGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  summaryItem: {
    flex: 1,
    alignItems: "center",
  },

  summaryValue: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },

  summaryLabel: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },

  addMealBtn: {
    marginTop: 24,
    height: 68,
    borderRadius: 12,
    backgroundColor: COLORS.taguigRed,
    alignItems: "center",
    justifyContent: "center",
  },

  addMealText: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  didYouKnow: {
    marginTop: 20,
    borderRadius: 14,
    backgroundColor: "#EAF2FF",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  lightBulb: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  didTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.taguigBlue,
  },

  didText: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },

  smallFoodPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  muted: {
    color: COLORS.textSecondary,
    fontWeight: "700",
  },

  errorText: {
    color: COLORS.dangerRed,
    fontWeight: "800",
    marginBottom: 10,
  },

  retryBtn: {
    alignSelf: "flex-start",
    borderRadius: 12,
    backgroundColor: COLORS.taguigBlue,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  retryBtnText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
});

export default AddFoodPage;
