import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";

const NAVY = "#0B2A5B";
const GREEN = "#16A34A";

export default function TabsLayout() {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
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
        sceneStyle: { backgroundColor: "#F3F4F6" },

        // Header: navy, rounded at the bottom, like the login screen
        headerStyle: { height: insets.top + 78, backgroundColor: "transparent" },
        headerBackground: () => <View style={styles.headerBg} />,
        headerShadowVisible: false,
        headerTintColor: "#fff",
        headerTitleAlign: "left",
        headerTitleStyle: { fontSize: 24, fontWeight: "800" },
        headerRight: () => (
          <TouchableOpacity style={styles.logout} onPress={confirmLogout} activeOpacity={0.8}>
            <Ionicons name="log-out-outline" size={18} color="#fff" />
            <Text style={styles.logoutText}>Log out</Text>
          </TouchableOpacity>
        ),

        // Tab bar: white, rounded at the top, with a soft shadow
        tabBarActiveTintColor: GREEN,
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarLabelStyle: { fontSize: 12, fontWeight: "700" },
        tabBarStyle: {
          height: 66 + insets.bottom,
          paddingTop: 8,
          paddingBottom: 8 + insets.bottom,
          backgroundColor: "#fff",
          borderTopWidth: 0,
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          elevation: 16,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="courts"
        options={{
          title: "Courts",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "basketball" : "basketball-outline"}
              color={color}
              size={size}
            />
          ),
        }}
      />
      {/* Regular users only. The admin manages bookings in the Admin tab. */}
      <Tabs.Screen
        name="my-bookings"
        options={{
          title: "My Bookings",
          href: isAdmin ? null : undefined,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "calendar" : "calendar-outline"}
              color={color}
              size={size}
            />
          ),
        }}
      />
      {/* Admin only */}
      <Tabs.Screen
        name="admin"
        options={{
          title: "Admin",
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "shield-checkmark" : "shield-checkmark-outline"}
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerBg: {
    flex: 1,
    backgroundColor: NAVY,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  logout: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginRight: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  logoutText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});