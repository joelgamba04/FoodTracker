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
  title: string;
  children: React.ReactNode;
  onAccept: () => void;
  acceptLabel?: string;
}

const DisclaimerModal: React.FC<DisclaimerModalProps> = ({
  title,
  children,
  onAccept,
  acceptLabel = "I Understand and Accept",
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAccept = useCallback(() => {
    setIsSubmitting(true);
    setIsVisible(false);
    onAccept();
    setIsSubmitting(false);
  }, [onAccept]);

  if (!isVisible) return null;

  return (
    <Modal
      animationType="fade"
      transparent
      visible={isVisible}
      onRequestClose={() => {
        // Prevent dismiss via back button without accepting
      }}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>{title}</Text>

          <ScrollView style={styles.disclaimerContent}>
            {/* body/content passed from parent */}
            {children}
          </ScrollView>

          <TouchableOpacity
            style={styles.acceptButton}
            onPress={handleAccept}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.acceptButtonText}>{acceptLabel}</Text>
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
    backgroundColor: "rgba(0,0,0,0.7)",
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
