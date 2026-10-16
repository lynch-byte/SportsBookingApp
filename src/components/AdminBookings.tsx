import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import {
    BookingWithCourt,
    cancelBookingByAdmin,
    deleteBooking,
    getBookings,
} from "../database/db";
import { estimateTotal, formatMoney } from "./PriceSummary";

type Filter = "upcoming" | "past" | "cancelled";

const REASONS = [
  "Court under maintenance",
  "Venue closed",
  "Double booking",
  "Bad weather",
  "Other",
];

function toDateStr(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function fmt(hour: number, minute: number) {
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour < 12 ? "AM" : "PM"}`;
}

function timeRange(start: string, duration: number) {
  const [h, m] = start.split(":").map(Number);
  return `${fmt(h, m)} – ${fmt(h + duration, m)}`;
}

function endsAt(b: BookingWithCourt) {
  const [y, mo, d] = b.date.split("-").map(Number);
  const [h, m] = b.start_time.split(":").map(Number);
  return new Date(y, mo - 1, d, h + b.duration, m);
}

function priceText(b: BookingWithCourt) {
  if (b.price_from === null) return "Price on inquiry";
  if (b.price_from === 0) return "Free";
  if (b.price_unit === "person") return `${formatMoney(b.price_from)} / person`;
  const total = estimateTotal(b.price_from, b.price_unit, b.duration);
  return `Est. total ${formatMoney(total ?? 0)}`;
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState<BookingWithCourt[]>([]);
  const [filter, setFilter] = useState<Filter>("upcoming");
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState<BookingWithCourt | null>(null);
  const [note, setNote] = useState("");

  const load = useCallback(() => {
    getBookings().then(setBookings);
  }, []);

  useFocusEffect(load);

  const now = new Date();
  const today = toDateStr(now);
  const cancelled = (b: BookingWithCourt) => b.status === "cancelled";
  const ended = (b: BookingWithCourt) => endsAt(b) <= now;

  const upcoming = bookings
    .filter((b) => !cancelled(b) && !ended(b))
    .sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time));
  const past = bookings
    .filter((b) => !cancelled(b) && ended(b))
    .sort((a, b) => (b.date + b.start_time).localeCompare(a.date + a.start_time));
  const cancelledList = bookings
    .filter(cancelled)
    .sort((a, b) => (b.date + b.start_time).localeCompare(a.date + a.start_time));
  const todayCount = bookings.filter((b) => !cancelled(b) && b.date === today).length;

  const base = filter === "upcoming" ? upcoming : filter === "past" ? past : cancelledList;
  const q = query.trim().toLowerCase();
  const shown = q
    ? base.filter(
        (b) =>
          b.court_name.toLowerCase().includes(q) ||
          b.name.toLowerCase().includes(q) ||
          b.contact_number.toLowerCase().includes(q) ||
          b.date.includes(q)
      )
    : base;

  function openCancel(b: BookingWithCourt) {
    setNote("");
    setTarget(b);
  }

  async function confirmCancel() {
    if (!target) return;
    await cancelBookingByAdmin(target.id, note);
    setTarget(null);
    load();
  }

  function confirmDelete(b: BookingWithCourt) {
    Alert.alert("Delete this record?", `${b.court_name} on ${b.date}`, [
      { text: "Keep it", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteBooking(b.id);
          load();
        },
      },
    ]);
  }

  const filters: { key: Filter; label: string }[] = [
    { key: "upcoming", label: `Upcoming (${upcoming.length})` },
    { key: "past", label: `Past (${past.length})` },
    { key: "cancelled", label: `Cancelled (${cancelledList.length})` },
  ];

  return (
    <View style={{ flex: 1 }}>
      {/* Summary */}
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{upcoming.length}</Text>
          <Text style={styles.statLabel}>Upcoming</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{todayCount}</Text>
          <Text style={styles.statLabel}>Today</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{cancelledList.length}</Text>
          <Text style={styles.statLabel}>Cancelled</Text>
        </View>
      </View>

      <TextInput
        style={styles.search}
        value={query}
        onChangeText={setQuery}
        placeholder="Search venue, name, phone, or date"
        autoCorrect={false}
        autoCapitalize="none"
      />

      <View style={styles.filters}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={[styles.filter, filter === f.key && styles.filterActive]}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={shown}
        keyExtractor={(b) => String(b.id)}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No bookings here.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isCancelled = cancelled(item);
          const isEnded = ended(item);
          return (
            <View style={[styles.card, isEnded && !isCancelled && styles.cardPast]}>
              <View style={styles.titleRow}>
                <Text style={styles.title}>{item.court_name}</Text>
                <View
                  style={[
                    styles.badge,
                    isCancelled ? styles.badgeRed : isEnded ? styles.badgeGray : styles.badgeGreen,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      isCancelled
                        ? styles.badgeTextRed
                        : isEnded
                        ? styles.badgeTextGray
                        : styles.badgeTextGreen,
                    ]}
                  >
                    {isCancelled ? "Cancelled" : isEnded ? "Completed" : "Confirmed"}
                  </Text>
                </View>
              </View>
              <Text style={styles.sub}>
                {item.sport_type} · Court {item.court_number}
              </Text>
              <Text style={[styles.when, (isEnded || isCancelled) && styles.whenPast]}>
                {item.date} · {timeRange(item.start_time, item.duration)}
              </Text>
              <Text style={styles.sub}>
                Booked by {item.name} · {item.contact_number}
              </Text>
              <Text style={styles.sub}>
                {item.activity} · {item.duration} hr{item.duration > 1 ? "s" : ""}
              </Text>

              {isCancelled ? (
                <View style={styles.noteBox}>
                  <Text style={styles.noteTitle}>Reason given to the user</Text>
                  <Text style={styles.noteText}>{item.admin_note || "No reason was given."}</Text>
                </View>
              ) : (
                <Text style={styles.price}>{priceText(item)}</Text>
              )}

              <View style={styles.actions}>
                {!isCancelled && !isEnded && (
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => openCancel(item)}>
                    <Text style={styles.cancelText}>Cancel booking</Text>
                  </TouchableOpacity>
                )}
                {(isCancelled || isEnded) && (
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => confirmDelete(item)}>
                    <Text style={styles.deleteText}>Delete record</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
      />

      {/* Cancel with a reason */}
      <Modal visible={!!target} transparent animationType="fade" onRequestClose={() => setTarget(null)}>
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Cancel this booking?</Text>
            {target && (
              <Text style={styles.sheetSub}>
                {target.court_name} · Court {target.court_number}
                {"\n"}
                {target.date} · {timeRange(target.start_time, target.duration)}
                {"\n"}
                {target.name}
              </Text>
            )}

            <Text style={styles.sheetLabel}>Reason (the user will see this)</Text>
            <View style={styles.reasonRow}>
              {REASONS.map((r) => (
                <TouchableOpacity
                  key={r}
                  onPress={() => setNote(r)}
                  style={[styles.reasonChip, note === r && styles.reasonChipActive]}
                >
                  <Text style={[styles.reasonText, note === r && styles.reasonTextActive]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.noteInput}
              value={note}
              onChangeText={setNote}
              placeholder="Or type your own reason"
              multiline
            />

            <View style={styles.sheetActions}>
              <TouchableOpacity style={styles.keepBtn} onPress={() => setTarget(null)}>
                <Text style={styles.keepText}>Keep booking</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={confirmCancel}>
                <Text style={styles.confirmText}>Cancel booking</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: "row", gap: 10, padding: 16, paddingBottom: 8 },
  stat: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    elevation: 2,
  },
  statNum: { fontSize: 22, fontWeight: "800", color: "#0B2A5B" },
  statLabel: { color: "#6B7280", fontSize: 12 },

  search: {
    marginHorizontal: 16,
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  filters: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingTop: 12 },
  filter: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#E5E7EB",
  },
  filterActive: { backgroundColor: "#0B2A5B" },
  filterText: { color: "#374151", fontWeight: "600", fontSize: 12 },
  filterTextActive: { color: "#fff" },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", marginTop: 40 },
  emptyText: { color: "#6B7280", fontSize: 16 },

  card: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 2,
  },
  cardPast: { opacity: 0.8 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  title: { flex: 1, fontSize: 16, fontWeight: "bold" },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  badgeGreen: { backgroundColor: "#DCFCE7" },
  badgeGray: { backgroundColor: "#E5E7EB" },
  badgeRed: { backgroundColor: "#FEE2E2" },
  badgeText: { fontSize: 11, fontWeight: "700" },
  badgeTextGreen: { color: "#166534" },
  badgeTextGray: { color: "#4B5563" },
  badgeTextRed: { color: "#991B1B" },
  sub: { color: "#6B7280", marginTop: 2 },
  when: { color: "#16A34A", fontWeight: "600", marginTop: 6 },
  whenPast: { color: "#6B7280" },
  price: { marginTop: 6, fontWeight: "700", color: "#16A34A" },
  noteBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  noteTitle: { color: "#991B1B", fontWeight: "700" },
  noteText: { color: "#7F1D1D", marginTop: 2 },
  actions: { flexDirection: "row", gap: 10, marginTop: 12 },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
  },
  cancelText: { color: "#B91C1C", fontWeight: "600" },
  deleteBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#E5E7EB",
  },
  deleteText: { color: "#374151", fontWeight: "600" },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 20,
  },
  sheet: { backgroundColor: "#fff", borderRadius: 16, padding: 18 },
  sheetTitle: { fontSize: 18, fontWeight: "800", color: "#111827" },
  sheetSub: { marginTop: 6, color: "#6B7280", lineHeight: 20 },
  sheetLabel: { marginTop: 14, marginBottom: 6, fontWeight: "600", color: "#374151" },
  reasonRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  reasonChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#E5E7EB",
  },
  reasonChipActive: { backgroundColor: "#0B2A5B" },
  reasonText: { color: "#374151", fontSize: 13, fontWeight: "500" },
  reasonTextActive: { color: "#fff" },
  noteInput: {
    marginTop: 10,
    minHeight: 60,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    padding: 10,
    textAlignVertical: "top",
  },
  sheetActions: { flexDirection: "row", gap: 10, marginTop: 16 },
  keepBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
  },
  keepText: { fontWeight: "700", color: "#374151" },
  confirmBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#DC2626",
    alignItems: "center",
  },
  confirmText: { fontWeight: "700", color: "#fff" },
});