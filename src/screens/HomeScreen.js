import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from "react-native";
import MaskInput from "react-native-mask-input";
import { useDispatch } from "react-redux";
import { setServerInfo } from "../store/slices/audioSlices";
import { colors, spacing, radius } from "../theme";

const fetchWithTimeout = (url, options = {}, timeout = 10000) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), timeout)
    ),
  ]);
};

export default function HomeScreen() {
  const [ip, setIp] = useState("");
  const [port, setPort] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();

  const testConnection = async () => {
    setMessage("");
    setLoading(true);

    const cleanedIp = ip.trim();
    const cleanedPort = port.trim();
    const url = `http://${cleanedIp}:${cleanedPort}/`;

    try {
      const res = await fetchWithTimeout(url);
      const text = await res.text();

      if (text.toLowerCase().includes("connection success")) {
        dispatch(setServerInfo({ ip: cleanedIp, port: cleanedPort }));
        setMessage("✅ Connexion réussie !");
      } else {
        setMessage("⚠️ Réponse inattendue du serveur");
      }
    } catch (err) {
      console.log("Erreur fetch :", err);
      if (err.message === "Timeout") {
        setMessage("⏳ Délai dépassé (10s), le serveur ne répond pas.");
      } else {
        setMessage("❌ Erreur de connexion");
      }
    }

    setLoading(false);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <Text style={styles.label}>Adresse IP du serveur</Text>
        <MaskInput
          style={styles.input}
          value={ip}
          onChangeText={(masked) => setIp(masked)}
          mask={[
            /\d/,
            /\d/,
            /\d/,
            ".",
            /\d/,
            /\d/,
            /\d/,
            ".",
            /\d/,
            /\d/,
            /\d/,
            ".",
            /\d/,
            /\d/,
            /\d/,
          ]}
          keyboardType="numeric"
          placeholder="ex: 192.168.001.001"
          placeholderTextColor={colors.muted}
        />

        <Text style={styles.label}>Port</Text>
        <MaskInput
          style={styles.input}
          value={port}
          onChangeText={(masked, unmasked) => setPort(unmasked)}
          mask={[/\d/, /\d/, /\d/, /\d/, /\d/]}
          keyboardType="numeric"
          placeholder="ex: 8000"
          placeholderTextColor={colors.muted}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={testConnection}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Connexion en cours..." : "Tester la connexion"}
          </Text>
        </TouchableOpacity>

        {loading && (
          <ActivityIndicator size="large" style={{ marginTop: spacing.md }} />
        )}
        {message !== "" && <Text style={styles.message}>{message}</Text>}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    padding: spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: spacing.xs,
    color: colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.muted,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    fontSize: 16,
    backgroundColor: colors.white,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: "center",
    marginTop: spacing.md,
  },
  buttonDisabled: {
    backgroundColor: "#aaa",
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  message: {
    marginTop: spacing.md,
    fontSize: 15,
    textAlign: "center",
    color: colors.text,
  },
});
