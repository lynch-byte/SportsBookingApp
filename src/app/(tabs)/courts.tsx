import { useEffect, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { Court, getCourts } from "../../database/db";

export default function CourtsScreen() {
  const [courts, setCourts] = useState<Court[]>([]);

  useEffect(() => {
    getCourts().then(setCourts);
  }, []);

  return (
    <FlatList
      data={courts}
      keyExtractor={(c) => String(c.id)}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => (
        <View style={{ padding: 16, marginBottom: 12, backgroundColor: "#fff", borderRadius: 12, elevation: 2 }}>
          <Text style={{ fontSize: 16, fontWeight: "bold" }}>{item.name}</Text>
          <Text>{item.sport_type} • {item.location}</Text>
        </View>
      )}
    />
  );
}