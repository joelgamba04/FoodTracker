// app/(auth)/login.tsx
import { useAuth } from "@/context/AuthContext";
import { COLORS } from "@/theme/color";
import React, { useMemo, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const CARD_MAX_WIDTH = Math.min(420, width - 36);

export const LoginScreen = () => {
  const { login, loginAsGuest } = useAuth();
  const insets = useSafeAreaInsets();

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const canSubmit = useMemo(() => {
    const e = email.trim();
    return e.length > 3 && e.includes("@") && password.length >= 1 && !loading;
  }, [email, password, loading]);

  const onSubmit = async () => {
    if (!canSubmit) {
      setErr("Please enter a valid email and password.");
      return;
    }

    setLoading(true);
    setErr(null);

    try {
      await login(email.trim(), password);
    } catch (e: any) {
      setErr(e?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onGuest = async () => {
    setErr(null);
    try {
      await loginAsGuest();
    } catch (e: any) {
      setErr(e?.message || "Guest login failed. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 8 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <KeyboardAwareScrollView
            style={styles.flex}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + 24 },
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={
              Platform.OS === "ios" ? "interactive" : "on-drag"
            }
            enableOnAndroid
            extraScrollHeight={Platform.OS === "android" ? 18 : 10}
          >
            {/* BRAND BLOCK */}
            <View style={styles.brandWrap}>
              <View style={styles.brandCard}>
                <Image
                  source={require("../../assets/images/withbgthinkbig-01.png")}
                  style={styles.thinkBig}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* FORM CARD */}
            <View style={[styles.card, { width: CARD_MAX_WIDTH }]}>
              <View style={styles.logoRow}>
                <View style={styles.logoHalo}>
                  <Image
                    source={require("../../assets/images/FixedSquareNoBg.png")}
                    style={styles.logo}
                    resizeMode="contain"
                  />
                </View>

                <View style={styles.brandText}>
                  <Text style={styles.appName}>Taguig NutriApp</Text>
                  <Text style={styles.appSub}>City Government of Taguig</Text>
                </View>
              </View>

              <Text style={styles.title}>Log in</Text>
              <Text style={styles.subtitle}>Use your account to continue.</Text>

              {!!err && <Text style={styles.errorText}>{err}</Text>}

              <View style={styles.field}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  ref={emailRef}
                  placeholder="name@email.com"
                  placeholderTextColor={COLORS.disabledText}
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    ref={passwordRef}
                    placeholder="Password"
                    placeholderTextColor={COLORS.disabledText}
                    style={[styles.input, styles.passwordInput]}
                    secureTextEntry={!showPassword}
                    textContentType="password"
                    autoCapitalize="none"
                    autoCorrect={false}
                    multiline={false}
                    returnKeyType="done"
                    enablesReturnKeyAutomatically
                    onSubmitEditing={onSubmit}
                    value={password}
                    onChangeText={setPassword}
                  />

                  <TouchableOpacity
                    onPress={() => setShowPassword((v) => !v)}
                    style={styles.showBtn}
                    accessibilityRole="button"
                  >
                    <Text style={styles.showBtnText}>
                      {showPassword ? "Hide" : "Show"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  !canSubmit && styles.primaryBtnDisabled,
                ]}
                disabled={!canSubmit}
                onPress={onSubmit}
              >
                <Text
                  style={[
                    styles.primaryBtnText,
                    !canSubmit && styles.primaryBtnTextDisabled,
                  ]}
                >
                  {loading ? "Signing in..." : "Login"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={onGuest} style={styles.guestBtn}>
                <Text style={styles.guestText}>Continue as Guest</Text>
              </TouchableOpacity>

              <Text style={styles.legal}>
                By continuing, you agree to the app’s terms and disclaimers.
              </Text>
            </View>

            {/* FOOTER */}
            <Text style={styles.footer}>© 2026 City Government of Taguig</Text>
          </KeyboardAwareScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: COLORS.background },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 18,
    justifyContent: "space-between",
  },

  brandWrap: { paddingTop: 6, alignItems: "center" },
  brandCard: {
    width: CARD_MAX_WIDTH,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  thinkBig: {
    width: "100%",
    height: Math.min(width * 0.7, 280),
  },

  card: {
    alignSelf: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
    marginTop: 14,
  },

  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    justifyContent: "center",
  },
  logoHalo: {
    width: 58,
    height: 58,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  logo: { width: 42, height: 42 },
  brandText: { alignItems: "flex-start" },
  appName: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.textPrimary,
    letterSpacing: 0.2,
  },
  appSub: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textMuted,
  },

  title: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 14,
    fontSize: 13,
    color: COLORS.textMuted,
  },

  errorText: {
    color: COLORS.dangerRed,
    fontWeight: "700",
    marginBottom: 10,
  },

  field: { marginBottom: 12 },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textMuted,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    fontSize: 14,
    color: COLORS.textPrimary,
  },

  passwordRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  passwordInput: { flex: 1 },

  showBtn: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  showBtnText: { fontSize: 12, fontWeight: "900", color: COLORS.textPrimary },

  primaryBtn: {
    marginTop: 6,
    borderRadius: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnDisabled: { backgroundColor: COLORS.disabledBg },
  primaryBtnText: {
    color: COLORS.textInverse,
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 0.3,
  },
  primaryBtnTextDisabled: { color: COLORS.disabledText },

  guestBtn: {
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceMuted,
  },
  guestText: {
    textAlign: "center",
    fontWeight: "700",
    color: COLORS.textPrimary,
  },

  legal: {
    marginTop: 12,
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.textMuted,
  },
  footer: {
    textAlign: "center",
    fontSize: 11,
    color: COLORS.textMuted,
    paddingTop: 10,
  },
});

export default LoginScreen;
