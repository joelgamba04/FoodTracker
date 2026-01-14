import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

type InputWithUnitProps = {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  unit: string;
  keyboardType?: "default" | "numeric";
};

export const InputWithUnit: React.FC<InputWithUnitProps> = ({
  value,
  onChangeText,
  placeholder,
  unit,
  keyboardType = "numeric",
}) => {
  return (
    <View style={styles.inputUnitWrap}>
      <TextInput
        style={styles.inputUnitInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8A8F98"
        keyboardType={keyboardType}
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
        backgroundColor: "#F3F5F8",
        flexDirection: "row",
        alignItems: "center",
    },
    inputUnitInput: {
        flex: 1,
        color: "#0B0F14",
        fontSize: 14,
        paddingVertical: 0,
        paddingHorizontal: 0,
    },
    inputUnitSuffix: {
        marginLeft: 10,
        color: "#8A8F98",
        fontSize: 13,
        fontWeight: "700",
    },
});
