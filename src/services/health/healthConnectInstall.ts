// src/services/health/healthConnectInstall.ts

import { Linking, Platform } from "react-native";
import {
  getSdkStatus,
  SdkAvailabilityStatus,
} from "react-native-health-connect";

const HEALTH_CONNECT_PACKAGE = "com.google.android.apps.healthdata";
const PLAY_STORE_APP_URL = `market://details?id=${HEALTH_CONNECT_PACKAGE}`;
const PLAY_STORE_WEB_URL = `https://play.google.com/store/apps/details?id=${HEALTH_CONNECT_PACKAGE}`;

export const checkAndroidHealthConnectAvailability = async () => {
  if (Platform.OS !== "android") {
    return {
      supported: false,
      available: false,
      needsInstall: false,
      status: null as number | null,
    };
  }

  const status = await getSdkStatus();

  return {
    supported: true,
    available: status === SdkAvailabilityStatus.SDK_AVAILABLE,
    needsInstall: status !== SdkAvailabilityStatus.SDK_AVAILABLE,
    needsUpdate:
      status === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED,

    unavailable: status === SdkAvailabilityStatus.SDK_UNAVAILABLE,
    status,
  };
};

export const openHealthConnectStorePage = async () => {
  const canOpenMarket = await Linking.canOpenURL(PLAY_STORE_APP_URL);

  if (canOpenMarket) {
    await Linking.openURL(PLAY_STORE_APP_URL);
    return;
  }

  await Linking.openURL(PLAY_STORE_WEB_URL);
};
