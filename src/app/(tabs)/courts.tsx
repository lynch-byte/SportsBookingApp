import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Court, getCourts } from "../../database/db";

const sportTypes = ["All", "Basketball", "Tennis", "Badminton", "Pickleball"];

export default function CourtsScreen() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [selectedSport, setSelectedSport] = useState("All");

  useEffect(() => {
    getCourts(selectedSport).then(setCourts);
  }, [selectedSport]);

  return (
    <View style={{ flex: 1 }}>
      {/* Filter chips */}
      <View style={styles.filterRow}>
        {sportTypes.map((sport) => (
          <TouchableOpacity
            key={sport}
            onPress={() => setSelectedSport(sport)}
            style={[
              styles.chip,
              selectedSport === sport && styles.chipActive,
            ]}
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
      </View>

      {/* Court list */}
      <FlatList
        data={courts}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardSubtitle}>{item.sport_type} • {item.location}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
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
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  cardSubtitle: {
    color: "#6B7280",
    marginTop: 4,
  },
});