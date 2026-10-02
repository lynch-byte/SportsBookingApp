import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BookingWithCourt, getBookings } from "../../database/db";

function todayStr() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export default function HomeScreen() {
  const router = useRouter();
  const [next, setNext] = useState<BookingWithCourt | null>(null);

  useFocusEffect(
    useCallback(() => {
      getBookings().then((all) => {
        const upcoming = all
          .filter((b) => b.date >= todayStr())
          .sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time));
        setNext(upcoming[0] ?? null);
      });
    }, [])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sports Court Booking</Text>
      <Text style={styles.sub}>Find and reserve courts in Tagum City</Text>

      <TouchableOpacity style={styles.primary} onPress={() => router.navigate("/(tabs)/courts")}>
        <Text style={styles.primaryText}>Browse courts</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.secondary}
        onPress={() => router.navigate("/(tabs)/my-bookings")}
      >
        <Text style={styles.secondaryText}>My bookings</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>NEXT BOOKING</Text>
        {next ? (
          <>
            <Text style={styles.cardTitle}>{next.court_name}</Text>
            <Text style={styles.cardWhen}>
              {next.date} at {next.start_time} · {next.duration} hr
              {next.duration > 1 ? "s" : ""}
            </Text>
          </>
        ) : (
          <Text style={styles.cardEmpty}>No upcoming bookings.</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "bold", color: "#0B2A5B" },
  sub: { color: "#6B7280", marginTop: 4, marginBottom: 28 },
  primary: {
    backgroundColor: "#0B2A5B",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  secondary: {
    marginTop: 12,
    backgroundColor: "#DCFCE7",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryText: { color: "#166534", fontWeight: "700", fontSize: 16 },
  card: { marginTop: 28, padding: 16, backgroundColor: "#fff", borderRadius: 12, elevation: 2 },
  cardLabel: { fontSize: 12, fontWeight: "600", color: "#6B7280" },
  cardTitle: { fontSize: 18, fontWeight: "bold", marginTop: 6 },
  cardWhen: { color: "#16A34A", fontWeight: "600", marginTop: 4 },
  cardEmpty: { marginTop: 6, color: "#6B7280" },
});