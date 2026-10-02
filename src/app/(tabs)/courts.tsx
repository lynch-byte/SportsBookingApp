import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  FlatList,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Court, getCourts } from "../../database/db";

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

function formatPrice(price: number | null, unit: string) {
  if (price === null) return "Price on inquiry";
  if (price === 0) return "Free";
  return `From ₱${price.toLocaleString()}/${unit === "person" ? "person" : "hr"}`;
}

// Decides the button label from the kind of link the venue uses
function getLinkLabel(url: string | null) {
  if (!url) return null;
  if (url.startsWith("tel:")) return "Call venue";
  if (url.includes("facebook.com")) return "Message on Facebook";
  if (url.includes("docs.google.com/spreadsheets")) return "View booking sheet";
  return "Book online";
}

export default function CourtsScreen() {
  const router = useRouter();
  const [courts, setCourts] = useState<Court[]>([]);
  const [selectedSport, setSelectedSport] = useState("All");

  useEffect(() => {
    getCourts(selectedSport).then(setCourts);
  }, [selectedSport]);

  return (
    <View style={{ flex: 1 }}>
      {/* Filter chips (scroll sideways) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={styles.filterRow}
      >
        {sportTypes.map((sport) => (
          <TouchableOpacity
            key={sport}
            onPress={() => setSelectedSport(sport)}
            style={[styles.chip, selectedSport === sport && styles.chipActive]}
          >
            <Text
              style={[
                styles.chipText,
                selectedSport === sport && styles.chipTextActive,
              ]}
            >
              {sport}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Court list */}
      <FlatList
        data={courts}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => {
          const linkLabel = getLinkLabel(item.booking_url);
          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.7}
              onPress={() =>
                router.push({
                  pathname: "/court/[id]",
                  params: { id: String(item.id) },
                })
              }
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.chevron}>›</Text>
              </View>
              <Text style={styles.cardSubtitle}>
                {item.sport_type} • {item.location}
              </Text>
              {!!item.description && (
                <Text style={styles.cardInfo}>{item.description}</Text>
              )}

              <Text style={styles.cardPrice}>
                {formatPrice(item.price_from, item.price_unit)}
              </Text>
              {!!item.price_note && (
                <Text style={styles.cardNote}>{item.price_note}</Text>
              )}

              {linkLabel ? (
                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={() => Linking.openURL(item.booking_url!).catch(() => {})}
                >
                  <Text style={styles.linkButtonText}>{linkLabel}</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.inPerson}>Book in person</Text>
              )}

              <View style={styles.tapRow}>
                <Text style={styles.tapText}>See availability</Text>
                <Text style={styles.tapText}>›</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: "row",
    gap: 8,
    padding: 16,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#E5E7EB",
  },
  chipActive: {
    backgroundColor: "#0B2A5B",
  },
  chipText: {
    color: "#374151",
    fontWeight: "500",
  },
  chipTextActive: {
    color: "#fff",
  },
  card: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "bold",
  },
  chevron: {
    fontSize: 26,
    lineHeight: 26,
    color: "#0B2A5B",
    marginLeft: 8,
  },
  cardSubtitle: {
    color: "#6B7280",
    marginTop: 4,
  },
  cardInfo: {
    color: "#374151",
    marginTop: 4,
  },
  cardPrice: {
    marginTop: 8,
    fontWeight: "600",
    color: "#16A34A",
  },
  cardNote: {
    color: "#6B7280",
    fontSize: 12,
    marginTop: 2,
  },
  linkButton: {
    marginTop: 10,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#0B2A5B",
  },
  linkButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  inPerson: {
    marginTop: 10,
    color: "#6B7280",
    fontStyle: "italic",
  },
  tapRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  tapText: {
    color: "#0B2A5B",
    fontWeight: "600",
    fontSize: 14,
  },
});