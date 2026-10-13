import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BookingWithCourt, deleteBooking, getBookings } from "../../database/db";

type Tab = "upcoming" | "past" | "calendar";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

  const todayStr = toDateStr(new Date());
  const [selected, setSelected] = useState(todayStr);
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const load = useCallback(() => {
    getBookings().then(setBookings);
  }, []);

  useFocusEffect(load);

  const now = new Date();
  const isPast = (b: BookingWithCourt) => endsAt(b) <= now;

  const upcoming = bookings
    .filter((b) => !isPast(b))
    .sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time));
  const past = bookings
    .filter((b) => isPast(b))
    .sort((a, b) => (b.date + b.start_time).localeCompare(a.date + a.start_time));

  // Calendar data
  const countByDate: Record<string, number> = {};
  bookings.forEach((b) => {
    countByDate[b.date] = (countByDate[b.date] ?? 0) + 1;
  });

  const firstWeekday = new Date(cursor.year, cursor.month, 1).getDay();
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  function dayStr(day: number) {
    const m = String(cursor.month + 1).padStart(2, "0");
    return `${cursor.year}-${m}-${String(day).padStart(2, "0")}`;
  }

  function changeMonth(delta: number) {
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  const dayBookings = bookings
    .filter((b) => b.date === selected)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const [sy, sm, sd] = selected.split("-").map(Number);
  const selectedLabel = `${WEEKDAYS[new Date(sy, sm - 1, sd).getDay()]}, ${MONTHS[sm - 1]} ${sd}`;

  function confirmRemove(b: BookingWithCourt) {
    const past_ = isPast(b);
    Alert.alert(
      past_ ? "Remove from history?" : "Cancel booking?",
      `${b.court_name} on ${b.date}`,
      [
        { text: "Keep it", style: "cancel" },
        {
          text: past_ ? "Remove" : "Cancel booking",
          style: "destructive",
          onPress: async () => {
            await deleteBooking(b.id);
            load();
          },
        },
      ]
    );
  }

  function renderBooking(item: BookingWithCourt) {
    const past_ = isPast(item);
    return (
      <View key={item.id} style={[styles.card, past_ && styles.cardPast]}>
        <Text style={styles.title}>{item.court_name}</Text>
        <Text style={styles.sub}>
          {item.sport_type} · Court {item.court_number}
        </Text>
        <Text style={[styles.when, past_ && styles.whenPast]}>
          {item.date} · {timeRange(item.start_time, item.duration)}
        </Text>
        <Text style={styles.sub}>Activity: {item.activity}</Text>
        <Text style={styles.sub}>
          {item.name} · {item.contact_number} · {item.duration} hr
          {item.duration > 1 ? "s" : ""}
        </Text>
        <View style={styles.actions}>
          {!past_ && (
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
            <Text style={styles.cancelText}>{past_ ? "Remove" : "Cancel"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const notice = (
    <Text style={styles.footer}>
      Bookings are saved in this app only. Contact the venue to confirm your slot.
    </Text>
  );

  const tabs: { key: Tab; label: string }[] = [
    { key: "upcoming", label: `Upcoming (${upcoming.length})` },
    { key: "past", label: `Past (${past.length})` },
    { key: "calendar", label: "Calendar" },
  ];

  const listData = tab === "upcoming" ? upcoming : past;

  return (
    <View style={{ flex: 1 }}>
      {/* Tabs */}
      <View style={styles.tabs}>
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.key}
            onPress={() => setTab(t.key)}
            style={[styles.tab, tab === t.key && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === "calendar" ? (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <View style={styles.calCard}>
            {/* Month header */}
            <View style={styles.calHeader}>
              <TouchableOpacity style={styles.navBtn} onPress={() => changeMonth(-1)}>
                <Text style={styles.navText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.monthText}>
                {MONTHS[cursor.month]} {cursor.year}
              </Text>
              <TouchableOpacity style={styles.navBtn} onPress={() => changeMonth(1)}>
                <Text style={styles.navText}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Weekday names */}
            <View style={styles.weekRow}>
              {WEEKDAYS.map((w) => (
                <Text key={w} style={styles.weekday}>
                  {w}
                </Text>
              ))}
            </View>

            {/* Days */}
            <View style={styles.grid}>
              {cells.map((day, i) => {
                if (day === null) return <View key={i} style={styles.cell} />;
                const ds = dayStr(day);
                const isSelected = ds === selected;
                const isToday = ds === todayStr;
                const hasBooking = !!countByDate[ds];
                return (
                  <TouchableOpacity
                    key={i}
                    style={styles.cell}
                    onPress={() => setSelected(ds)}
                  >
                    <View
                      style={[
                        styles.dayCircle,
                        isToday && styles.dayToday,
                        isSelected && styles.daySelected,
                      ]}
                    >
                      <Text
                        style={[styles.dayText, isSelected && styles.dayTextSelected]}
                      >
                        {day}
                      </Text>
                    </View>
                    {hasBooking && <View style={styles.dot} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.legend}>● = day with a booking</Text>
          </View>

          <Text style={styles.selectedLabel}>{selectedLabel}</Text>
          {dayBookings.length === 0 ? (
            <Text style={styles.emptyDay}>No bookings on this day.</Text>
          ) : (
            dayBookings.map(renderBooking)
          )}
          {notice}
        </ScrollView>
      ) : (
        <FlatList
          data={listData}
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
          ListFooterComponent={listData.length > 0 ? notice : null}
          renderItem={({ item }) => renderBooking(item)}
        />
      )}
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
  tabText: { fontWeight: "600", color: "#374151", fontSize: 13 },
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

  // Calendar
  calCard: {
    padding: 12,
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 2,
  },
  calHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E5E7EB",
  },
  navText: { fontSize: 24, lineHeight: 26, color: "#0B2A5B", fontWeight: "700" },
  monthText: { fontSize: 18, fontWeight: "bold", color: "#0B2A5B" },
  weekRow: { flexDirection: "row", marginBottom: 4 },
  weekday: {
    width: `${100 / 7}%`,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: {
    width: `${100 / 7}%`,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  dayToday: { borderWidth: 1.5, borderColor: "#0B2A5B" },
  daySelected: { backgroundColor: "#0B2A5B" },
  dayText: { color: "#111827", fontWeight: "500" },
  dayTextSelected: { color: "#fff", fontWeight: "700" },
  dot: {
    position: "absolute",
    bottom: 1,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#16A34A",
  },
  legend: { marginTop: 8, color: "#6B7280", fontSize: 12 },
  selectedLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0B2A5B",
    marginBottom: 8,
  },
  emptyDay: { color: "#6B7280", marginBottom: 12 },
});