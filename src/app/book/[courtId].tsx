import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert } from "react-native";
import BookingForm from "../../components/BookingForm";
import { useAuth } from "../../context/AuthContext";
import { addBooking, Court, getCourtById } from "../../database/db";

export default function BookCourtScreen() {
  const { courtId } = useLocalSearchParams<{ courtId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [court, setCourt] = useState<Court | null>(null);

  useEffect(() => {
    getCourtById(Number(courtId)).then(setCourt);
  }, [courtId]);

  if (!court || !user) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" color="#0B2A5B" />;
  }

  return (
    <BookingForm
      courtId={court.id}
      courtName={court.name}
      courtCount={court.court_count}
      openHour={court.open_hour}
      closeHour={court.close_hour}
      priceFrom={court.price_from}
      priceUnit={court.price_unit}
      priceNote={court.price_note}
      initial={{
        name: user.role === "admin" ? "" : user.name,
        contact_number: user.role === "admin" ? "" : user.phone,
      }}
      submitLabel="Confirm booking"
      onSubmit={(d) => addBooking({ court_id: court.id, user_id: user.id, ...d })}
      onDone={() => {
        Alert.alert(
          "Booked!",
          "Your reservation is confirmed. Contact the venue if you need to change anything."
        );
        router.replace(user.role === "admin" ? "/(tabs)/admin" : "/(tabs)/my-bookings");
      }}
    />
  );
}