import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Alert, Text, TouchableOpacity } from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function TabsLayout() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "admin";

  function confirmLogout() {
    Alert.alert("Log out?", "You can log back in any time.", [
      { text: "Stay", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: () => logout() },
    ]);
  }

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#0B2A5B" },
        headerTintColor: "#fff",
        tabBarActiveTintColor: "#16A34A",
        tabBarInactiveTintColor: "#6B7280",
        headerRight: () => (
          <TouchableOpacity onPress={confirmLogout} style={{ paddingHorizontal: 16 }}>
            <Text style={{ color: "#fff", fontWeight: "600" }}>Log out</Text>
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="courts"
        options={{
          title: "Courts",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="basketball" color={color} size={size} />
          ),
        }}
      />
      {/* Regular users only. The admin manages bookings in the Admin tab. */}
      <Tabs.Screen
        name="my-bookings"
        options={{
          title: "My Bookings",
          href: isAdmin ? null : undefined,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" color={color} size={size} />
          ),
        }}
      />
      {/* Admin only */}
      <Tabs.Screen
        name="admin"
        options={{
          title: "Admin",
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shield-checkmark" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}