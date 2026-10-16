import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import AdminBookings from "../../components/AdminBookings";
import AdminVenues from "../../components/AdminVenues";

type Section = "bookings" | "venues";

export default function AdminScreen() {
  const [section, setSection] = useState<Section>("bookings");

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.tabs}>
        {(["bookings", "venues"] as Section[]).map((s) => (
          <TouchableOpacity
            key={s}
            onPress={() => setSection(s)}
            style={[styles.tab, section === s && styles.tabActive]}
          >
            <Text style={[styles.tabText, section === s && styles.tabTextActive]}>
              {s === "bookings" ? "Bookings" : "Venues"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {section === "bookings" ? <AdminBookings /> : <AdminVenues />}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: "row",
    margin: 16,
    marginBottom: 0,
    padding: 4,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  tabActive: { backgroundColor: "#0B2A5B" },
  tabText: { fontWeight: "600", color: "#374151" },
  tabTextActive: { color: "#fff" },
});