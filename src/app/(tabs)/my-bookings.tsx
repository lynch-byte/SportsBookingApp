import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BookingWithCourt, deleteBooking, getBookings } from "../../database/db";

function fmt(hour: number, minute: number) {
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour < 12 ? "AM" : "PM"}`;
}

function timeRange(start: string, duration: number) {
  const [h, m] = start.split(":").map(Number);
  return `${fmt(h, m)} – ${fmt(h + duration, m)}`;
}

export default function MyBookingsScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingWithCourt[]>([]);

  const load = useCallback(() => {
    getBookings().then(setBookings);
  }, []);

  useFocusEffect(load);

  function confirmCancel(b: BookingWithCourt) {
    Alert.alert("Cancel booking?", `${b.court_name} on ${b.date}`, [
      { text: "Keep it", style: "cancel" },
      {
        text: "Cancel booking",
        style: "destructive",
        onPress: async () => {
          await deleteBooking(b.id);
          load();
        },
      },
    ]);
  }

  return (
    <FlatList
      data={bookings}
      keyExtractor={(b) => String(b.id)}
      contentContainerStyle={{ padding: 16, flexGrow: 1 }}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No bookings yet.</Text>
          <Text style={styles.emptySub}>Pick a court and book a time slot.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.title}>{item.court_name}</Text>
            <Text style={styles.sub}>
            {item.sport_type} · Court {item.court_number}
          </Text>
          <Text style={styles.when}>
            {item.date} · {timeRange(item.start_time, item.duration)}
          </Text>
          <Text style={styles.sub}>
            {item.name} · {item.contact_number} · {item.duration} hr
            {item.duration > 1 ? "s" : ""}
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() =>
                router.push({ pathname: "/edit-booking/[id]", params: { id: String(item.id) } })
              }
            >
              <Text style={styles.editText}>Reschedule</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => confirmCancel(item)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 18, fontWeight: "600", color: "#374151" },
  emptySub: { marginTop: 4, color: "#6B7280" },
  card: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 2,
  },
  title: { fontSize: 16, fontWeight: "bold" },
  sub: { color: "#6B7280", marginTop: 2 },
  when: { color: "#16A34A", fontWeight: "600", marginTop: 6 },
  actions: { flexDirection: "row", gap: 10, marginTop: 12 },
  editBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#0B2A5B",
  },
  editText: { color: "#fff", fontWeight: "600" },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
  },
  cancelText: { color: "#B91C1C", fontWeight: "600" },
});