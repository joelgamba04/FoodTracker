import { COLORS } from "@/theme/color";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

const GuestModeDataNoticeCard = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable style={styles.noticeCard} onPress={() => setOpen(true)}>
        <View style={styles.noticeIcon}>
          <Ionicons
            name="information-circle"
            size={18}
            color={COLORS.iconPrimary}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.noticeTitle}>Guest Mode Data Notice</Text>
          <Text style={styles.noticeBody} numberOfLines={2}>
            Your data is saved on this device only. No account, no cloud sync.
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color={COLORS.iconPrimary} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>
              Guest Mode: How your data works
            </Text>

            <View style={{ gap: 10, marginTop: 10 }}>
              <Text style={styles.modalBullet}>
                • Data is stored on-device only.
              </Text>
              <Text style={styles.modalBullet}>
                • Uninstalling the app clears your data.
              </Text>
              <Text style={styles.modalBullet}>
                • Changing phones will not transfer your data.
              </Text>
              <Text style={styles.modalBullet}>
                • No cross-device sync (login not implemented yet).
              </Text>
            </View>

            <Pressable style={styles.modalBtn} onPress={() => setOpen(false)}>
              <Text style={styles.modalBtnText}>Got it</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

export default GuestModeDataNoticeCard;

const styles = StyleSheet.create({
  noticeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: 12,
  },
  noticeIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },
  noticeBody: {
    marginTop: 4,
    fontSize: 12,
    opacity: 0.75,
    color: COLORS.textPrimary,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    padding: 18,
    justifyContent: "center",
  },
  modalCard: {
    backgroundColor: COLORS.background,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },
  modalBullet: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.textPrimary,
    opacity: 0.9,
  },
  modalBtn: {
    marginTop: 14,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: COLORS.primary,
  },
  modalBtnText: {
    color: COLORS.textInverse,
    fontWeight: "900",
  },
});
