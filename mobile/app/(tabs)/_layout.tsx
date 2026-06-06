import { Tabs, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRegisterPushNotifications } from "@/hooks/usePushNotifications";

export default function TabLayout() {
  const { isAuthenticated, isReady } = useAuth();
  const router = useRouter();

  useRegisterPushNotifications();

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isReady, isAuthenticated]);

  if (!isReady) {
    return null;
  }

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{ title: "Начало" }}
      />
      <Tabs.Screen
        name="schedule"
        options={{ title: "Програма" }}
      />
      <Tabs.Screen
        name="map"
        options={{ title: "Кампус" }}
      />
    </Tabs>
  );
}
