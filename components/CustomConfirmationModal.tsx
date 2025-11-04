import React from "react";
import {
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// --- Theme Constants ---
const DANGER_RED = "#FF3B30";
const GRAY_LIGHT = "#e8e8e8";
const BLACK_OVERLAY = "rgba(0,0,0,0.5)";

interface CustomConfirmationModalProps {
  isVisible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * A custom in-app modal to replace the native Alert.alert, ensuring confirmation
 * dialogs appear reliably across different React Native environments (e.g., Web).
 */
const CustomConfirmationModal: React.FC<CustomConfirmationModalProps> = ({
  isVisible,
  title,
  message,
  onConfirm,
  onCancel,
}) => {
  if (!isVisible) return null;

  return (
    <View style={modalStyles.overlay}>
      <View style={modalStyles.modalContainer}>
        <Text style={modalStyles.title}>{title}</Text>
        <Text style={modalStyles.message}>{message}</Text>
        <View style={modalStyles.buttonContainer}>
          <TouchableOpacity
            style={[modalStyles.button, modalStyles.cancelButton]}
            onPress={onCancel}
          >
            <Text style={modalStyles.buttonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[modalStyles.button, modalStyles.confirmButton]}
            onPress={onConfirm}
          >
            <Text style={[modalStyles.buttonText, { color: "white" }]}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default CustomConfirmationModal;

// --- Custom Modal Styles ---
const modalStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BLACK_OVERLAY,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100, // Ensure it sits on top of everything
  },
  modalContainer: {
    width: "80%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: { elevation: 20 },
    }),
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: DANGER_RED,
    marginBottom: 10,
  },
  message: {
    fontSize: 15,
    color: "#555", // GRAY_DARK equivalent
    marginBottom: 20,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginLeft: 10,
    minWidth: 80,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: GRAY_LIGHT,
  },
  confirmButton: {
    backgroundColor: DANGER_RED,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333", // Default text color for cancel
  },
});
