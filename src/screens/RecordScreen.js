import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { useDispatch, useSelector } from "react-redux";
import { addRecording, removeRecording } from "../store/slices/audioSlices";
import Recording from "../components/Recording";

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
      if (sound) {
        sound.unloadAsync();
      }
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
      outputAudioPortOverride: Audio.OUTPUT_PORT_SPEAKER, // <-- clé ici !
    });

    const uri = recording.getURI();
    setRecording(null);
    setSound(null);
    setTempUri(uri); // temporairement stocké pour sauvegarde
    console.log("Enregistrement terminé, fichier temporaire :", uri);
  };

  const saveRecording = async () => {
    if (!tempUri || nameInput.trim() === "") return;

    const newPath = FileSystem.documentDirectory + nameInput + ".m4a";
    await FileSystem.copyAsync({
      from: tempUri,
      to: newPath,
    });

    dispatch(addRecording({ name: nameInput, uri: newPath }));

    // Reset
    setTempUri(null);
    setNameInput("");
  };

  const playSound = async (uri) => {
    if (isPlaying && sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setIsPlaying(false);
      return;
    }

    const { sound: newSound } = await Audio.Sound.createAsync({ uri });
    setSound(newSound);
    await newSound.playAsync();
    setIsPlaying(true);

    newSound.setOnPlaybackStatusUpdate((status) => {
      if (!status.isPlaying) {
        setIsPlaying(false);
      }
    });
  };

  const deleteRecording = async (name, uri) => {
    await FileSystem.deleteAsync(uri);
    dispatch(removeRecording(name));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enregistrement Audio</Text>

      {!recording ? (
        <Button title="Démarrer l'enregistrement" onPress={startRecording} />
      ) : (
        <Button title="Arrêter l'enregistrement" onPress={stopRecording} />
      )}

      {tempUri && (
        <View style={styles.saveSection}>
          <TextInput
            placeholder="Nom de l'enregistrement"
            value={nameInput}
            onChangeText={setNameInput}
            style={styles.input}
          />
          <Button title="Sauvegarder" onPress={saveRecording} />
        </View>
      )}

      <Text style={styles.subtitle}>Enregistrements :</Text>
      <FlatList
        data={recordings}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <Recording item={item} onDelete={deleteRecording} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    marginTop: 30,
    marginBottom: 10,
  },
  saveSection: {
    marginVertical: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  filename: {
    fontSize: 16,
  },
  actions: {
    flexDirection: "row",
    gap: 15,
  },
  play: {
    fontSize: 20,
  },
  delete: {
    fontSize: 20,
    color: "red",
  },
});
