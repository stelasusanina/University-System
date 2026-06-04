import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { api } from "@/services/api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function useRegisterPushNotifications() {
  const tokenRef = useRef<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    registerForPushNotifications().then((token) => {
      if (token) {
        console.log("ExpoPushToken:", token);
        tokenRef.current = token;
        api.post("/push-token", { token }).catch(() => {});
      }
    });

    const receivedListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("Notification received:", notification.request.content.title);
      }
    );

    const responseListener = Notifications.addNotificationResponseReceivedListener(
      () => {
        router.push("/(tabs)");
      }
    );

    return () => {
      receivedListener.remove();
      responseListener.remove();
    };
  }, []);

  return tokenRef;
}

async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  try {
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    return tokenData.data;
  } catch (err) {
    console.log("Push notifications not available (Firebase setup required):", err);
    return null;
  }
}
