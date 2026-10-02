import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Booking,
  Court,
  getBookingsForCourtOnDate,
  getCourtById,
} from "../../database/db";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

function formatPrice(price: number | null, unit: string) {
  if (price === null) return "Price on inquiry";
  if (price === 0) return "Free";
  return `From ₱${price.toLocaleString()}/${unit === "person" ? "person" : "hr"}`;
}

function getLinkLabel(url: string | null) {
  if (!url) return null;
  if (url.startsWith("tel:")) return "Call venue";
  if (url.includes("facebook.com")) return "Message on Facebook";
  if (url.includes("docs.google.com/spreadsheets")) return "View booking sheet";
  return "Book online";
}

export default function CourtDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [court, setCourt] = useState<Court | null>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(toDateStr(new Date()));
  const [booked, setBooked] = useState<Booking[]>([]);

  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return { value: toDateStr(d), label: `${DAY_NAMES[d.getDay()]} ${d.getDate()}` };
  });

  useEffect(() => {
    getCourtById(Number(id))
      .then(setCourt)
      .finally(() => setLoading(false));
  }, [id]);

  // Reload the schedule whenever the date changes or the screen comes back into view
  useFocusEffect(
    useCallback(() => {
      getBookingsForCourtOnDate(Number(id), date).then(setBooked);
    }, [id, date])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0B2A5B" />
      </View>
    );
  }

  if (!court) {
    return (
      <View style={styles.center}>
        <Text>Court not found.</Text>
      </View>
    );
  }

  const linkLabel = getLinkLabel(court.booking_url);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.name}>{court.name}</Text>
      <Text style={styles.sport}>{court.sport_type}</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Location</Text>
        <Text style={styles.value}>{court.location}</Text>
      </View>

      {!!court.description && (
        <View style={styles.section}>
          <Text style={styles.label}>Details</Text>
          <Text style={styles.value}>{court.description}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.label}>Price</Text>
        <Text style={styles.price}>
          {formatPrice(court.price_from, court.price_unit)}
        </Text>
        {!!court.price_note && (
          <Text style={styles.note}>{court.price_note}</Text>
        )}
      </View>

      {/* Availability */}
      <View style={styles.section}>
        <Text style={styles.label}>Availability</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 8 }}
        >
          <View style={styles.row}>
            {dates.map((d) => (
              <TouchableOpacity
                key={d.value}
                onPress={() => setDate(d.value)}
                style={[styles.chip, date === d.value && styles.chipActive]}
              >
                <Text
                  style={[
                    styles.chipText,
                    date === d.value && styles.chipTextActive,
                  ]}
                >
                  {d.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {booked.length === 0 ? (
          <View style={styles.openBox}>
            <Text style={styles.openText}>
              No bookings on this day. All times are open.
            </Text>
          </View>
        ) : (
          <View style={{ marginTop: 4 }}>
            {booked.map((b) => (
              <View key={b.id} style={styles.slot}>
                <Text style={styles.slotTime}>
                  {timeRange(b.start_time, b.duration)}
                </Text>
                <Text style={styles.slotTag}>
                  {court.court_count > 1 ? `Court ${b.court_number} · Booked` : "Booked"}
                </Text>
              </View>
            ))}
          </View>
        )}
        <Text style={styles.note}>
          Shows bookings made in this app only. The venue may have other
          reservations.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.bookButton}
        onPress={() =>
          router.push({
            pathname: "/book/[courtId]",
            params: { courtId: String(court.id) },
          })
        }
      >
        <Text style={styles.bookButtonText}>Book this court</Text>
      </TouchableOpacity>

      {linkLabel ? (
        <>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => Linking.openURL(court.booking_url!).catch(() => {})}
          >
            <Text style={styles.linkButtonText}>{linkLabel}</Text>
          </TouchableOpacity>
          <Text style={styles.warning}>
            This venue also takes bookings through its own page. Check with
            them to avoid a double booking.
          </Text>
        </>
      ) : (
        <Text style={styles.warning}>
          This venue has no online booking page. Pay and confirm in person.
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { padding: 20, paddingBottom: 40 },
  name: { fontSize: 24, fontWeight: "bold", color: "#0B2A5B" },
  sport: { fontSize: 16, color: "#6B7280", marginTop: 4 },
  section: { marginTop: 20 },
  label: { fontSize: 12, fontWeight: "600", color: "#6B7280", textTransform: "uppercase" },
  value: { fontSize: 16, marginTop: 4, color: "#111827" },
  price: { fontSize: 20, fontWeight: "700", color: "#16A34A", marginTop: 4 },
  note: { fontSize: 13, color: "#6B7280", marginTop: 6 },
  row: { flexDirection: "row", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#E5E7EB",
    marginBottom: 8,
  },
  chipActive: { backgroundColor: "#0B2A5B" },
  chipText: { color: "#374151", fontWeight: "500" },
  chipTextActive: { color: "#fff" },
  openBox: {
    marginTop: 4,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#DCFCE7",
  },
  openText: { color: "#166534", fontWeight: "600" },
  slot: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    marginTop: 6,
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
  },
  slotTime: { color: "#991B1B", fontWeight: "600" },
  slotTag: { color: "#991B1B", fontWeight: "700" },
  bookButton: {
    marginTop: 28,
    backgroundColor: "#16A34A",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  bookButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  linkButton: {
    marginTop: 12,
    backgroundColor: "#0B2A5B",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  linkButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  warning: { marginTop: 12, color: "#6B7280", fontSize: 13, fontStyle: "italic" },
});