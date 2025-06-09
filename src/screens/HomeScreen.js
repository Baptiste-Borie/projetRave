import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  Button,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from "react-native";
import MaskInput from "react-native-mask-input";
import { useDispatch } from "react-redux";
import { setServerInfo } from "../store/slices/audioSlices";

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
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <View style={styles.container}>
        <Text>Adresse IP du serveur</Text>
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
        />

        <Text>Port</Text>
        <MaskInput
          style={styles.input}
          value={port}
          onChangeText={(masked, unmasked) => setPort(unmasked)}
          mask={[/\d/, /\d/, /\d/, /\d/, /\d/]}
          keyboardType="numeric"
          placeholder="ex: 8000"
        />

        <Button
          title={loading ? "Connexion en cours..." : "Tester la connexion"}
          onPress={testConnection}
          disabled={loading}
        />

        {loading && (
          <ActivityIndicator style={{ marginTop: 10 }} size="large" />
        )}
        {message !== "" && <Text style={styles.message}>{message}</Text>}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginVertical: 10,
    borderRadius: 5,
    fontSize: 16,
  },
  message: {
    marginTop: 10,
    fontSize: 16,
    textAlign: "center",
    color: "#333",
  },
});
