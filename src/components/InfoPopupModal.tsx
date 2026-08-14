// src/components/InfoPopupModal.tsx

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { COLORS } from "@/theme/color";

export type InfoPopupItem = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
};

type InfoPopupModalProps = {
  visible: boolean;
  title: string;
  description?: string;
  items?: InfoPopupItem[];

  buttonText?: string;

  icon?: keyof typeof Ionicons.glyphMap;

  onClose: () => void;
};

const InfoPopupModal = ({
  visible,
  title,
  description,
  items = [],
  buttonText = "Got it",
  icon = "information-circle-outline",
  onClose,
}: InfoPopupModalProps) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View
          style={styles.card}
          accessibilityViewIsModal
          accessibilityRole="alert"
        >
          {/* CLOSE */}
          <Pressable
            onPress={onClose}
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel="Close information"
            hitSlop={10}
          >
            <Ionicons
              name="close"
              size={22}
              color={COLORS.textSecondary}
            />
          </Pressable>

          {/* HEADER ICON */}
          <View style={styles.headerIcon}>
            <Ionicons
              name={icon}
              size={34}
              color={COLORS.primary}
            />
          </View>

          {/* TITLE */}
          <Text style={styles.title}>{title}</Text>

          {description ? (
            <Text style={styles.description}>{description}</Text>
          ) : null}

          {/* ITEMS */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.itemsContainer}
            showsVerticalScrollIndicator={false}
          >
            {items.map((item, index) => (
              <View
                key={`${item.title}-${index}`}
                style={styles.item}
              >
                {item.icon ? (
                  <View style={styles.itemIcon}>
                    <Ionicons
                      name={item.icon}
                      size={22}
                      color={COLORS.primary}
                    />
                  </View>
                ) : null}

                <View style={styles.itemContent}>
                  <Text style={styles.itemTitle}>
                    {item.title}
                  </Text>

                  <Text style={styles.itemDescription}>
                    {item.description}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* BUTTON */}
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>
              {buttonText}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingVertical: 40,
  },

  card: {
    width: "100%",
    maxWidth: 390,
    maxHeight: "85%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,

    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: {
      width: 0,
      height: 10,
    },

    elevation: 12,
  },

  closeButton: {
    position: "absolute",
    right: 14,
    top: 14,
    zIndex: 10,

    width: 36,
    height: 36,
    borderRadius: 18,

    alignItems: "center",
    justifyContent: "center",
  },

  headerIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,

    alignSelf: "center",

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#EAF2FF",
  },

  title: {
    marginTop: 14,

    fontSize: 20,
    lineHeight: 26,

    fontWeight: "900",

    color: COLORS.textPrimary,

    textAlign: "center",
  },

  description: {
    marginTop: 6,

    fontSize: 13,
    lineHeight: 19,

    color: COLORS.textSecondary,

    textAlign: "center",
  },

  scrollView: {
    marginTop: 20,
  },

  itemsContainer: {
    gap: 16,
    paddingBottom: 6,
  },

  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  itemIcon: {
    width: 44,
    height: 44,

    flexShrink: 0,

    borderRadius: 14,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#EEF4FF",
  },

  itemContent: {
    flex: 1,
    minWidth: 0,
  },

  itemTitle: {
    fontSize: 14,
    lineHeight: 18,

    fontWeight: "900",

    color: COLORS.textPrimary,
  },

  itemDescription: {
    marginTop: 3,

    fontSize: 12,
    lineHeight: 17,

    color: COLORS.textSecondary,
  },

  button: {
    marginTop: 20,

    minHeight: 50,

    borderRadius: 14,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.primary,
  },

  buttonPressed: {
    opacity: 0.85,
  },

  buttonText: {
    color: "#FFFFFF",

    fontSize: 14,

    fontWeight: "900",
  },
});

export default InfoPopupModal;