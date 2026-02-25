// app/(tabs)/IndexPlaceHolder.tsx
import { Redirect } from "expo-router";

export default function IndexPlaceHolder() {
  // Redirect to the "log" tab on web
  return <Redirect href="/DashboardPage" />;
}
