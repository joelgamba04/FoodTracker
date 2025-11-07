import { DISCLAIMER_ACCEPTED_KEY } from "@/constants/storageKeys";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface DisclaimerModalProps {
  onAccept: () => void;
}

const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ onAccept }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check storage on component mount
  useEffect(() => {
    if (Platform.OS === "web") {
      // Either auto-accept on web:
      onAccept();
      return;
    }

    const checkDisclaimerStatus = async () => {
      try {
        const value = await AsyncStorage.getItem(DISCLAIMER_ACCEPTED_KEY);

        if (value === "true") {
          // ✅ Already accepted — let the parent continue rendering the app
          onAccept();
        } else {
          // ❗ Not yet accepted — show the modal
          setIsVisible(true);
        }
      } catch (error) {
        console.error("Error checking disclaimer status:", error);
        // Fallback: show the modal if storage check fails
        setIsVisible(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkDisclaimerStatus();
  }, [onAccept]);

  const handleAccept = useCallback(async () => {
    // Hide modal
    setIsVisible(false);

    // ⚠️ CRUCIAL MODIFICATION: Only save acceptance status on native platforms
    if (Platform.OS !== "web") {
      try {
        await AsyncStorage.setItem(DISCLAIMER_ACCEPTED_KEY, "true");
      } catch (error) {
        console.error("Error saving acceptance status:", error);
      }
    }

    // Notify the parent (App component) that the app can be rendered
    onAccept();
  }, [onAccept]);

  if (isLoading) {
    // Show a blank screen or a loading indicator while checking storage
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // NOTE: Modal 'animationType' and 'transparent' are optional styling choices
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={() => {
        // Prevent closing via the back button (Android) unless accepted
      }}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Important Health Disclaimer</Text>
          <ScrollView style={styles.disclaimerContent}>
            <Text style={styles.disclaimerText}>
              ** This app is intended for use by healthy adult males and
              females, aged 19-59, who are residents of Taguig City and have no
              underlying medical comorbidities such as diabetes, hypertension
              and etc.**
              {"\n\n"}
              It is not a substitute for professional medical advice, diagnosis,
              or treatment. Always seek the advice of a qualified healthcare
              provider with any questions you may have regarding a medical
              condition or treatment, especially if you have pre-existing health
              issues (e.g., diabetes, hypertension, kidney disease) or are
              taking medication.
              {"\n\n"}
              **The RDI recommendations provided in the profile section are
              simplified adjustments and must be verified by a medical
              professional.**
              {"\n\n"}
              By accepting this disclaimer, you acknowledge that you are a
              healthy individual and understand the limitations of this tool. If
              you are unwell or have any health concerns, **do not proceed**
              without consulting a doctor.
            </Text>
          </ScrollView>
          <TouchableOpacity style={styles.acceptButton} onPress={handleAccept}>
            <Text style={styles.acceptButtonText}>I Understand and Accept</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)", // Dark overlay
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 25,
    alignItems: "stretch",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: "80%",
    width: "90%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 15,
    color: "#007AFF",
    textAlign: "center",
  },
  disclaimerContent: {
    maxHeight: 300,
    marginBottom: 20,
    paddingRight: 10,
  },
  disclaimerText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  acceptButton: {
    backgroundColor: "#4CD964",
    borderRadius: 8,
    padding: 15,
    elevation: 2,
  },
  acceptButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
});

export default DisclaimerModal;
