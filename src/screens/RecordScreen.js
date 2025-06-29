import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { useDispatch, useSelector } from "react-redux";
import { addRecording, removeRecording } from "../store/slices/audioSlices";
import Recording from "../components/Recording";
import { colors, spacing, radius } from "../theme";

export default function RecordScreen() {
  const dispatch = useDispatch();
  const recordings = useSelector((state) => state.audio.recordings);

  const [recording, setRecording] = useState(null);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [tempUri, setTempUri] = useState(null);

  useEffect(() => {
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, [sound]);

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
    } catch (err) {
      console.error("Erreur d'enregistrement :", err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      outputAudioPortOverride: Audio.OUTPUT_PORT_SPEAKER,
    });

    const uri = recording.getURI();
    setRecording(null);
    setSound(null);
    setTempUri(uri);
  };

  const saveRecording = async () => {
    if (!tempUri || nameInput.trim() === "") return;

    const newPath = FileSystem.documentDirectory + nameInput + ".m4a";
    await FileSystem.copyAsync({ from: tempUri, to: newPath });

    dispatch(addRecording({ name: nameInput, uri: newPath }));
    setTempUri(null);
    setNameInput("");
  };

  const deleteRecording = async (name, uri) => {
    await FileSystem.deleteAsync(uri);
    dispatch(removeRecording(name));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎙️ Enregistreur vocal</Text>

      <TouchableOpacity
        style={[
          styles.button,
          recording ? styles.stopButton : styles.startButton,
        ]}
        onPress={recording ? stopRecording : startRecording}
      >
        <Text style={styles.buttonText}>
          {recording ? "Arrêter l'enregistrement" : "Démarrer l'enregistrement"}
        </Text>
      </TouchableOpacity>

      {tempUri && (
        <View style={styles.saveSection}>
          <TextInput
            style={styles.input}
            placeholder="Nom de l'enregistrement"
            value={nameInput}
            onChangeText={setNameInput}
            placeholderTextColor={colors.muted}
          />
          <TouchableOpacity style={styles.saveButton} onPress={saveRecording}>
            <Text style={styles.buttonText}>💾 Sauvegarder</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.subtitle}>🎧 Mes enregistrements</Text>
      <FlatList
        data={recordings}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <Recording item={item} onDelete={deleteRecording} />
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    paddingTop: 80,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.muted,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.sm,
    fontSize: 16,
    marginBottom: spacing.sm,
    color: colors.text,
  },
  saveSection: {
    marginTop: spacing.md,
  },
  button: {
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
  },
  startButton: {
    backgroundColor: colors.primary,
  },
  stopButton: {
    backgroundColor: colors.danger,
  },
  saveButton: {
    backgroundColor: colors.success,
    padding: spacing.sm,
    borderRadius: radius.md,
    alignItems: "center",
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  list: {
    paddingBottom: spacing.lg,
  },
});
