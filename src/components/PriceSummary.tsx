import { StyleSheet, Text, View } from "react-native";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

// 1500 -> "₱1,500.00"
export function formatMoney(n: number) {
  return `₱${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

// Starting rate x hours. Returns null when there is no hourly total to show.
export function estimateTotal(
  priceFrom: number | null,
  unit: string,
  hours: number
): number | null {
  if (priceFrom === null) return null;
  if (unit === "person") return null; // priced per person, not per hour
  return priceFrom * hours;
}

function hourText(h: number) {
  return `${h % 12 || 12}:00 ${h < 12 ? "AM" : "PM"}`;
}

function dateLabel(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  const day = new Date(y, m - 1, d).getDay();
  return `${WEEKDAYS[day]}, ${MONTHS[m - 1]} ${d}, ${y}`;
}

type Props = {
  courtLabel: string; // "Court 2" or the venue name
  date: string; // YYYY-MM-DD
  startHour: number; // 24h, e.g. 8
  duration: number; // hours
  priceFrom: number | null;
  priceUnit: string;
  priceNote?: string | null;
};

export default function PriceSummary({
  courtLabel,
  date,
  startHour,
  duration,
  priceFrom,
  priceUnit,
  priceNote,
}: Props) {
  const total = estimateTotal(priceFrom, priceUnit, duration);
  const range = `${hourText(startHour)} – ${hourText(startHour + duration)}`;
  const perPerson = priceUnit === "person";

  let amount = "—";
  if (priceFrom === 0) amount = "Free";
  else if (perPerson && priceFrom !== null) amount = `${formatMoney(priceFrom)} / person`;
  else if (total !== null) amount = formatMoney(total);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Your Booking</Text>
      <Text style={styles.date}>{dateLabel(date)}</Text>

      <View style={styles.box}>
        <View style={{ flex: 1 }}>
          <Text style={styles.court}>{courtLabel}</Text>
          <Text style={styles.time}>{range}</Text>
        </View>
        <Text style={styles.amount}>{amount}</Text>
      </View>

      <View style={styles.divider} />

      {priceFrom === null ? (
        <Text style={styles.note}>Price on inquiry. Ask the venue for the rate.</Text>
      ) : priceFrom === 0 ? (
        <View style={styles.row}>
          <Text style={styles.totalLabel}>TOTAL</Text>
          <Text style={styles.total}>Free</Text>
        </View>
      ) : perPerson ? (
        <Text style={styles.note}>
          Priced per person. The total depends on how many people come.
        </Text>
      ) : (
        <>
          <View style={styles.row}>
            <Text style={styles.label}>Rate</Text>
            <Text style={styles.value}>{formatMoney(priceFrom)} / hr</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Hours</Text>
            <Text style={styles.value}>
              {duration} hr{duration > 1 ? "s" : ""}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Court subtotal</Text>
            <Text style={styles.value}>{formatMoney(total ?? 0)}</Text>
          </View>
          <View style={[styles.row, { marginTop: 8 }]}>
            <Text style={styles.totalLabel}>TOTAL (ESTIMATED)</Text>
            <Text style={styles.total}>{formatMoney(total ?? 0)}</Text>
          </View>
        </>
      )}

      {!!priceNote && <Text style={styles.noteSmall}>{priceNote}</Text>}
      <Text style={styles.noteSmall}>
        Estimate based on the venue's starting rate. Peak hours and the final amount are
        set by the venue. Pay at the venue; there is no online payment in this app.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 20,
    padding: 18,
    backgroundColor: "#fff",
    borderRadius: 20,
    elevation: 3,
  },
  title: { fontSize: 20, fontWeight: "800", color: "#111827" },
  date: { marginTop: 2, color: "#6B7280" },
  box: {
    marginTop: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
  },
  court: { fontWeight: "700", fontSize: 15, color: "#111827" },
  time: { marginTop: 2, color: "#6B7280", fontSize: 12 },
  amount: { fontWeight: "800", fontSize: 16, color: "#16A34A" },
  divider: { height: 1, backgroundColor: "#E5E7EB", marginVertical: 14 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  label: { color: "#6B7280" },
  value: { fontWeight: "600", color: "#111827" },
  totalLabel: { fontSize: 12, fontWeight: "700", color: "#6B7280", letterSpacing: 0.5 },
  total: { fontSize: 26, fontWeight: "900", color: "#111827" },
  note: { color: "#6B7280" },
  noteSmall: { marginTop: 10, color: "#6B7280", fontSize: 12, fontStyle: "italic" },
});