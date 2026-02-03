import { useAuth } from "@/context/AuthContext";
import { COLORS } from "@/theme/color";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
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
import { SafeAreaView } from "react-native-safe-area-context";

export const LoginScreen = () => {
  const { login } = useAuth();
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
    if (!canSubmit) return;

    setLoading(true);
    setErr(null);

    try {
      await login(email.trim(), password);
      router.replace("/(tabs)"); // adjust if needed
    } catch (e: any) {
      setErr(e?.message || "Login failed. Please try again.");
      console.error("Login error:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Think Big header */}
          <Image
            source={require("../../assets/images/withbgthinkbig-01.png")}
            style={styles.thinkBig}
            resizeMode="contain"
          />

          {/* Brand Header */}
          <View style={styles.header}>
            {/* Official logo */}
            <Image
              source={require("../../assets/images/FixedSquareNoBg.png")}
              style={styles.logo}
              resizeMode="contain"
            />

            <View style={{ flex: 1 }}>
              <Text style={styles.company}>City Government of Taguig</Text>
              <Text style={styles.appName}>Taguig NutriApp</Text>
              <Text style={styles.tagline}>
                Track meals. View nutrition. Stay consistent.
              </Text>
            </View>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.title}>Sign in</Text>
            <Text style={styles.subtitle}>Use your account to continue.</Text>

            {/* Email */}
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="name@email.com"
                placeholderTextColor={COLORS.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="username"
                returnKeyType="next"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Password */}
            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  placeholder="Password"
                  placeholderTextColor={COLORS.textSecondary}
                  secureTextEntry={!showPassword}
                  textContentType="password"
                  returnKeyType="done"
                  value={password}
                  onChangeText={setPassword}
                  onSubmitEditing={onSubmit}
                />

                <TouchableOpacity
                  style={styles.showBtn}
                  onPress={() => setShowPassword((v) => !v)}
                  accessibilityRole="button"
                >
                  <Text style={styles.showBtnText}>
                    {showPassword ? "Hide" : "Show"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.btn, !canSubmit && styles.btnDisabled]}
              onPress={onSubmit}
              disabled={!canSubmit}
            >
              <Text
                style={[styles.btnText, !canSubmit && styles.btnTextDisabled]}
              >
                {loading ? "Signing in..." : "Login"}
              </Text>
            </TouchableOpacity>

            {!!err && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{err}</Text>
              </View>
            )}

            <Text style={styles.footerNote}>
              By continuing, you agree to the app’s terms and disclaimers.
            </Text>
          </View>

          {/* Footer */}
          <Text style={styles.bottomFooter}>
            © {new Date().getFullYear()} City Government of Taguig
          </Text>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 10,
    justifyContent: "center",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  },
  logo: {
    width: 90,
    height: 90,
    marginBottom: 16,
  },
  thinkBig: {
    width: "100%",
    height: 180,
    marginBottom: 8,
  },
  company: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  appName: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: "800",
    marginTop: 2,
  },
  tagline: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },

  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 12,
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },

  field: { marginTop: 10 },
  label: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "700",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    fontSize: 14,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surface,
    marginBottom: 4,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  showBtn: {
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.softGray,
    alignItems: "center",
    justifyContent: "center",
  },
  showBtnText: {
    color: COLORS.textPrimary,
    fontWeight: "800",
    fontSize: 12,
  },

  btn: {
    marginTop: 14,
    backgroundColor: COLORS.softBlue,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btnDisabled: {
    backgroundColor: COLORS.disabledBg,
  },
  btnText: {
    color: COLORS.background,
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 0.3,
  },
  btnTextDisabled: {
    color: COLORS.disabledText,
  },

  errorBox: {
    backgroundColor: COLORS.errorBg,
    borderWidth: 1,
    borderColor: COLORS.errorBorder,
    borderRadius: 12,
    padding: 10,
    marginTop: 12,
    marginBottom: 8,
  },
  errorText: {
    color: COLORS.dangerRed,
    fontWeight: "700",
    fontSize: 12,
    lineHeight: 16,
  },

  footerNote: {
    marginTop: 12,
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  bottomFooter: {
    textAlign: "center",
    marginTop: 14,
    color: COLORS.textSecondary,
    fontSize: 11,
  },
});

export default LoginScreen;
