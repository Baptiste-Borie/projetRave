import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { useSelector } from "react-redux";
import * as FileSystem from "expo-file-system";
import { Audio } from "expo-av";
import Recording from "../components/Recording";
import { colors, spacing, radius } from "../theme";

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

  useEffect(() => {
    if (!server.ip || !server.port) return;

    // Récupère dynamiquement la liste des modèles disponibles sur le serveur
    const fetchModels = async () => {
      try {
        const res = await fetch(`${baseUrl}/getmodels`);
        const data = await res.json();
        setModels(data.models);
      } catch (err) {
        console.error("Erreur lors de la récupération des modèles :", err);
      }
    };

    fetchModels();
  }, [server]);

  // Télécharge le fichier transformé depuis le serveur et le stocke localement
  const downloadTransformedFile = async (baseUrl, filename = "output.wav") => {
    const directory = FileSystem.documentDirectory + "transformed/";
    const targetPath = directory + filename;

    try {
      const dirInfo = await FileSystem.getInfoAsync(directory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
      }

      const fileInfo = await FileSystem.getInfoAsync(targetPath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(targetPath);
      }

      const downloadRes = await FileSystem.downloadAsync(
        `${baseUrl}/download`,
        targetPath
      );

      return downloadRes.uri;
    } catch (err) {
      console.error("Erreur téléchargement fichier transformé :", err);
      return null;
    }
  };

  // Envoie la sélection de modèle au serveur via un appel HTTP
  const selectModel = async (model) => {
    try {
      await fetch(`${baseUrl}/selectModel/${model}`);
      setSelectedModel(model);
    } catch (err) {
      console.error("Erreur lors de la sélection du modèle :", err);
    }
  };

  // Envoie l'enregistrement sélectionné au serveur et télécharge le résultat transformé
  const uploadAndTransform = async () => {
    if (!selectedRecording || !selectedModel) return;
    setLoading(true);
    setTransformedUri(null);

    try {
      await FileSystem.uploadAsync(`${baseUrl}/upload`, selectedRecording.uri, {
        fieldName: "file",
        httpMethod: "POST",
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        headers: {
          filename: selectedRecording.name + ".m4a",
        },
      });

      const uri = await downloadTransformedFile(baseUrl, "transformed.wav");
      setTransformedUri(uri);
    } catch (err) {
      console.error("Erreur de transformation :", err);
    }

    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎙 Enregistrements</Text>
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
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: spacing.md }}
      />

      <Text style={styles.title}>🧠 Modèles RAVE</Text>
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
        contentContainerStyle={{ paddingVertical: spacing.sm }}
      />

      <TouchableOpacity
        style={[
          styles.button,
          (!selectedModel || !selectedRecording || loading) &&
            styles.disabledButton,
        ]}
        onPress={uploadAndTransform}
        disabled={!selectedModel || !selectedRecording || loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Transformation en cours..." : "Transférer vers RAVE"}
        </Text>
      </TouchableOpacity>

      {loading && (
        <ActivityIndicator size="large" style={{ margin: spacing.lg }} />
      )}

      {transformedUri && selectedRecording && (
        <>
          <Text style={styles.title}>🎧 Résultat</Text>
          <Recording item={{ name: "Original", uri: selectedRecording.uri }} />
          <Recording item={{ name: "Transformé", uri: transformedUri }} />
        </>
      )}
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
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  item: {
    padding: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.muted,
    color: colors.text,
  },
  selected: {
    backgroundColor: "#e0f0ff",
    borderColor: colors.primary,
  },
  model: {
    padding: spacing.sm,
    marginHorizontal: spacing.xs,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.muted,
    color: colors.text,
  },
  selectedModel: {
    backgroundColor: "#d0ffd6",
    borderColor: colors.success,
  },
  button: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#bbb",
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
});
