import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  addCourt,
  addMaintenance,
  cancelBookingByAdmin,
  Court,
  CourtInput,
  deleteCourt,
  deleteMaintenance,
  getCourts,
  getMaintenanceForCourt,
  Maintenance,
  updateCourt,
} from "../database/db";

const SPORTS = [
  "Pickleball",
  "Basketball",
  "Badminton",
  "Tennis",
  "Volleyball",
  "Football",
  "Futsal",
  "Swimming",
  "Table Tennis",
  "Athletics",
  "Martial Arts",
  "Sepak Takraw",
  "Archery",
  "Gymnastics & Dance",
  "Chess",
];
const MAINT_REASONS = ["Resurfacing", "Repairs", "Cleaning", "Private event", "Weather damage"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function hourText(h: number) {
  const hh = h % 24;
  return `${hh % 12 || 12} ${hh < 12 ? "AM" : "PM"}`;
}

function toDateStr(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function niceDate(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

function priceLabel(c: Court) {
  if (c.price_from === null) return "Price on inquiry";
  if (c.price_from === 0) return "Free";
  return `From ₱${c.price_from.toLocaleString()}/${c.price_unit === "person" ? "person" : "hr"}`;
}

// ---------- small building blocks ----------

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric";
  multiline?: boolean;
  autoCapitalize?: "none" | "sentences";
}) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && { minHeight: 64, textAlignVertical: "top" }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
      />
    </>
  );
}

function HourStepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.stepRow}>
        <TouchableOpacity
          style={styles.stepBtn}
          onPress={() => onChange(Math.max(min, value - 1))}
        >
          <Text style={styles.stepBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.stepValue}>{hourText(value)}</Text>
        <TouchableOpacity
          style={styles.stepBtn}
          onPress={() => onChange(Math.min(max, value + 1))}
        >
          <Text style={styles.stepBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Chip({
  text,
  active,
  onPress,
}: {
  text: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{text}</Text>
    </TouchableOpacity>
  );
}

// ---------- add / edit venue ----------

type Form = {
  name: string;
  sport_type: string;
  location: string;
  description: string;
  price: string;
  price_unit: "hour" | "person";
  price_note: string;
  booking_url: string;
  court_count: string;
  open_hour: number;
  close_hour: number;
};

function toForm(c: Court | null): Form {
  if (!c) {
    return {
      name: "",
      sport_type: "Pickleball",
      location: "",
      description: "",
      price: "",
      price_unit: "hour",
      price_note: "",
      booking_url: "",
      court_count: "1",
      open_hour: 6,
      close_hour: 22,
    };
  }
  return {
    name: c.name,
    sport_type: c.sport_type,
    location: c.location ?? "",
    description: c.description ?? "",
    price: c.price_from === null ? "" : String(c.price_from),
    price_unit: c.price_unit === "person" ? "person" : "hour",
    price_note: c.price_note ?? "",
    booking_url: c.booking_url ?? "",
    court_count: String(c.court_count),
    open_hour: c.open_hour,
    close_hour: c.close_hour,
  };
}

function VenueFormModal({
  court,
  onClose,
  onSaved,
}: {
  court: Court | null; // null = adding a new venue
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Form>(toForm(court));
  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function save() {
    const name = form.name.trim();
    if (!name) return Alert.alert("Missing name", "Enter the venue name.");

    const count = parseInt(form.court_count, 10);
    if (!count || count < 1 || count > 50) {
      return Alert.alert("Number of courts", "Enter a number from 1 to 50.");
    }

    let price: number | null = null;
    if (form.price.trim() !== "") {
      price = Number(form.price);
      if (isNaN(price) || price < 0) {
        return Alert.alert("Price", "Enter a valid price, or leave it empty if unknown.");
      }
    }

    if (form.close_hour <= form.open_hour) {
      return Alert.alert("Opening hours", "Closing time must be after opening time.");
    }

    const url = form.booking_url.trim();
    if (url && !/^(https?:\/\/|tel:)/i.test(url)) {
      return Alert.alert("Link", "The link must start with https://, http:// or tel:");
    }

    const input: CourtInput = {
      name,
      sport_type: form.sport_type,
      location: form.location.trim(),
      description: form.description.trim(),
      price_from: price,
      price_unit: form.price_unit,
      price_note: form.price_note.trim() || null,
      booking_url: url || null,
      court_count: count,
      open_hour: form.open_hour,
      close_hour: form.close_hour,
    };

    if (court) await updateCourt(court.id, input);
    else await addCourt(input);
    onSaved();
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{court ? "Edit venue" : "Add venue"}</Text>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Field label="Venue name" value={form.name} onChangeText={(t) => set("name", t)} placeholder="Venue name" autoCapitalize="sentences" />

            <Text style={styles.label}>Sport</Text>
            <View style={styles.wrap}>
              {SPORTS.map((s) => (
                <Chip key={s} text={s} active={form.sport_type === s} onPress={() => set("sport_type", s)} />
              ))}
            </View>

            <Field label="Address / location" value={form.location} onChangeText={(t) => set("location", t)} placeholder="Street, barangay" autoCapitalize="sentences" />
            <Field label="Description" value={form.description} onChangeText={(t) => set("description", t)} placeholder="Example: 4 courts · Indoor" multiline autoCapitalize="sentences" />
            <Field label="Number of courts" value={form.court_count} onChangeText={(t) => set("court_count", t)} keyboardType="numeric" />

            <Text style={styles.label}>Opening hours</Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <HourStepper label="Opens" value={form.open_hour} min={0} max={23} onChange={(v) => set("open_hour", v)} />
              <HourStepper label="Closes" value={form.close_hour} min={1} max={24} onChange={(v) => set("close_hour", v)} />
            </View>

            <Field label="Starting price in ₱ (empty = price on inquiry, 0 = free)" value={form.price} onChangeText={(t) => set("price", t)} keyboardType="numeric" placeholder="Example: 250" />
            <Text style={styles.label}>Price is charged per</Text>
            <View style={styles.wrap}>
              <Chip text="Hour" active={form.price_unit === "hour"} onPress={() => set("price_unit", "hour")} />
              <Chip text="Person" active={form.price_unit === "person"} onPress={() => set("price_unit", "person")} />
            </View>
            <Field label="Price note (optional)" value={form.price_note} onChangeText={(t) => set("price_note", t)} placeholder="Example: Range: ₱250–300/hr" />
            <Field label="Booking link (optional)" value={form.booking_url} onChangeText={(t) => set("booking_url", t)} placeholder="https://..." autoCapitalize="none" />
          </ScrollView>

          <View style={styles.sheetActions}>
            <TouchableOpacity style={styles.grayBtn} onPress={onClose}>
              <Text style={styles.grayText}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.greenBtn} onPress={save}>
              <Text style={styles.greenText}>Save venue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ---------- maintenance ----------

function MaintenanceModal({ court, onClose }: { court: Court; onClose: () => void }) {
  const today = toDateStr(new Date());
  const dates = Array.from({ length: 45 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return { value: toDateStr(d), label: `${DAYS[d.getDay()]} ${MONTHS[d.getMonth()]} ${d.getDate()}` };
  });

  const [entries, setEntries] = useState<Maintenance[]>([]);
  const [courtNumber, setCourtNumber] = useState(0); // 0 = all courts
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [allDay, setAllDay] = useState(true);
  const [startHour, setStartHour] = useState(8);
  const [endHour, setEndHour] = useState(12);
  const [reason, setReason] = useState("Maintenance");

  const loadEntries = useCallback(() => {
    getMaintenanceForCourt(court.id).then(setEntries);
  }, [court.id]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  function pickFrom(v: string) {
    setDateFrom(v);
    if (dateTo < v) setDateTo(v);
  }

  async function handleAdd() {
    if (dateTo < dateFrom) {
      Alert.alert("Check the dates", "The end date can't be before the start date.");
      return;
    }
    const sh = allDay ? 0 : startHour;
    const eh = allDay ? 24 : endHour;
    if (eh <= sh) {
      Alert.alert("Check the times", "The end time must be after the start time.");
      return;
    }
    const why = reason.trim() || "Maintenance";

    const affected = await addMaintenance({
      court_id: court.id,
      court_number: courtNumber,
      date_from: dateFrom,
      date_to: dateTo,
      start_hour: sh,
      end_hour: eh,
      reason: why,
    });
    loadEntries();

    if (affected.length === 0) {
      Alert.alert("Saved", "Users can no longer book those times.");
      return;
    }
    Alert.alert(
      `${affected.length} booking${affected.length > 1 ? "s" : ""} affected`,
      "Existing bookings overlap this closure. Cancel them and tell the users why?",
      [
        { text: "Review later", style: "cancel" },
        {
          text: "Cancel them",
          style: "destructive",
          onPress: async () => {
            for (const b of affected) {
              await cancelBookingByAdmin(b.id, `Closed for maintenance: ${why}`);
            }
            Alert.alert("Done", "The bookings were cancelled and the users can see the reason.");
          },
        },
      ]
    );
  }

  function confirmRemove(m: Maintenance) {
    Alert.alert("Remove this closure?", "The times open up for booking again.", [
      { text: "Keep it", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          await deleteMaintenance(m.id);
          loadEntries();
        },
      },
    ]);
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Maintenance</Text>
          <Text style={styles.sheetSub}>{court.name}</Text>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Scheduled closures</Text>
            {entries.length === 0 ? (
              <Text style={styles.muted}>No closures yet.</Text>
            ) : (
              entries.map((m) => (
                <View key={m.id} style={styles.entry}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.entryTitle}>
                      {m.court_number === 0 ? "All courts" : `Court ${m.court_number}`} ·{" "}
                      {m.date_from === m.date_to
                        ? niceDate(m.date_from)
                        : `${niceDate(m.date_from)} – ${niceDate(m.date_to)}`}
                    </Text>
                    <Text style={styles.muted}>
                      {m.start_hour === 0 && m.end_hour === 24
                        ? "All day"
                        : `${hourText(m.start_hour)} – ${hourText(m.end_hour)}`}{" "}
                      · {m.reason}
                    </Text>
                  </View>