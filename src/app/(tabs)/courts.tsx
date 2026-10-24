import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  FlatList,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Court, getCourts } from "../../database/db";

const NAVY = "#0B2A5B";
const GREEN = "#16A34A";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const sportTypes = [
  "All",
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

// Each sport gets its own icon and colour
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

// Label and icon for the venue's own link, chosen by the kind of link
function linkInfo(url: string | null): { label: string; icon: IconName } | null {
  if (!url) return null;
  if (url.startsWith("tel:")) return { label: "Call venue", icon: "call-outline" };
  if (url.includes("facebook.com"))
    return { label: "Message on Facebook", icon: "logo-facebook" };
  if (url.includes("docs.google.com/spreadsheets"))
    return { label: "Booking sheet", icon: "document-text-outline" };
  return { label: "Book online", icon: "globe-outline" };
}

function priceInfo(price: number | null, unit: string) {
  if (price === null) return { text: "Price on inquiry", free: false, none: true };
  if (price === 0) return { text: "Free", free: true, none: false };
  return {
    text: `From ₱${price.toLocaleString()}/${unit === "person" ? "person" : "hr"}`,
    free: false,
    none: false,
  };
}

export default function CourtsScreen() {
  const router = useRouter();
  const [courts, setCourts] = useState<Court[]>([]);
  const [selectedSport, setSelectedSport] = useState("All");
  const [query, setQuery] = useState("");
  const [searchFocus, setSearchFocus] = useState(false);

  // Reload whenever this tab is opened or the sport filter changes
  useFocusEffect(
    useCallback(() => {
      getCourts(selectedSport).then(setCourts);
    }, [selectedSport])
  );

  // Search by venue name or location
  const q = query.trim().toLowerCase();
  const shown = q
    ? courts.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.location ?? "").toLowerCase().includes(q)
      )
    : courts;

  return (
    <View style={{ flex: 1 }}>
      {/* Search box */}
      <View style={[styles.search, searchFocus && styles.searchFocus]}>
        <Ionicons name="search" size={20} color={searchFocus ? NAVY : "#9CA3AF"} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name or location"
          placeholderTextColor="#9CA3AF"
          autoCorrect={false}
          onFocus={() => setSearchFocus(true)}
          onBlur={() => setSearchFocus(false)}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery("")} hitSlop={10}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter chips (scroll sideways) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}
      >
        {sportTypes.map((sport) => {
          const active = selectedSport === sport;
          return (
            <TouchableOpacity
              key={sport}
              onPress={() => setSelectedSport(sport)}
              style={[styles.chip, active && styles.chipActive]}
              activeOpacity={0.85}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {sport}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Court list */}
      <FlatList
        data={shown}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={styles.count}>
            {shown.length} venue{shown.length === 1 ? "" : "s"}
            {selectedSport !== "All" ? ` · ${selectedSport}` : ""}
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="search-outline" size={28} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>No courts found</Text>
            <Text style={styles.emptySub}>Try another name, place, or sport.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const sport = sportStyle(item.sport_type);
          const link = linkInfo(item.booking_url);
          const price = priceInfo(item.price_from, item.price_unit);

          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.9}
              onPress={() =>
                router.push({
                  pathname: "/court/[id]",
                  params: { id: String(item.id) },
                })
              }
            >
              {/* Top: icon, name, sport */}
              <View style={styles.cardTop}>
                <View style={[styles.sportIcon, { backgroundColor: sport.color + "1F" }]}>
                  <Ionicons name={sport.icon} size={26} color={sport.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <View style={[styles.sportPill, { backgroundColor: sport.color + "1F" }]}>
                    <Text style={[styles.sportPillText, { color: sport.color }]}>
                      {item.sport_type}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={22} color="#9CA3AF" />
              </View>

              {/* Details */}
              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={16} color="#6B7280" />
                <Text style={styles.metaText}>{item.location}</Text>
              </View>
              {!!item.description && (
                <View style={styles.metaRow}>
                  <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
                  <Text style={styles.metaText}>{item.description}</Text>
                </View>
              )}

              {/* Price */}
              <View style={styles.priceRow}>
                <View
                  style={[
                    styles.pricePill,
                    price.none && { backgroundColor: "#F3F4F6" },
                  ]}
                >
                  <Text style={[styles.priceText, price.none && { color: "#6B7280" }]}>
                    {price.text}
                  </Text>
                </View>
                {!!item.price_note && (
                  <Text style={styles.priceNote} numberOfLines={2}>
                    {item.price_note}
                  </Text>
                )}
              </View>

              {/* Bottom actions */}
              <View style={styles.footer}>
                {link ? (
                  <TouchableOpacity
                    style={styles.linkBtn}
                    onPress={() => Linking.openURL(item.booking_url!).catch(() => {})}
                    activeOpacity={0.85}
                  >
                    <Ionicons name={link.icon} size={16} color="#fff" />
                    <Text style={styles.linkBtnText}>{link.label}</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.inPerson}>
                    <Ionicons name="walk-outline" size={16} color="#6B7280" />
                    <Text style={styles.inPersonText}>Book in person</Text>
                  </View>
                )}
                <View style={styles.availability}>
                  <Text style={styles.availabilityText}>See availability</Text>
                  <Ionicons name="chevron-forward" size={16} color={NAVY} />
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
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
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "transparent",
    ...shadow,
  },
  searchFocus: { borderColor: NAVY },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: "#111827" },

  filterScroll: { flexGrow: 0, flexShrink: 0, height: 62 },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  chipActive: { backgroundColor: NAVY, borderColor: NAVY },
  chipText: { color: "#374151", fontWeight: "600" },
  chipTextActive: { color: "#fff" },

  count: { color: "#6B7280", fontWeight: "600", marginBottom: 10, marginTop: 2 },

  card: {
    padding: 16,
    marginBottom: 14,
    backgroundColor: "#fff",
    borderRadius: 20,
    ...shadow,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  sportIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontSize: 17, fontWeight: "800", color: "#111827" },
  sportPill: {
    alignSelf: "flex-start",
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  sportPillText: { fontSize: 12, fontWeight: "700" },

  metaRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: 6 },
  metaText: { flex: 1, color: "#4B5563", fontSize: 14 },

  priceRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12 },
  pricePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#DCFCE7",
  },
  priceText: { color: "#166534", fontWeight: "800", fontSize: 14 },
  priceNote: { flex: 1, color: "#6B7280", fontSize: 12 },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  linkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: NAVY,
  },
  linkBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  inPerson: { flexDirection: "row", alignItems: "center", gap: 6 },
  inPersonText: { color: "#6B7280", fontStyle: "italic" },
  availability: { flexDirection: "row", alignItems: "center", gap: 2 },
  availabilityText: { color: NAVY, fontWeight: "700", fontSize: 14 },

  empty: { alignItems: "center", marginTop: 48 },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  emptyTitle: { fontSize: 17, fontWeight: "800", color: "#374151" },
  emptySub: { color: "#6B7280", marginTop: 2 },
});