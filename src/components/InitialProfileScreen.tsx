// src/components/InitialProfileScreen.tsx
import { loadJSON, saveJSON } from "@/lib/storage";
import { defaultProfile, UserProfile } from "@/models/models";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { USER_PROFILE_KEY } from "@/constants/storageKeys";
import { useProfile } from "@/context/ProfileContext";
import { COLORS } from "@/theme/color";
import {
  cmToFtIn,
  ftInToCm,
  kgToLb,
  lbToKg,
} from "@/utils/imperialMetricHelper";
import { InputWithUnit } from "./ui/inputWithUnit";

// UI-only fields shown in the screenshot
type InitialProfileForm = UserProfile & {
  firstName?: string;
  lastName?: string;
};

interface InitialProfileScreenProps {
  onComplete: (profile: UserProfile) => void;
}

const InitialProfileScreen: React.FC<InitialProfileScreenProps> = ({
  onComplete,
}) => {
  const insets = useSafeAreaInsets();

  const [form, setForm] = useState<InitialProfileForm>(defaultProfile as any);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useImperial, setUseImperial] = useState(false);
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [weightLb, setWeightLb] = useState("");

  const ageRef = useRef<TextInput>(null);
  const heightRef = useRef<TextInput>(null);
  const heightFtRef = useRef<TextInput>(null);
  const heightInRef = useRef<TextInput>(null);
  const weightRef = useRef<TextInput>(null);

  const { reloadLocalProfile } = useProfile();

  const scrollRef = useRef<ScrollView>(null);
  const activeField = useRef<string | null>(null);
  let scrollTimeout: any = null;
  const fieldY = useRef<Record<string, number>>({});

  const { width, height } = useWindowDimensions();

  const wp = (percent: number) => width * (percent / 100);
  const hp = (percent: number) => height * (percent / 100);

  // Pre-fill with existing draft if present
  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const stored = await loadJSON<InitialProfileForm>(USER_PROFILE_KEY);
        if (active && stored) {
          setForm({
            ...(defaultProfile as any),
            ...stored,
            age: String((stored as any).age ?? ""),
            height: String((stored as any).height ?? ""),
            weight: String((stored as any).weight ?? ""),
          });
        }
      } catch (e) {
        console.warn("InitialProfileScreen: failed to load stored profile", e);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!useImperial) return;

    const cm = Number(form.height);
    if (Number.isFinite(cm) && cm > 0) {
      const { ft, inches } = cmToFtIn(cm);
      setHeightFt(String(ft));
      setHeightIn(String(inches));
    }
  }, [useImperial, form.height]);

  const handleChange = useCallback(
    (field: keyof InitialProfileForm, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const validate = (profile: InitialProfileForm): string | null => {
    if (!profile.age || !profile.height || !profile.weight) {
      return "Please enter your age, height, and weight.";
    }
    const ageNum = Number(profile.age);
    if (!Number.isFinite(ageNum) || ageNum < 10 || ageNum > 120) {
      return "Please enter a valid age.";
    }
    const hNum = Number(profile.height);
    if (!Number.isFinite(hNum) || hNum <= 0) {
      return "Please enter a valid height.";
    }
    const wNum = Number(profile.weight);
    if (!Number.isFinite(wNum) || wNum <= 0) {
      return "Please enter a valid weight.";
    }
    return null;
  };

  const handleSubmit = async () => {
    const maybeError = validate(form);
    if (maybeError) {
      setError(maybeError);
      return;
    }

    setError(null);
    setSaving(true);

    try {
      // Save the whole form (including optional first/last name) to draft key
      await saveJSON(USER_PROFILE_KEY, form);
      await reloadLocalProfile(); // ensure ProfileContext is in sync with the latest saved profile

      // Call onComplete with required profile type (extra props are harmless at runtime)
      onComplete(form as unknown as UserProfile);
      console.log("InitialProfileScreen: profile saved", form);
    } catch (e) {
      console.error("InitialProfileScreen: failed to save profile", e);
      setError("Failed to save your details. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const focusField = (key: string) => {
    activeField.current = key;

    if (scrollTimeout) clearTimeout(scrollTimeout);

    scrollTimeout = setTimeout(() => {
      const y = fieldY.current[key];

      if (y == null) return;

      scrollRef.current?.scrollTo({
        y: Math.max(0, y - 120), // offset for keyboard/header
        animated: true,
      });
    }, 80);
  };

  if (loading) {
    return (
      <ImageBackground
        source={require("../../assets/images/login_bg.png")}
        style={styles.bg}
        imageStyle={styles.bgImage}
        resizeMode="stretch"
      >
        <SafeAreaView style={[styles.screen, styles.center]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </SafeAreaView>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require("../../assets/images/login_bg.png")}
      style={styles.bg}
      imageStyle={styles.bgImage}
      resizeMode="stretch"
    >
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
        >
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={[
              styles.content,
              { flexGrow: 1, paddingBottom: insets.bottom + 180 },
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={
              Platform.OS === "ios" ? "interactive" : "on-drag"
            }
            automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
            showsVerticalScrollIndicator={false}
          >
            <View pointerEvents="none" style={styles.decorLayer}>
              <Image
                source={require("../../assets/images/apple-and-heart.png")}
                style={[
                  styles.decorImage,
                  {
                    width: wp(30),
                    height: wp(30),
                    left: wp(6),
                    top: hp(6),
                  },
                ]}
              />

              <Image
                source={require("../../assets/images/brocolli-carrots.png")}
                style={[
                  styles.decorImage,
                  {
                    width: wp(30),
                    height: wp(30),
                    right: wp(2),
                    top: hp(6),
                  },
                ]}
              />

              <Image
                source={require("../../assets/images/shoes.png")}
                style={[
                  styles.decorImage,
                  {
                    width: wp(30),
                    height: wp(30),
                    left: wp(0),
                    top: hp(15),
                  },
                ]}
              />

              <Image
                source={require("../../assets/images/moon.png")}
                style={[
                  styles.decorImage,
                  {
                    width: wp(30),
                    height: wp(30),
                    right: wp(1),
                    top: hp(14),
                  },
                ]}
              />
            </View>
            <Image
              resizeMode="contain"
              source={require("../../assets/images/nutrition_logo.png")}
              style={{
                width: wp(26),
                height: wp(26),
                resizeMode: "contain",
                zIndex: 2,
                marginTop: hp(6),
              }}
            />

            <Text style={styles.helper}>
              These details will help{"\n"}
              <Text style={styles.red}>Taguig </Text>
              <Text style={styles.blue}>Nutri</Text>
              <Text style={styles.yellow}> App </Text>
              provide more relevant{"\n"}
              nutrition feedback
            </Text>

            {/* Avatar */}
            <View
              style={[
                styles.card,
                {
                  maxWidth: wp(90),
                  marginTop: hp(8),
                  borderRadius: wp(8),
                  paddingHorizontal: wp(6),
                  paddingTop: hp(7),
                  paddingBottom: hp(3),
                },
              ]}
            >
              {/* <View style={styles.avatarWrap}>
                <Text style={styles.avatarIcon}>👤</Text>
                <View style={styles.plusCircle}>
                  <Text style={styles.plusText}>+</Text>
                </View>
              </View> */}

              <Text style={styles.title}>Create Profile</Text>

              {/* Decorative lines under title */}
              <View style={styles.titleLines}>
                <View
                  style={[styles.line, { backgroundColor: COLORS.taguigRed }]}
                />
                <View
                  style={[styles.line, { backgroundColor: COLORS.taguigBlue }]}
                />
                <View
                  style={[
                    styles.line,
                    { backgroundColor: COLORS.taguigYellow },
                  ]}
                />
              </View>

              <View style={styles.fieldRow}>
                <View style={styles.fieldIconWrap}>
                  <Image
                    source={require("../../assets/images/gender.png")}
                    style={styles.fieldIcon}
                  />
                </View>

                <View style={styles.fieldContent}>
                  <Text style={styles.unitTitle}>Sex</Text>

                  <View style={styles.genderRow}>
                    <TouchableOpacity
                      onPress={() => handleChange("sex", "Male")}
                      style={[
                        styles.genderBtn,
                        form.sex === "Male" && styles.genderBtnActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.genderText,
                          form.sex === "Male" && styles.genderTextActive,
                        ]}
                      >
                        Male
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleChange("sex", "Female")}
                      style={[
                        styles.genderBtn,
                        form.sex === "Female" && styles.genderBtnActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.genderText,
                          form.sex === "Female" && styles.genderTextActive,
                        ]}
                      >
                        Female
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Age */}
              <View
                onLayout={(e) => {
                  fieldY.current.age = e.nativeEvent.layout.y;
                }}
                style={styles.fieldRow}
              >
                <View style={styles.fieldIconWrap}>
                  <Image
                    source={require("../../assets/images/birthdate.png")}
                    style={styles.fieldIcon}
                  />
                </View>
                <View style={styles.fieldContent}>
                  <Text style={styles.unitTitle}>Age</Text>
                  <InputWithUnit
                    ref={ageRef}
                    value={String(form.age ?? "")}
                    placeholder="Enter your age"
                    unit="yrs"
                    keyboardType="numeric"
                    returnKeyType="next"
                    onFocus={() => focusField("age")}
                    onSubmitEditing={() => {
                      if (useImperial) heightFtRef.current?.focus();
                      else heightRef.current?.focus();
                    }}
                    onChangeText={(v) => handleChange("age", v)}
                  />
                </View>
              </View>

              {/* Units toggle */}
              <View style={styles.unitRow}>
                <Text style={styles.unitTitle}>Units</Text>

                <View style={styles.unitToggle}>
                  <Text
                    style={[
                      styles.unitLabel,
                      !useImperial && styles.unitLabelActive,
                    ]}
                  >
                    Metric
                  </Text>

                  <Switch
                    value={useImperial}
                    onValueChange={(value) => {
                      setUseImperial(value);

                      if (value && form.weight) {
                        setWeightLb(kgToLb(Number(form.weight)).toFixed(0));
                      }

                      if (!value && weightLb) {
                        handleChange(
                          "weight",
                          lbToKg(Number(weightLb)).toFixed(1),
                        );
                      }
                    }}
                    trackColor={{
                      false: COLORS.inputBorder,
                      true: COLORS.taguigBlue,
                    }}
                    thumbColor={
                      Platform.OS === "android" ? COLORS.white : undefined
                    }
                    ios_backgroundColor={COLORS.inputBorder}
                  />

                  <Text
                    style={[
                      styles.unitLabel,
                      useImperial && styles.unitLabelActive,
                    ]}
                  >
                    Imperial
                  </Text>
                </View>
              </View>

              {/* Height */}
              <View
                onLayout={(e) => {
                  fieldY.current.age = e.nativeEvent.layout.y;
                }}
                style={styles.fieldRow}
              >
                <View style={styles.fieldIconWrap}>
                  <Image
                    source={require("../../assets/images/height.png")}
                    style={styles.fieldIcon}
                  />
                </View>

                <View style={styles.fieldContent}>
                  <Text style={styles.unitTitle}>Height</Text>
                  {useImperial ? (
                    <View style={styles.row}>
                      <View style={styles.halfField}>
                        <InputWithUnit
                          ref={heightFtRef}
                          value={heightFt}
                          placeholder="Feet"
                          unit="ft"
                          keyboardType="number-pad"
                          returnKeyType="next"
                          onFocus={() => focusField("age")}
                          onSubmitEditing={() => heightInRef.current?.focus()}
                          onChangeText={(v) => {
                            const clean = v.replace(/[^0-9]/g, "");
                            setHeightFt(clean);

                            const cm = ftInToCm(
                              Number(clean || 0),
                              Number(heightIn || 0),
                            );
                            handleChange("height", cm ? cm.toFixed(1) : "");
                          }}
                        />
                      </View>

                      <View style={styles.halfField}>
                        <InputWithUnit
                          ref={heightInRef}
                          value={heightIn}
                          placeholder="Inches"
                          unit="in"
                          keyboardType="number-pad"
                          returnKeyType="next"
                          onFocus={() => focusField("age")}
                          onSubmitEditing={() => weightRef.current?.focus()}
                          onChangeText={(v) => {
                            const clean = v.replace(/[^0-9]/g, "");
                            setHeightIn(clean);

                            const cm = ftInToCm(
                              Number(heightFt || 0),
                              Number(clean || 0),
                            );
                            handleChange("height", cm ? cm.toFixed(1) : "");
                          }}
                        />
                      </View>
                    </View>
                  ) : (
                    <InputWithUnit
                      ref={heightRef}
                      value={String(form.height ?? "")}
                      placeholder="Enter your height"
                      unit="cm"
                      keyboardType="decimal-pad"
                      returnKeyType="next"
                      onFocus={() => focusField("age")}
                      onSubmitEditing={() => weightRef.current?.focus()}
                      onChangeText={(v) =>
                        handleChange("height", v.replace(/[^0-9.]/g, ""))
                      }
                    />
                  )}
                </View>
              </View>

              {/* Weight */}
              <View
                onLayout={(e) => {
                  fieldY.current.age = e.nativeEvent.layout.y;
                }}
                style={styles.fieldRow}
              >
                <View style={styles.fieldIconWrap}>
                  <Image
                    source={require("../../assets/images/weight.png")}
                    style={styles.fieldIcon}
                  />
                </View>

                <View style={styles.fieldContent}>
                  <Text style={styles.unitTitle}>Weight</Text>
                  <InputWithUnit
                    value={useImperial ? weightLb : String(form.weight ?? "")}
                    onChangeText={(v) => {
                      const clean = v.replace(/[^0-9.]/g, "");

                      if (useImperial) {
                        setWeightLb(clean);

                        const kg = lbToKg(Number(clean || 0));
                        handleChange("weight", clean ? kg.toFixed(1) : "");
                      } else {
                        handleChange("weight", clean);
                      }
                    }}
                    placeholder="Enter your weight"
                    unit={useImperial ? "lb" : "kg"}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              {error && <Text style={styles.errorText}>{error}</Text>}

              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleSubmit}
                disabled={saving}
              >
                <Text style={styles.saveText}>
                  {saving ? "Saving..." : "Save & Continue  →"}
                </Text>
              </TouchableOpacity>
            </View>
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
    backgroundColor: COLORS.whiteBGTransparent,
  },

  bgImage: {
    width: "100%",
    height: "100%",
  },

  safe: {
    flex: 1,
    backgroundColor: "transparent",
  },

  content: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 5,
    paddingTop: 10,
    paddingBottom: 40,
  },

  decorLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "40%",
    zIndex: 1,
  },

  decorImage: {
    position: "absolute",
    resizeMode: "contain",
  },

  logo: {
    width: 150,
    height: 150,
    resizeMode: "contain",
    marginTop: 10,
    zIndex: 2,
  },

  helper: {
    marginTop: 12,
    textAlign: "center",
    fontSize: 22,
    lineHeight: 32,
    color: COLORS.textSecondary,
    fontWeight: "500",
    zIndex: 2,
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

  card: {
    width: "100%",
    paddingHorizontal: 26,
  },

  avatarWrap: {
    position: "absolute",
    top: -58,
    alignSelf: "center",
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: COLORS.whiteBGTransparent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },

  avatarIcon: {
    fontSize: 58,
    color: COLORS.taguigBlue,
  },

  plusCircle: {
    position: "absolute",
    right: 8,
    bottom: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.taguigBlue,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: COLORS.white,
  },

  plusText: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: "900",
    marginTop: -2,
  },

  title: {
    textAlign: "center",
    fontSize: 38,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },

  titleLines: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
    marginBottom: 24,
  },

  line: {
    width: 44,
    height: 5,
    borderRadius: 99,
  },

  row: {
    flexDirection: "row",
    gap: 18,
  },

  halfField: {
    flex: 1,
  },

  fieldRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: "100%",
    marginTop: 14,
  },

  fieldIconWrap: {
    width: 42,
    alignItems: "center",
    paddingTop: 30,
  },

  fieldIcon: {
    width: 40,
    height: 40,
    resizeMode: "stretch",
  },

  fieldContent: {
    flex: 1,
  },

  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },

  unitRow: {
    marginTop: 18,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  unitTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },

  unitToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  unitLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textMuted,
  },

  unitLabelActive: {
    color: COLORS.taguigBlue,
  },

  genderRow: {
    flexDirection: "row",
    gap: 12,
  },

  genderBtn: {
    flex: 1,
    minHeight: 58,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    backgroundColor: COLORS.inputBackground,
    alignItems: "center",
    justifyContent: "center",
  },

  genderBtnActive: {
    borderColor: COLORS.taguigBlue,
    backgroundColor: "#EAF2FF",
  },

  genderText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },

  genderTextActive: {
    color: COLORS.taguigBlue,
    fontWeight: "900",
  },

  input: {
    minHeight: 58,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    backgroundColor: COLORS.inputBackground,
    paddingHorizontal: 18,
    fontSize: 16,
    color: COLORS.textPrimary,
    justifyContent: "center",
  },

  inputText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },

  errorText: {
    marginTop: 16,
    color: COLORS.dangerRed,
    fontWeight: "700",
    textAlign: "center",
  },

  saveBtn: {
    marginTop: 28,
    minHeight: 68,
    borderRadius: 12,
    backgroundColor: COLORS.taguigBlue,
    alignItems: "center",
    justifyContent: "center",
  },

  saveBtnDisabled: {
    opacity: 0.6,
  },

  saveText: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: "900",
  },

  screen: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
});

export default InitialProfileScreen;
