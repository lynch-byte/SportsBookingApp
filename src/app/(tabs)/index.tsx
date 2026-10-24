import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { BookingWithCourt, getBookings } from "../../database/db";

const NAVY = "#0B2A5B";
const GREEN = "#16A34A";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toDateStr(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function niceDate(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return `${DAYS[new Date(y, m - 1, d).getDay()]}, ${MONTHS[m - 1]} ${d}`;
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

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [next, setNext] = useState<BookingWithCourt | null>(null);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [cancelledCount, setCancelledCount] = useState(0);

  const userId = user?.id;

  useFocusEffect(
    useCallback(() => {
      if (userId === undefined) return;
      // The admin sees every booking. A user sees only their own.
      getBookings(isAdmin ? undefined : userId).then((all) => {
        const now = new Date();
        const today = toDateStr(now);

        const active = all.filter((b) => b.status !== "cancelled");
        const upcoming = active
          .filter((b) => endsAt(b) > now)
          .sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time));

        setNext(upcoming[0] ?? null);
        setUpcomingCount(upcoming.length);
        setTodayCount(active.filter((b) => b.date === today).length);
        setCancelledCount(
          all.filter((b) => b.status === "cancelled" && endsAt(b) > now).length
        );
      });
    }, [userId, isAdmin])
  );

  const firstName = (user?.name ?? "").split(" ")[0] || "there";

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Greeting */}
      <View style={styles.greetCard}>
        <Image
          source={require("../../../assets/images/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.greetSmall}>{isAdmin ? "Administrator" : "Welcome back"}</Text>
          <Text style={styles.greetName} numberOfLines={1}>
            Hi, {firstName}
          </Text>
          <Text style={styles.greetSub}>
            {isAdmin
              ? "Manage venues and bookings"
              : "Find and reserve courts in Tagum City"}
          </Text>
        </View>
      </View>

      {/* Quick actions */}
      <Text style={styles.sectionTitle}>Quick actions</Text>
      <View style={styles.tileRow}>
        <TouchableOpacity
          style={[styles.tile, { backgroundColor: NAVY }]}
          onPress={() => router.navigate("/(tabs)/courts")}
          activeOpacity={0.85}
        >
          <View style={[styles.tileIcon, { backgroundColor: "rgba(255,255,255,0.16)" }]}>
            <Ionicons name="basketball-outline" size={24} color="#fff" />
          </View>
          <Text style={styles.tileTitle}>Browse courts</Text>
          <Text style={styles.tileSub}>Search and book a venue</Text>
        </TouchableOpacity>

        {isAdmin ? (
          <TouchableOpacity
            style={[styles.tile, { backgroundColor: GREEN }]}
            onPress={() => router.navigate("/(tabs)/admin")}
            activeOpacity={0.85}
          >
            <View style={[styles.tileIcon, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
              <Ionicons name="shield-checkmark-outline" size={24} color="#fff" />
            </View>
            <Text style={styles.tileTitle}>Admin panel</Text>
            <Text style={styles.tileSub}>Bookings and venues</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.tile, { backgroundColor: GREEN }]}
            onPress={() => router.navigate("/(tabs)/my-bookings")}
            activeOpacity={0.85}
          >
            <View style={[styles.tileIcon, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
              <Ionicons name="calendar-outline" size={24} color="#fff" />
            </View>
            <Text style={styles.tileTitle}>My bookings</Text>
            <Text style={styles.tileSub}>Upcoming, past, calendar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* The user is told when the administrator cancelled one of their bookings */}
      {!isAdmin && cancelledCount > 0 && (
        <TouchableOpacity
          style={styles.alert}
          onPress={() => router.navigate("/(tabs)/my-bookings")}
          activeOpacity={0.85}
        >
          <Ionicons name="alert-circle" size={22} color="#B91C1C" />
          <Text style={styles.alertText}>
            {cancelledCount === 1
              ? "1 of your bookings was cancelled by the administrator."
              : `${cancelledCount} of your bookings were cancelled by the administrator.`}{" "}
            Tap to see why.
          </Text>
          <Ionicons name="chevron-forward" size={18} color="#B91C1C" />
        </TouchableOpacity>
      )}

      {/* Admin numbers */}
      {isAdmin && (
        <>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <View style={[styles.statIcon, { backgroundColor: "#DBEAFE" }]}>
                <Ionicons name="calendar-outline" size={20} color={NAVY} />
              </View>
              <Text style={styles.statNum}>{upcomingCount}</Text>
              <Text style={styles.statLabel}>Upcoming</Text>
            </View>
            <View style={styles.stat}>
              <View style={[styles.statIcon, { backgroundColor: "#DCFCE7" }]}>
                <Ionicons name="today-outline" size={20} color={GREEN} />
              </View>
              <Text style={styles.statNum}>{todayCount}</Text>
              <Text style={styles.statLabel}>Today</Text>
            </View>
          </View>
        </>
      )}

      {/* Next booking */}
      <Text style={styles.sectionTitle}>
        {isAdmin ? "Next booking (all users)" : "Your next booking"}
      </Text>
      <View style={styles.nextCard}>
        {next ? (
          <>
            <View style={styles.nextTop}>
              <View style={styles.nextBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#166534" />
                <Text style={styles.nextBadgeText}>Confirmed</Text>
              </View>
            </View>
            <Text style={styles.nextTitle}>{next.court_name}</Text>
            <Text style={styles.nextSub}>
              {next.sport_type} · Court {next.court_number}
            </Text>

            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={18} color={NAVY} />
              <Text style={styles.infoText}>{niceDate(next.date)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={18} color={NAVY} />
              <Text style={styles.infoText}>{timeRange(next.start_time, next.duration)}</Text>
            </View>
            {isAdmin && (
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={18} color={NAVY} />
                <Text style={styles.infoText}>
                  {next.name} · {next.contact_number}
                </Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIcon}>
              <Ionicons name="calendar-clear-outline" size={28} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>No upcoming bookings</Text>
            {!isAdmin && (
              <>
                <Text style={styles.emptySub}>Pick a court and reserve your first slot.</Text>
                <TouchableOpacity
                  style={styles.emptyBtn}
                  onPress={() => router.navigate("/(tabs)/courts")}
                  activeOpacity={0.85}
                >
                  <Text style={styles.emptyBtnText}>Find a court</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>
    </ScrollView>
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
  container: { padding: 16, paddingBottom: 32 },

  greetCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 20,
    ...shadow,
  },
  logo: { width: 64, height: 64, borderRadius: 16 },
  greetSmall: { color: "#6B7280", fontSize: 13, fontWeight: "600" },
  greetName: { fontSize: 24, fontWeight: "800", color: NAVY },
  greetSub: { color: "#6B7280", marginTop: 2, fontSize: 13 },

  sectionTitle: {
    marginTop: 22,
    marginBottom: 10,
    fontSize: 16,
    fontWeight: "800",
    color: NAVY,
  },

  tileRow: { flexDirection: "row", gap: 12 },
  tile: { flex: 1, padding: 16, borderRadius: 18, ...shadow },
  tileIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  tileTitle: { color: "#fff", fontSize: 16, fontWeight: "800" },
  tileSub: { color: "rgba(255,255,255,0.8)", marginTop: 2, fontSize: 12 },

  alert: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  alertText: { flex: 1, color: "#991B1B", fontWeight: "600", fontSize: 13 },

  statsRow: { flexDirection: "row", gap: 12 },
  stat: {
    flex: 1,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#fff",
    ...shadow,
  },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  statNum: { fontSize: 28, fontWeight: "900", color: NAVY },
  statLabel: { color: "#6B7280", fontSize: 13 },

  nextCard: { padding: 18, backgroundColor: "#fff", borderRadius: 20, ...shadow },
  nextTop: { flexDirection: "row" },
  nextBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#DCFCE7",
  },
  nextBadgeText: { color: "#166534", fontWeight: "700", fontSize: 12 },
  nextTitle: { fontSize: 20, fontWeight: "800", color: "#111827", marginTop: 10 },
  nextSub: { color: "#6B7280", marginTop: 2, marginBottom: 12 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8 },
  infoText: { color: "#111827", fontWeight: "600", flexShrink: 1 },

  emptyBox: { alignItems: "center", paddingVertical: 8 },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: "#374151" },
  emptySub: { color: "#6B7280", marginTop: 2, textAlign: "center" },
  emptyBtn: {
    marginTop: 14,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: NAVY,
  },
  emptyBtnText: { color: "#fff", fontWeight: "700" },
});