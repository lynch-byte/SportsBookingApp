import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [focus, setFocus] = useState<"phone" | "password" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleLogin() {
    if (!phone.trim() || !password) {
      setError("Enter your phone number and password.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await login(phone, password);
    setBusy(false);
    // On success the app moves to the main screens automatically
    if (!res.ok) setError(res.message ?? "Could not log in.");
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.hero}>
          <View style={styles.circleBig} />
          <View style={styles.circleSmall} />

          <Image
            source={require("../../assets/images/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>Sports Court Booking</Text>
          <Text style={styles.tagline}>Find a court. Pick a time. Play.</Text>
        </View>

        {/* Form card */}
        <View style={styles.card}>
          <Text style={styles.welcome}>Welcome back</Text>
          <Text style={styles.welcomeSub}>Log in to book courts in Tagum City</Text>

          <Text style={styles.label}>Phone number</Text>
          <View style={[styles.field, focus === "phone" && styles.fieldFocus]}>
            <Ionicons
              name="call-outline"
              size={20}
              color={focus === "phone" ? "#0B2A5B" : "#9CA3AF"}
            />
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="09XX XXX XXXX"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={() => setFocus("phone")}
              onBlur={() => setFocus(null)}
            />
          </View>

          <Text style={styles.label}>Password</Text>
          <View style={[styles.field, focus === "password" && styles.fieldFocus]}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={focus === "password" ? "#0B2A5B" : "#9CA3AF"}
            />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!show}
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={() => setFocus("password")}
              onBlur={() => setFocus(null)}
            />
            <TouchableOpacity onPress={() => setShow(!show)} hitSlop={10}>
              <Ionicons
                name={show ? "eye-off-outline" : "eye-outline"}
                size={22}
                color="#6B7280"
              />
            </TouchableOpacity>
          </View>

          {!!error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color="#B91C1C" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.primary, busy && { opacity: 0.6 }]}
            onPress={handleLogin}
            disabled={busy}
            activeOpacity={0.85}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryText}>Log in</Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>New here?</Text>
            <View style={styles.line} />
          </View>

          <TouchableOpacity
            style={styles.secondary}
            onPress={() => router.push("/register")}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryText}>Create an account</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          Pickleball · Basketball · Badminton · Tennis and more
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F3F4F6" },

  hero: {
    backgroundColor: "#0B2A5B",
    paddingTop: 70,
    paddingBottom: 76,
    paddingHorizontal: 24,
    alignItems: "center",
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: "hidden",
  },
  circleBig: {
    position: "absolute",
    top: -60,
    right: -70,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  circleSmall: {
    position: "absolute",
    bottom: -40,
    left: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(22,163,74,0.35)",
  },
  logo: { width: 92, height: 92, borderRadius: 22, marginBottom: 14 },
  appName: { fontSize: 26, fontWeight: "800", color: "#fff", textAlign: "center" },
  tagline: { marginTop: 4, color: "#BFDBFE", fontSize: 14 },

  card: {
    marginHorizontal: 20,
    marginTop: -44,
    padding: 22,
    backgroundColor: "#fff",
    borderRadius: 22,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  welcome: { fontSize: 22, fontWeight: "800", color: "#0B2A5B" },
  welcomeSub: { color: "#6B7280", marginTop: 2, marginBottom: 18 },

  label: { marginBottom: 6, fontWeight: "600", color: "#374151" },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
  },
  fieldFocus: { borderColor: "#0B2A5B", backgroundColor: "#fff" },
  input: { flex: 1, paddingVertical: 13, fontSize: 15, color: "#111827" },

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    marginBottom: 14,
    borderRadius: 10,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorText: { flex: 1, color: "#B91C1C", fontWeight: "500" },

  primary: {
    backgroundColor: "#0B2A5B",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  dividerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 18 },
  line: { flex: 1, height: 1, backgroundColor: "#E5E7EB" },
  dividerText: { color: "#9CA3AF", fontSize: 13 },

  secondary: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#16A34A",
  },
  secondaryText: { color: "#16A34A", fontWeight: "700", fontSize: 15 },

  footer: {
    textAlign: "center",
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 22,
    marginBottom: 28,
    paddingHorizontal: 24,
  },
});