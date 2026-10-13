import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BookingWithCourt, deleteBooking, getBookings } from "../../database/db";

type Tab = "upcoming" | "past";

function fmt(hour: number, minute: number) {
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour < 12 ? "AM" : "PM"}`;
}

function timeRange(start: string, duration: number) {
  const [h, m] = start.split(":").map(Number);
  return `${fmt(h, m)} – ${fmt(h + duration, m)}`;
}

// When the booking ends, as a Date in local time
function endsAt(b: BookingWithCourt) {
  const [y, mo, d] = b.date.split("-").map(Number);
  const [h, m] = b.start_time.split(":").map(Number);
  return new Date(y, mo - 1, d, h + b.duration, m);
}

export default function MyBookingsScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingWithCourt[]>([]);
  const [tab, setTab] = useState<Tab>("upcoming");

  const load = useCallback(() => {
    getBookings().then(setBookings);
  }, []);

  useFocusEffect(load);

  const now = new Date();
  const upcoming = bookings
    .filter((b) => endsAt(b) > now)
    .sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time));
  const past = bookings
    .filter((b) => endsAt(b) <= now)
    .sort((a, b) => (b.date + b.start_time).localeCompare(a.date + a.start_time));

  const shown = tab === "upcoming" ? upcoming : past;

  function confirmRemove(b: BookingWithCourt) {
    const isPast = tab === "past";
    Alert.alert(
      isPast ? "Remove from history?" : "Cancel booking?",
      `${b.court_name} on ${b.date}`,
      [
        { text: "Keep it", style: "cancel" },
        {
          text: isPast ? "Remove" : "Cancel booking",
          style: "destructive",
          onPress: async () => {
            await deleteBooking(b.id);
            load();
          },
        },
      ]
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Upcoming / Past tabs */}
      <View style={styles.tabs}>
        {(["upcoming", "past"] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tab, tab === t && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === "upcoming"
                ? `Upcoming (${upcoming.length})`
                : `Past (${past.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={shown}
        keyExtractor={(b) => String(b.id)}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {tab === "upcoming" ? "No upcoming bookings." : "No past bookings yet."}
            </Text>
            <Text style={styles.emptySub}>
              {tab === "upcoming"
                ? "Pick a court and book a time slot."
                : "Finished bookings will show up here."}
            </Text>
          </View>
        }
        ListFooterComponent={
          shown.length > 0 ? (
            <Text style={styles.footer}>
              Bookings are saved in this app only. Contact the venue to confirm your slot.
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={[styles.card, tab === "past" && styles.cardPast]}>
            <Text style={styles.title}>{item.court_name}</Text>
            <Text style={styles.sub}>
              {item.sport_type} · Court {item.court_number}
            </Text>
            <Text style={[styles.when, tab === "past" && styles.whenPast]}>
              {item.date} · {timeRange(item.start_time, item.duration)}
            </Text>
            <Text style={styles.sub}>Activity: {item.activity}</Text>
            <Text style={styles.sub}>
              {item.name} · {item.contact_number} · {item.duration} hr
              {item.duration > 1 ? "s" : ""}
            </Text>
            <View style={styles.actions}>
              {tab === "upcoming" && (
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() =>
                    router.push({
                      pathname: "/edit-booking/[id]",
                      params: { id: String(item.id) },
                    })
                  }
                >
                  <Text style={styles.editText}>Reschedule</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.cancelBtn} onPress={() => confirmRemove(item)}>
                <Text style={styles.cancelText}>
                  {tab === "upcoming" ? "Cancel" : "Remove"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
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
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  tabActive: { backgroundColor: "#0B2A5B" },
  tabText: { fontWeight: "600", color: "#374151" },
  tabTextActive: { color: "#fff" },
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 18, fontWeight: "600", color: "#374151" },
  emptySub: { marginTop: 4, color: "#6B7280" },
  footer: { marginTop: 4, color: "#6B7280", fontSize: 13, fontStyle: "italic" },
  card: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 2,
  },
  cardPast: { opacity: 0.75 },
  title: { fontSize: 16, fontWeight: "bold" },
  sub: { color: "#6B7280", marginTop: 2 },
  when: { color: "#16A34A", fontWeight: "600", marginTop: 6 },
  whenPast: { color: "#6B7280" },
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