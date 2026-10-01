import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { initDatabase } from "../database/db";

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initDatabase()
      .then(() => setReady(true))
      .catch((e) => setError(String(e?.message ?? e)));
  }, []);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
        <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 8 }}>
          Database error
        </Text>
        <Text selectable>{error}</Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0B2A5B" />
        <Text style={{ marginTop: 12 }}>Loading courts...</Text>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#0B2A5B" },
        headerTintColor: "#fff",
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="court/[id]" options={{ title: "Court Details" }} />
      <Stack.Screen name="book/[courtId]" options={{ title: "Book Court" }} />
      <Stack.Screen name="edit-booking/[id]" options={{ title: "Edit Booking" }} />
    </Stack>
  );
}