import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Button,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { useSelector } from "react-redux";
import * as FileSystem from "expo-file-system";
import { Audio } from "expo-av";
import Recording from "../components/Recording";

export default function RaveScreen() {
  const server = useSelector((state) => state.audio.server);
  const recordings = useSelector((state) => state.audio.recordings);

  const [selectedRecording, setSelectedRecording] = useState(null);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [transformedUri, setTransformedUri] = useState(null);
  const [sound, setSound] = useState(null);

  const baseUrl = `http://${server.ip}:${server.port}`;

  const downloadTransformedFile = async (baseUrl, filename = "output.wav") => {
    const directory = FileSystem.documentDirectory + "transformed/";
    const targetPath = directory + filename;

    try {
      const dirInfo = await FileSystem.getInfoAsync(directory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
      }

      // ✅ Supprimer l’ancien fichier s’il existe
      const fileInfo = await FileSystem.getInfoAsync(targetPath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(targetPath);
      }

      const downloadRes = await FileSystem.downloadAsync(
        `${baseUrl}/download`,
        targetPath
      );

      console.log("Fichier téléchargé :", downloadRes.uri);
      return downloadRes.uri;
    } catch (err) {
      console.error("Erreur téléchargement fichier transformé :", err);
      return null;
    }
  };

  useEffect(() => {
    if (!server.ip || !server.port) return;

    const fetchModels = async () => {
      try {
        const res = await fetch(`${baseUrl}/getmodels`);
        const data = await res.json();
        console.log("b:", data);
        setModels(data.models);
      } catch (err) {
        console.error("Erreur lors de la récupération des modèles :", err);
      }
    };

    fetchModels();
  }, [server]);

  const selectModel = async (model) => {
    try {
      await fetch(`${baseUrl}/selectModel/${model}`);
      setSelectedModel(model);
    } catch (err) {
      console.error("Erreur lors de la sélection du modèle :", err);
    }
  };

  const uploadAndTransform = async () => {
    if (!selectedRecording || !selectedModel) return;
    setLoading(true);
    setTransformedUri(null);

    try {
      // Upload
      const uploadResponse = await FileSystem.uploadAsync(
        `${baseUrl}/upload`,
        selectedRecording.uri,
        {
          fieldName: "file",
          httpMethod: "POST",
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          headers: {
            filename: selectedRecording.name + ".m4a",
          },
        }
      );

      console.log("Upload terminé :", uploadResponse.body); // Download

      const uri = await downloadTransformedFile(baseUrl, "transformed.wav");
      setTransformedUri(uri);
    } catch (err) {
      console.error("Erreur de transformation :", err);
    }

    setLoading(false);
  };

  const playSound = async (uri) => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
      return;
    }

    const { sound: newSound } = await Audio.Sound.createAsync({ uri });
    setSound(newSound);
    await newSound.playAsync();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sélectionne un enregistrement</Text>
      <FlatList
        data={recordings}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => setSelectedRecording(item)}>
            <Text
              style={[
                styles.item,
                selectedRecording?.name === item.name && styles.selected,
              ]}
            >
              🎙 {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />

      <Text style={styles.title}>Modèles RAVE disponibles</Text>
      <FlatList
        data={models}
        horizontal
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => selectModel(item)}>
            <Text
              style={[
                styles.model,
                selectedModel === item && styles.selectedModel,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      <Button
        title="Transférer vers RAVE"
        onPress={uploadAndTransform}
        disabled={!selectedRecording || !selectedModel || loading}
      />

      {loading && <ActivityIndicator size="large" style={{ margin: 20 }} />}

      {transformedUri && selectedRecording && (
        <>
          <Text style={styles.title}>Écouter le résultat</Text>
          <Recording
            item={{ name: "🎧 Original", uri: selectedRecording.uri }}
          />
          <Recording item={{ name: "🎛 Transformé", uri: transformedUri }} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 18, fontWeight: "bold", marginVertical: 10 },
  item: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    marginVertical: 4,
    borderRadius: 5,
  },
  selected: {
    backgroundColor: "#d0f0ff",
    borderColor: "#00aaff",
  },
  model: {
    marginHorizontal: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
  },
  selectedModel: {
    backgroundColor: "#ccffd5",
    borderColor: "#00cc44",
  },
});
