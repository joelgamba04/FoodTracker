// app/(tabs)/index.tsx
import { Redirect } from "expo-router";

const index = () => {
  // Redirect to the "log" tab on web
  return <Redirect href="/(tabs)/DashboardPage" />;
};

export default index;
