import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert } from "react-native";
import BookingForm from "../../components/BookingForm";
import { addBooking, Court, getCourtById } from "../../database/db";

export default function BookCourtScreen() {
  const { courtId } = useLocalSearchParams<{ courtId: string }>();
  const router = useRouter();
  const [court, setCourt] = useState<Court | null>(null);

  useEffect(() => {
    getCourtById(Number(courtId)).then(setCourt);
  }, [courtId]);

  if (!court) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#0B2A5B" />;

  return (
    <BookingForm
      courtId={court.id}
      courtName={court.name}
      courtCount={court.court_count}
      submitLabel="Confirm booking"
      onSubmit={(d) => addBooking({ court_id: court.id, ...d })}
      onDone={() => {
        Alert.alert("Booked!", "Your reservation was saved.");
        router.replace("/(tabs)/my-bookings");
      }}
    />
  );
}