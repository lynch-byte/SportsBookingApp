import { Stack } from "expo-router";

export default function RootLayout() {
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