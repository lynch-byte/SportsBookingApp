import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
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

  const isAdmin = user.role === "admin";

  return (
    <View style={{ flex: 1 }}>
      {isAdmin && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            Booking for a customer. Enter their name and phone number.
          </Text>
        </View>
      )}

      <BookingForm
        courtId={court.id}
        courtName={court.name}
        courtCount={court.court_count}
        openHour={court.open_hour}
        closeHour={court.close_hour}
        priceFrom={court.price_from}
        priceUnit={court.price_unit}
        priceNote={court.price_note}
        initial={isAdmin ? {} : { name: user.name, contact_number: user.phone }}
        submitLabel={isAdmin ? "Confirm booking for customer" : "Confirm booking"}
        onSubmit={(d) => addBooking({ court_id: court.id, user_id: user.id, ...d })}
        onDone={() => {
          Alert.alert(
            "Booked!",
            isAdmin
              ? "The booking is confirmed for the customer."
              : "Your reservation is confirmed. Contact the venue if you need to change anything."
          );
          router.replace(isAdmin ? "/(tabs)/admin" : "/(tabs)/my-bookings");
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    padding: 12,
    backgroundColor: "#FEF3C7",
    borderBottomWidth: 1,
    borderBottomColor: "#FDE68A",
  },
  bannerText: { color: "#92400E", fontWeight: "600", textAlign: "center" },
});