// src/components/PrivacyPolicyModal.tsx
import AppHeader from "@/components/AppHeader";
import { COLORS } from "@/theme/color";
import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  visible: boolean;
  onClose: () => void;
};

const PrivacyPolicyModal = ({ visible, onClose }: Props) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <SafeAreaView style={styles.screen}>
        <AppHeader title="Privacy Policy" showBack onBackPress={onClose} />

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Basic Data Privacy Terms</Text>

          <Text style={styles.body}>
            Taguig NutriApp collects only the information needed to provide
            nutrition and hydration tracking features.
          </Text>

          <Text style={styles.section}>What we may collect</Text>
          <Text style={styles.body}>
            • Profile details such as age, sex, height, and weight{"\n"}•
            Nutrition and hydration logs you enter{"\n"}• Login-related
            information if you use an authenticated account
          </Text>

          <Text style={styles.section}>How your data is used</Text>
          <Text style={styles.body}>
            Your data is used only to provide app features such as daily goals,
            food tracking, hydration tracking, and profile-based
            recommendations.
          </Text>

          <Text style={styles.section}>Guest mode</Text>
          <Text style={styles.body}>
            In guest mode, your data may be stored only on this device.
            Uninstalling the app or changing devices may remove your locally
            stored data.
          </Text>

          <Text style={styles.section}>Data sharing</Text>
          <Text style={styles.body}>
            Your data is not intended to be sold. Any sharing should only be for
            required app functionality and authorized backend services.
          </Text>

          <Text style={styles.section}>Health notice</Text>
          <Text style={styles.body}>
            This app is for general wellness support only and does not replace
            medical advice, diagnosis, or treatment.
          </Text>

          <Pressable style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Close</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 18,
    paddingBottom: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  section: {
    marginTop: 16,
    marginBottom: 6,
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },
  body: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },
  button: {
    marginTop: 24,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: COLORS.textInverse,
    fontWeight: "900",
    fontSize: 15,
  },
});

export default PrivacyPolicyModal;
