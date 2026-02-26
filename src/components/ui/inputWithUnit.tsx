// src/components/ui/inputWithUnit.tsx
import { COLORS } from "@/theme/color";
import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

type InputWithUnitProps = {
  unit: string;
} & Pick<
  TextInputProps,
  | "value"
  | "onChangeText"
  | "placeholder"
  | "keyboardType"
  | "returnKeyType"
  | "onSubmitEditing"
  | "blurOnSubmit"
>;

export const InputWithUnit: React.FC<InputWithUnitProps> = ({
  value,
  onChangeText,
  placeholder,
  unit,
  keyboardType = "numeric",
  returnKeyType,
  onSubmitEditing,
  blurOnSubmit,
}) => {
  return (
    <View style={styles.inputUnitWrap}>
      <TextInput
        style={styles.inputUnitInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        keyboardType={keyboardType}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        blurOnSubmit={blurOnSubmit}
      />
      <Text style={styles.inputUnitSuffix}>{unit}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  inputUnitWrap: {
    height: 48,
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: COLORS.surface,
    flexDirection: "row",
    alignItems: "center",
  },
  inputUnitInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 14,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  inputUnitSuffix: {
    marginLeft: 10,
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: "700",
  },
});
