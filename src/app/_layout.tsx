import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { initDatabase } from "../database/db";

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initDatabase().then(() => setReady(true));
  }, []);

  if (!ready) return null;

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