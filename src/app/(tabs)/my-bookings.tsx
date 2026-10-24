import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { ComponentProps, useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { estimateTotal, formatMoney } from "../../components/PriceSummary";
import { useAuth } from "../../context/AuthContext";
import { BookingWithCourt, deleteBooking, getBookings } from "../../database/db";

const NAVY = "#0B2A5B";
const GREEN = "#16A34A";

type Tab = "upcoming" | "past" | "calendar";
type IconName = ComponentProps<typeof Ionicons>["name"];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Same sport icons and colours as the Courts screen
const SPORT_STYLE: Record<string, { icon: IconName; color: string }> = {
  Pickleball: { icon: "tennisball-outline", color: "#16A34A" },
  Basketball: { icon: "basketball-outline", color: "#EA580C" },
  Badminton: { icon: "flash-outline", color: "#7C3AED" },
  Tennis: { icon: "tennisball-outline", color: "#65A30D" },
  Volleyball: { icon: "baseball-outline", color: "#F59E0B" },
  Football: { icon: "football-outline", color: "#15803D" },
  Futsal: { icon: "football-outline", color: "#0D9488" },
  Swimming: { icon: "water-outline", color: "#0284C7" },
  "Table Tennis": { icon: "radio-button-on-outline", color: "#DC2626" },
  Athletics: { icon: "walk-outline", color: "#EA580C" },
  "Martial Arts": { icon: "fitness-outline", color: "#B91C1C" },
  "Sepak Takraw": { icon: "ellipse-outline", color: "#CA8A04" },
  Archery: { icon: "locate-outline", color: "#4F46E5" },
  "Gymnastics & Dance": { icon: "musical-notes-outline", color: "#DB2777" },
  Chess: { icon: "extension-puzzle-outline", color: "#475569" },
};

function sportStyle(sport: string) {
  return SPORT_STYLE[sport] ?? { icon: "trophy-outline" as IconName, color: NAVY };
}

function toDateStr(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

// "2026-10-19" -> "Mon, Oct 19"
function niceDate(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return `${WEEKDAYS[new Date(y, m - 1, d).getDay()]}, ${MONTHS[m - 1].slice(0, 3)} ${d}`;
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

// Price line shown on each booking card
function priceText(b: BookingWithCourt) {
  if (b.price_from === null) return "Price on inquiry";
  if (b.price_from === 0) return "Free";
  if (b.price_unit === "person") return `${formatMoney(b.price_from)} / person`;
  const total = estimateTotal(b.price_from, b.price_unit, b.duration);
  return `Est. total ${formatMoney(total ?? 0)}`;
}

export default function MyBookingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingWithCourt[]>([]);
  const [tab, setTab] = useState<Tab>("upcoming");

  const todayStr = toDateStr(new Date());
  const [selected, setSelected] = useState(todayStr);
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const userId = user?.id;
  const load = useCallback(() => {
    if (userId !== undefined) getBookings(userId).then(setBookings);
  }, [userId]);

  useFocusEffect(load);

  const now = new Date();
  const isCancelled = (b: BookingWithCourt) => b.status === "cancelled";
  const hasEnded = (b: BookingWithCourt) => endsAt(b) <= now;

  // Upcoming = confirmed and not finished. Past = finished or cancelled.
  const upcoming = bookings
    .filter((b) => !isCancelled(b) && !hasEnded(b))
    .sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time));
  const past = bookings
    .filter((b) => isCancelled(b) || hasEnded(b))
    .sort((a, b) => (b.date + b.start_time).localeCompare(a.date + a.start_time));

  // Cancelled by the admin and still in the future: the user should notice these
  const newlyCancelled = bookings.filter((b) => isCancelled(b) && !hasEnded(b));

  // Calendar data (cancelled bookings are not shown)
  const active = bookings.filter((b) => !isCancelled(b));
  const countByDate: Record<string, number> = {};
  active.forEach((b) => {
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

  const dayBookings = active
    .filter((b) => b.date === selected)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const [sy, sm, sd] = selected.split("-").map(Number);
  const selectedLabel = `${WEEKDAYS[new Date(sy, sm - 1, sd).getDay()]}, ${MONTHS[sm - 1]} ${sd}`;

  function confirmRemove(b: BookingWithCourt) {
    const finished = isCancelled(b) || hasEnded(b);
    Alert.alert(
      finished ? "Remove from history?" : "Cancel booking?",
      `${b.court_name} on ${b.date}`,
      [
        { text: "Keep it", style: "cancel" },
        {
          text: finished ? "Remove" : "Cancel booking",
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
    const cancelled = isCancelled(item);
    const ended = hasEnded(item);
    const canChange = !cancelled && !ended;
    const sport = sportStyle(item.sport_type);

    const badge = cancelled
      ? { text: "Cancelled", bg: "#FEE2E2", fg: "#991B1B", icon: "close-circle" as IconName }
      : ended
      ? { text: "Completed", bg: "#E5E7EB", fg: "#4B5563", icon: "checkmark-done" as IconName }
      : { text: "Confirmed", bg: "#DCFCE7", fg: "#166534", icon: "checkmark-circle" as IconName };

    return (
      <View
        key={item.id}
        style={[styles.card, (ended || cancelled) && styles.cardMuted]}
      >
        {/* Top: sport icon, venue, status */}
        <View style={styles.cardTop}>
          <View style={[styles.sportIcon, { backgroundColor: sport.color + "1F" }]}>
            <Ionicons name={sport.icon} size={24} color={sport.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={2}>
              {item.court_name}
            </Text>
            <Text style={styles.sub}>
              {item.sport_type} · Court {item.court_number}
            </Text>
          </View>
        </View>

        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
          <Ionicons name={badge.icon} size={14} color={badge.fg} />
          <Text style={[styles.badgeText, { color: badge.fg }]}>{badge.text}</Text>
        </View>

        {/* Details */}
        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={17} color={NAVY} />
            <Text style={styles.infoText}>{niceDate(item.date)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={17} color={NAVY} />
            <Text style={styles.infoText}>
              {timeRange(item.start_time, item.duration)} · {item.duration} hr
              {item.duration > 1 ? "s" : ""}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="flag-outline" size={17} color={NAVY} />
            <Text style={styles.infoText}>{item.activity}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={17} color={NAVY} />
            <Text style={styles.infoText}>
              {item.name} · {item.contact_number}
            </Text>
          </View>
        </View>

        {cancelled ? (
          <View style={styles.noteBox}>
            <View style={styles.noteHead}>
              <Ionicons name="alert-circle" size={16} color="#991B1B" />
              <Text style={styles.noteTitle}>Cancelled by the administrator</Text>
            </View>
            <Text style={styles.noteText}>{item.admin_note || "No reason was given."}</Text>
          </View>
        ) : (
          <Text style={styles.price}>{priceText(item)}</Text>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {canChange && (
            <TouchableOpacity
              style={styles.editBtn}
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: "/edit-booking/[id]",
                  params: { id: String(item.id) },
                })
              }
            >
              <Ionicons name="create-outline" size={16} color="#fff" />
              <Text style={styles.editText}>Reschedule</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.cancelBtn}
            activeOpacity={0.85}
            onPress={() => confirmRemove(item)}
          >
            <Ionicons
              name={canChange ? "close-outline" : "trash-outline"}
              size={16}
              color="#B91C1C"
            />
            <Text style={styles.cancelText}>{canChange ? "Cancel" : "Remove"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const notice = (
    <View style={styles.noticeRow}>
      <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
      <Text style={styles.noticeText}>
        Bookings are confirmed right away. Prices are estimates; contact the venue for
        the final amount.
      </Text>
    </View>
  );

  const tabs: { key: Tab; label: string; icon: IconName }[] = [
    { key: "upcoming", label: `Upcoming (${upcoming.length})`, icon: "time-outline" },
    { key: "past", label: `Past (${past.length})`, icon: "checkmark-done-outline" },
    { key: "calendar", label: "Calendar", icon: "calendar-outline" },
  ];

  const listData = tab === "upcoming" ? upcoming : past;

  const banner =
    newlyCancelled.length > 0 ? (
      <TouchableOpacity style={styles.banner} onPress={() => setTab("past")} activeOpacity={0.85}>
        <Ionicons name="alert-circle" size={22} color="#B91C1C" />
        <Text style={styles.bannerText}>
          {newlyCancelled.length === 1
            ? "1 of your bookings was cancelled by the administrator."
            : `${newlyCancelled.length} of your bookings were cancelled by the administrator.`}{" "}
          Tap to see why.
        </Text>
        <Ionicons name="chevron-forward" size={18} color="#B91C1C" />
      </TouchableOpacity>
    ) : null;

  return (
    <View style={{ flex: 1 }}>
      {/* Tabs */}
      <View style={styles.tabs}>
        {tabs.map((t) => {
          const on = tab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              onPress={() => setTab(t.key)}
              style={[styles.tab, on && styles.tabActive]}
              activeOpacity={0.85}
            >
              <Ionicons name={t.icon} size={15} color={on ? "#fff" : "#6B7280"} />
              <Text style={[styles.tabText, on && styles.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {tab === "calendar" ? (
        <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
          <View style={styles.calCard}>
            {/* Month header */}
            <View style={styles.calHeader}>
              <TouchableOpacity style={styles.navBtn} onPress={() => changeMonth(-1)}>
                <Ionicons name="chevron-back" size={20} color={NAVY} />
              </TouchableOpacity>
              <Text style={styles.monthText}>
                {MONTHS[cursor.month]} {cursor.year}
              </Text>
              <TouchableOpacity style={styles.navBtn} onPress={() => changeMonth(1)}>
                <Ionicons name="chevron-forward" size={20} color={NAVY} />
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
                    {hasBooking && (
                      <View style={[styles.dot, isSelected && { backgroundColor: "#fff" }]} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.legendRow}>
              <View style={styles.legendDot} />
              <Text style={styles.legend}>Day with a booking</Text>
            </View>
          </View>

          <Text style={styles.selectedLabel}>{selectedLabel}</Text>
          {dayBookings.length === 0 ? (
            <View style={styles.dayEmpty}>
              <Ionicons name="calendar-clear-outline" size={22} color="#9CA3AF" />
              <Text style={styles.emptyDay}>No bookings on this day.</Text>
            </View>
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
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={tab === "upcoming" ? banner : null}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name={tab === "upcoming" ? "calendar-clear-outline" : "time-outline"}
                  size={30}
                  color="#9CA3AF"
                />
              </View>
              <Text style={styles.emptyText}>
                {tab === "upcoming" ? "No upcoming bookings" : "No past bookings yet"}
              </Text>
              <Text style={styles.emptySub}>
                {tab === "upcoming"
                  ? "Pick a court and reserve a time slot."
                  : "Finished and cancelled bookings will show up here."}
              </Text>
              {tab === "upcoming" && (
                <TouchableOpacity
                  style={styles.emptyBtn}
                  onPress={() => router.navigate("/(tabs)/courts")}
                  activeOpacity={0.85}
                >
                  <Text style={styles.emptyBtnText}>Find a court</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          ListFooterComponent={listData.length > 0 ? notice : null}
          renderItem={({ item }) => renderBooking(item)}
        />
      )}
    </View>
  );
}

const shadow = {
  elevation: 3,
  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 3 },
};

const styles = StyleSheet.create({
  tabs: {
    flexDirection: "row",
    margin: 16,
    marginBottom: 0,
    padding: 4,
    borderRadius: 16,
    backgroundColor: "#fff",
    ...shadow,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
    borderRadius: 12,
  },
  tabActive: { backgroundColor: NAVY },
  tabText: { fontWeight: "700", color: "#6B7280", fontSize: 12 },
  tabTextActive: { color: "#fff" },

  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  bannerText: { flex: 1, color: "#991B1B", fontWeight: "600", fontSize: 13 },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 40 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyText: { fontSize: 18, fontWeight: "800", color: "#374151" },
  emptySub: { marginTop: 4, color: "#6B7280", textAlign: "center", paddingHorizontal: 24 },
  emptyBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: NAVY,
  },
  emptyBtnText: { color: "#fff", fontWeight: "700" },

  noticeRow: { flexDirection: "row", alignItems: "flex-start", gap: 6, marginTop: 4 },
  noticeText: { flex: 1, color: "#6B7280", fontSize: 12, fontStyle: "italic" },

  card: {
    padding: 16,
    marginBottom: 14,
    backgroundColor: "#fff",
    borderRadius: 20,
    ...shadow,
  },
  cardMuted: { opacity: 0.85 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  sportIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 17, fontWeight: "800", color: "#111827" },
  sub: { color: "#6B7280", marginTop: 2, fontSize: 13 },

  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { fontSize: 12, fontWeight: "800" },

  infoBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#F9FAFB",
    gap: 8,
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  infoText: { flex: 1, color: "#111827", fontWeight: "600", fontSize: 14 },

  price: { marginTop: 12, fontWeight: "800", color: GREEN, fontSize: 15 },

  noteBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  noteHead: { flexDirection: "row", alignItems: "center", gap: 6 },
  noteTitle: { color: "#991B1B", fontWeight: "800" },
  noteText: { color: "#7F1D1D", marginTop: 4 },

  actions: { flexDirection: "row", gap: 10, marginTop: 14 },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: NAVY,
  },
  editText: { color: "#fff", fontWeight: "700" },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#FEE2E2",
  },
  cancelText: { color: "#B91C1C", fontWeight: "700" },

  // Calendar
  calCard: {
    padding: 14,
    marginBottom: 18,
    backgroundColor: "#fff",
    borderRadius: 20,
    ...shadow,
  },
  calHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },
  monthText: { fontSize: 18, fontWeight: "800", color: NAVY },
  weekRow: { flexDirection: "row", marginBottom: 4 },
  weekday: {
    width: `${100 / 7}%`,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "700",
    color: "#9CA3AF",
  },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: {
    width: `${100 / 7}%`,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  dayToday: { borderWidth: 1.5, borderColor: NAVY },
  daySelected: { backgroundColor: NAVY },
  dayText: { color: "#111827", fontWeight: "600" },
  dayTextSelected: { color: "#fff", fontWeight: "800" },
  dot: {
    position: "absolute",
    bottom: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: GREEN,
  },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 },
  legendDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: GREEN },
  legend: { color: "#6B7280", fontSize: 12 },

  selectedLabel: { fontSize: 17, fontWeight: "800", color: NAVY, marginBottom: 10 },
  dayEmpty: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 16,
    marginBottom: 14,
    borderRadius: 14,
    backgroundColor: "#fff",
    ...shadow,
  },
  emptyDay: { color: "#6B7280" },
});