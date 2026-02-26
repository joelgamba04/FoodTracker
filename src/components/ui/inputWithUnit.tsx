// src/components/ui/inputWithUnit.tsx
import { COLORS } from "@/theme/color";
import React, { forwardRef } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

type InputWithUnitProps = TextInputProps & {
  unit: string;
};

export const InputWithUnit = forwardRef<TextInput, InputWithUnitProps>(
  ({ unit, style, ...inputProps }, ref) => {
    return (
      <View style={styles.inputUnitWrap}>
        <TextInput
          ref={ref}
          style={[styles.inputUnitInput, style]}
          placeholderTextColor={COLORS.textMuted}
          {...inputProps}
        />
        <Text style={styles.inputUnitSuffix}>{unit}</Text>
      </View>
    );
  },
);

InputWithUnit.displayName = "InputWithUnit";

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
