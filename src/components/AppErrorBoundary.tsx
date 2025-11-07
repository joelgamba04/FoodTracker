import React from "react";
import { ScrollView, Text } from "react-native";

type State = { hasError: boolean; message?: string; stack?: string };

export class AppErrorBoundary extends React.Component<
  React.PropsWithChildren,
  State
> {
  state: State = { hasError: false };
  static getDerivedStateFromError(err: any) {
    return {
      hasError: true,
      message: err?.message,
      stack: String(err?.stack ?? ""),
    };
  }
  componentDidCatch(err: any) {
    console.error("AppErrorBoundary:", err);
  }
  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          padding: 16,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontWeight: "bold", marginBottom: 8 }}>
          A render error occurred.
        </Text>
        {this.state.message ? <Text>{this.state.message}</Text> : null}
        {this.state.stack ? (
          <Text style={{ opacity: 0.7, marginTop: 12 }}>
            {this.state.stack}
          </Text>
        ) : null}
      </ScrollView>
    );
  }
}
