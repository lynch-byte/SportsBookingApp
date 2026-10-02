import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert } from "react-native";
import BookingForm from "../../components/BookingForm";
import {
  Booking,
  Court,
  getBookingById,
  getCourtById,
  updateBooking,
} from "../../database/db";

export default function EditBookingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [court, setCourt] = useState<Court | null>(null);

  useEffect(() => {
    (async () => {
      const b = await getBookingById(Number(id));
      setBooking(b);
      if (b) setCourt(await getCourtById(b.court_id));
    })();
  }, [id]);

  if (!booking || !court) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" color="#0B2A5B" />;
  }

  return (
    <BookingForm
      courtId={booking.court_id}
      courtName={court.name}
      courtCount={court.court_count}
      bookingId={booking.id}
      initial={{
        name: booking.name,
        contact_number: booking.contact_number,
        court_number: booking.court_number,
        date: booking.date,
        start_time: booking.start_time,
        duration: booking.duration,
      }}
      submitLabel="Save changes"
      onSubmit={(d) => updateBooking(booking.id, { court_id: booking.court_id, ...d })}
      onDone={() => {
        Alert.alert("Updated", "Your booking was rescheduled.");
        router.replace("/(tabs)/my-bookings");
      }}
    />
  );
}