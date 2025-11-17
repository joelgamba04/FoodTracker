import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Modal,
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
  // Always show at app start; no persistence needed
  const [isVisible, setIsVisible] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAccept = useCallback(() => {
    setIsSubmitting(true);
    // If you ever want a slight delay or extra logic, you can put it here
    setIsVisible(false);
    onAccept();
    setIsSubmitting(false);
  }, [onAccept]);

  if (!isVisible) {
    return null;
  }

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={() => {
        // Prevent closing via back button without accepting
      }}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Important Health Disclaimer</Text>

          <ScrollView style={styles.disclaimerContent}>
            <Text style={styles.disclaimerText}>
              {/* You can remove the ** if you don't want literal asterisks */}
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

          <TouchableOpacity
            style={styles.acceptButton}
            onPress={handleAccept}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.acceptButtonText}>
                I Understand and Accept
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
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
