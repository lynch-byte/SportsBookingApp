import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Text, View } from "react-native";
import BookingForm from "../../components/BookingForm";
import { useAuth } from "../../context/AuthContext";
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
  const { user } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [court, setCourt] = useState<Court | null>(null);

  useEffect(() => {
    (async () => {
      const b = await getBookingById(Number(id));
      setBooking(b);
      if (b) setCourt(await getCourtById(b.court_id));
    })();
  }, [id]);

  if (!booking || !court || !user) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" color="#0B2A5B" />;
  }

  // Only the owner (or the admin) can change a booking, and not a cancelled one
  const allowed = user.role === "admin" || booking.user_id === user.id;
  if (!allowed || booking.status === "cancelled") {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
        <Text style={{ fontSize: 16, textAlign: "center", color: "#374151" }}>
          {booking.status === "cancelled"
            ? "This booking was cancelled and can't be changed."
            : "You can only change your own bookings."}
        </Text>
      </View>
    );
  }

  return (
    <BookingForm
      courtId={booking.court_id}
      courtName={court.name}
      courtCount={court.court_count}
      openHour={court.open_hour}
      closeHour={court.close_hour}
      priceFrom={court.price_from}
      priceUnit={court.price_unit}
      priceNote={court.price_note}
      bookingId={booking.id}
      initial={{
        name: booking.name,
        contact_number: booking.contact_number,
        court_number: booking.court_number,
        activity: booking.activity,
        date: booking.date,
        start_time: booking.start_time,
        duration: booking.duration,
      }}
      submitLabel="Save changes"
      onSubmit={(d) => updateBooking(booking.id, { court_id: booking.court_id, ...d })}
      onDone={() => {
        Alert.alert("Updated", "Your booking was rescheduled.");
        router.replace(user.role === "admin" ? "/(tabs)/admin" : "/(tabs)/my-bookings");
      }}
    />
  );
}