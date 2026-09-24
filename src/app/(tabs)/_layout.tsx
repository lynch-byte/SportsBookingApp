import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#1DB954",
        headerStyle: { backgroundColor: "#0B2A5B" },
        headerTintColor: "#fff",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="courts"
        options={{
          title: "Courts",
          tabBarIcon: ({ color, size }) => <Ionicons name="basketball" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="my-bookings"
        options={{
          title: "My Bookings",
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}