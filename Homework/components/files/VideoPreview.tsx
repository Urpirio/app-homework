/**
 * VideoPreview Component
 *
 * Displays a play icon overlay. Tapping opens an expo-av video player
 * in a full-screen modal.
 *
 * Validates: Requirements 8.3, 2.5
 */

import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import React, { useRef, useState } from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { useTheme } from '../../hooks/useTheme';
import { formatFileSize } from './fileUtils';
import type { FilePreviewProps } from './types';

export function VideoPreview({ fileUrl, fileName, fileSize }: FilePreviewProps) {
  const { theme } = useTheme();
  const [playerVisible, setPlayerVisible] = useState(false);
  const videoRef = useRef<Video>(null);

  const handleClose = async () => {
    if (videoRef.current) {
      await videoRef.current.stopAsync();
    }
    setPlayerVisible(false);
  };

  return (
    <>
      <Pressable
        style={[styles.container, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
        onPress={() => setPlayerVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={`Play video ${fileName}`}
      >
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryLight }]}>
          <Ionicons name="play-circle" size={32} color={theme.colors.primary} />
        </View>
        <View style={styles.info}>
          <Text style={[styles.fileName, { color: theme.colors.text }]} numberOfLines={1}>
            {fileName}
          </Text>
          {fileSize != null && (
            <Text style={[styles.fileSize, { color: theme.colors.textSecondary }]}>
              {formatFileSize(fileSize)}
            </Text>
          )}
        </View>
        <Ionicons name="play" size={20} color={theme.colors.primary} />
      </Pressable>

      <Modal
        visible={playerVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={handleClose}
      >
        <View style={styles.playerContainer}>
          <Pressable
            style={styles.closeButton}
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel="Close video player"
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </Pressable>
          <Video
            ref={videoRef}
            source={{ uri: fileUrl }}
            style={styles.video}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay
          />
          <Text style={styles.playerFileName} numberOfLines={1}>
            {fileName}
          </Text>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    padding: 8,
    gap: 10,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
  },
  fileSize: {
    fontSize: 12,
    marginTop: 2,
  },
  playerContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '70%',
  },
  playerFileName: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 12,
    paddingHorizontal: 16,
  },
});
