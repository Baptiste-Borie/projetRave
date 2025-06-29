import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Audio } from "expo-av";
import { colors, spacing, radius } from "../theme";

export default function Recording({ item, onDelete }) {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackStatus, setPlaybackStatus] = useState(null);

  useEffect(() => {
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, [sound]);

  const playSound = async () => {
    if (isPlaying && sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setIsPlaying(false);
      setPlaybackStatus(null);
      return;
    }

    const { sound: newSound } = await Audio.Sound.createAsync({
      uri: item.uri,
    });
    setSound(newSound);
    await newSound.playAsync();
    setIsPlaying(true);

    newSound.setOnPlaybackStatusUpdate((status) => {
      setPlaybackStatus(status);
      if (!status.isPlaying) {
        setIsPlaying(false);
        setPlaybackStatus(null);
      }
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.filename}>{item.name}</Text>
        <View style={styles.actions}>
          <TouchableOpacity onPress={playSound}>
            <Text style={styles.play}>{isPlaying ? "⏸️" : "▶️"}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(item.name, item.uri)}>
            <Text style={styles.delete}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {playbackStatus &&
        playbackStatus.isLoaded &&
        playbackStatus.durationMillis > 0 && (
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${
                    (playbackStatus.positionMillis /
                      playbackStatus.durationMillis) *
                    100
                  }%`,
                },
              ]}
            />
          </View>
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  filename: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  actions: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  play: {
    fontSize: 22,
    color: colors.primary,
  },
  delete: {
    fontSize: 22,
    color: colors.danger,
  },
  progressContainer: {
    height: 4,
    backgroundColor: colors.muted,
    marginTop: spacing.sm,
    width: "100%",
    borderRadius: 2,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.success,
    borderRadius: 2,
  },
});
