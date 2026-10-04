import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Booking, getBookingsForCourtOnDate } from "../database/db";

export type FormData = {
  name: string;
  contact_number: string;
  court_number: number;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  duration: number;
};

type Props = {
  courtName: string;
  courtId: number;
  courtCount: number; // how many courts the venue has
  bookingId?: number; // set when editing
  initial?: Partial<FormData>;
  submitLabel: string;
  onSubmit: (data: FormData) => Promise<{ ok: boolean; message?: string }>;
  onDone: () => void;
};

type Reason = "late" | "past" | "booked" | null;

const OPEN_HOUR = 6;
const CLOSE_HOUR = 22;
const DURATIONS = [1, 2, 3, 4];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const REASON_TEXT = { late: "Too late", past: "Passed", booked: "Booked" };

function toDateStr(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function toMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// 7 -> "7 AM", 13 -> "1 PM"
function hourText(h: number) {
  return `${h % 12 || 12} ${h < 12 ? "AM" : "PM"}`;
}

// 7 -> "7 AM – 8 AM"
function slotLabel(h: number) {
  return `${hourText(h)} – ${hourText(h + 1)}`;
}

export default function BookingForm({
  courtName,
  courtId,
  courtCount,
  bookingId,
  initial,
  submitLabel,
  onSubmit,
  onDone,
}: Props) {
  const now = new Date();
  const today = toDateStr(now);

  const [name, setName] = useState(initial?.name ?? "");
  const [contact, setContact] = useState(initial?.contact_number ?? "");
  const [courtNumber, setCourtNumber] = useState(initial?.court_number ?? 1);
  const [date, setDate] = useState(initial?.date ?? today);
  const [start, setStart] = useState<string | null>(
    initial?.start_time ?? null,
  );
  const [duration, setDuration] = useState(initial?.duration ?? 1);
  const [booked, setBooked] = useState<Booking[]>([]);
  const [saving, setSaving] = useState(false);

  const courtChoices = Array.from({ length: courtCount }, (_, i) => i + 1);

  // Next 14 days (plus the booking's own date if it is outside that range)
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      value: toDateStr(d),
      label: `${DAY_NAMES[d.getDay()]} ${d.getDate()}`,
    };
  });
  if (!dates.some((d) => d.value === date)) {
    dates.unshift({ value: date, label: date.slice(5) });
  }

  useEffect(() => {
    getBookingsForCourtOnDate(courtId, date).then(setBooked);
  }, [courtId, date]);

  const hours = Array.from(
    { length: CLOSE_HOUR - OPEN_HOUR },
    (_, i) => OPEN_HOUR + i,
  );

  // Bookings on the court the user has selected (other courts are ignored)
  const courtBookings = booked.filter(
    (b) => b.court_number === courtNumber && b.id !== bookingId,
  );

  // Why a slot can't be picked (null = available)
  function slotReason(hour: number): Reason {
    const s = hour * 60;
    const e = s + duration * 60;
    if (e > CLOSE_HOUR * 60) return "late";
    if (
      !bookingId &&
      date === today &&
      s <= now.getHours() * 60 + now.getMinutes()
    ) {
      return "past";
    }
    const clash = courtBookings.some((b) => {
      const bs = toMinutes(b.start_time);
      const be = bs + b.duration * 60;
      return s < be && e > bs;
    });
    return clash ? "booked" : null;
  }

  const startHour = start ? Number(start.slice(0, 2)) : null;
  const validStart = startHour !== null && slotReason(startHour) === null;

  async function handleSubmit() {
    if (!name.trim()) {
      Alert.alert("Missing name", "Please enter your name.");
      return;
    }
    if (!/^[0-9+\s-]{7,15}$/.test(contact.trim())) {
      Alert.alert("Invalid contact number", "Enter a valid phone number.");
      return;
    }
    if (!start || !validStart) {
      Alert.alert("Pick a time", "Choose an available time slot.");
      return;
    }
    setSaving(true);
    const res = await onSubmit({
      name: name.trim(),
      contact_number: contact.trim(),
      court_number: courtNumber,
      date,
      start_time: start,
      duration,
    });
    setSaving(false);
    if (!res.ok) {
      Alert.alert(
        "Booking conflict",
        res.message ?? "Please try another time.",
      );
      return;
    }
    onDone();
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.courtName}>{courtName}</Text>
      {courtCount > 1 && (
        <Text style={styles.courtInfo}>{courtCount} courts at this venue</Text>
      )}

      <Text style={styles.label}>Your name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Full name"
      />

      <Text style={styles.label}>Contact number</Text>
      <TextInput
        style={styles.input}
        value={contact}
        onChangeText={setContact}
        placeholder="09XX XXX XXXX"
        keyboardType="phone-pad"
      />

      {courtCount > 1 && (
        <>
          <Text style={styles.label}>Which court?</Text>
          <View style={[styles.row, { flexWrap: "wrap" }]}>
            {courtChoices.map((n) => (
              <TouchableOpacity
                key={n}
                onPress={() => setCourtNumber(n)}
                style={[styles.chip, courtNumber === n && styles.chipActive]}
              >
                <Text
                  style={[
                    styles.chipText,
                    courtNumber === n && styles.chipTextActive,
                  ]}
                >
                  Court {n}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <Text style={styles.label}>Date</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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

      <Text style={styles.label}>How many hours?</Text>
      <View style={styles.row}>
        {DURATIONS.map((d) => (
          <TouchableOpacity
            key={d}
            onPress={() => setDuration(d)}
            style={[styles.chip, duration === d && styles.chipActive]}
          >
            <Text
              style={[styles.chipText, duration === d && styles.chipTextActive]}
            >
              {d} hr{d > 1 ? "s" : ""}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Pick a start time</Text>
      <Text style={styles.courtNote}>
        {courtCount > 1 ? `Court ${courtNumber}` : "This court"} on this date:{" "}
        {courtBookings.length === 0
          ? "no bookings yet"
          : courtBookings
              .map((b) => {
                const bh = Number(b.start_time.slice(0, 2));
                return `${hourText(bh)} – ${hourText(bh + b.duration)}`;
              })
              .join(", ")}
      </Text>
      <View style={[styles.row, { flexWrap: "wrap" }]}>
        {hours.map((h) => {
          const value = `${String(h).padStart(2, "0")}:00`;
          const reason = slotReason(h);
          const disabled = reason !== null;
          const active =
            validStart && h >= startHour! && h < startHour! + duration;
          return (
            <TouchableOpacity
              key={h}
              disabled={disabled}
              onPress={() => setStart(value)}
              style={[
                styles.slot,
                active && styles.chipActive,
                disabled && styles.chipDisabled,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  active && styles.chipTextActive,
                  disabled && styles.chipTextDisabled,
                ]}
              >
                {slotLabel(h)}
              </Text>
              {reason && (
                <Text
                  style={
                    reason === "booked"
                      ? styles.reasonBooked
                      : styles.reasonOther
                  }
                >
                  {REASON_TEXT[reason]}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {validStart && (
        <Text style={styles.summary}>
          Your booking: {courtCount > 1 ? `Court ${courtNumber} · ` : ""}
          {hourText(startHour!)} – {hourText(startHour! + duration)}
        </Text>
      )}

      <TouchableOpacity
        style={[styles.submit, saving && { opacity: 0.6 }]}
        onPress={handleSubmit}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>{submitLabel}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  courtName: { fontSize: 22, fontWeight: "bold", color: "#0B2A5B" },
  courtInfo: { color: "#6B7280", marginTop: 2 },
  label: {
    marginTop: 18,
    marginBottom: 6,
    fontWeight: "600",
    color: "#374151",
  },
  courtNote: { color: "#6B7280", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
  },
  row: { flexDirection: "row", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#E5E7EB",
    marginBottom: 8,
  },
  slot: {
    width: "48%",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
  },
  chipActive: { backgroundColor: "#0B2A5B" },
  chipDisabled: { backgroundColor: "#F3F4F6" },
  chipText: { color: "#374151", fontWeight: "500" },
  chipTextActive: { color: "#fff" },
  chipTextDisabled: { color: "#9CA3AF", textDecorationLine: "line-through" },
  reasonBooked: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "700",
    color: "#B91C1C",
  },
  reasonOther: { marginTop: 2, fontSize: 11, color: "#6B7280" },
  summary: { marginTop: 8, color: "#16A34A", fontWeight: "700" },
  submit: {
    marginTop: 24,
    backgroundColor: "#16A34A",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
