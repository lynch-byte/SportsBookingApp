import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
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
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Sports Court Booking</Text>
        <Text style={styles.sub}>Log in to book courts in Tagum City</Text>

        <Text style={styles.label}>Phone number</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="09XX XXX XXXX"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>Password</Text>
        <View style={styles.passRow}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry={!show}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity style={styles.showBtn} onPress={() => setShow(!show)}>
            <Text style={styles.showText}>{show ? "Hide" : "Show"}</Text>
          </TouchableOpacity>
        </View>

        {!!error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[styles.primary, busy && { opacity: 0.6 }]}
          onPress={handleLogin}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryText}>Log in</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.link} onPress={() => router.push("/register")}>
          <Text style={styles.linkText}>
            No account yet? <Text style={styles.linkBold}>Create one</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: "center", padding: 24 },
  title: { fontSize: 28, fontWeight: "bold", color: "#0B2A5B" },
  sub: { color: "#6B7280", marginTop: 4, marginBottom: 28 },
  label: { marginBottom: 6, fontWeight: "600", color: "#374151" },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#fff",
    marginBottom: 16,
  },
  passRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  showBtn: { paddingHorizontal: 12, paddingVertical: 12 },
  showText: { color: "#0B2A5B", fontWeight: "600" },
  error: { color: "#B91C1C", marginBottom: 12 },
  primary: {
    backgroundColor: "#0B2A5B",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  link: { marginTop: 20, alignItems: "center" },
  linkText: { color: "#6B7280" },
  linkBold: { color: "#16A34A", fontWeight: "700" },
});