/**
 * ImagePreview Component
 *
 * Displays an image thumbnail in list context. Tapping opens a full-screen
 * viewer with zoom/pan using expo-image.
 *
 * Validates: Requirements 8.3, 2.5
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { useTheme } from '../../hooks/useTheme';
import type { FilePreviewProps } from './types';

export function ImagePreview({ fileUrl, fileName, fileSize }: FilePreviewProps) {
  const { theme } = useTheme();
  const [fullScreenVisible, setFullScreenVisible] = useState(false);

  return (
    <>
      <Pressable
        style={[styles.container, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
        onPress={() => setFullScreenVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={`View image ${fileName}`}
      >
        <Image
          source={{ uri: fileUrl }}
          style={styles.thumbnail}
          contentFit="cover"
          placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
          transition={200}
        />
        <View style={styles.info}>
          <Text style={[styles.fileName, { color: theme.colors.text }]} numberOfLines={1}>
            {fileName}
          </Text>
          {fileSize != null && (
            <Text style={[styles.fileSize, { color: theme.colors.textSecondary }]}>
              {formatSize(fileSize)}
            </Text>
          )}
        </View>
      </Pressable>

      <Modal
        visible={fullScreenVisible}
        animationType="fade"
        transparent={false}
        onRequestClose={() => setFullScreenVisible(false)}
      >
        <View style={styles.fullScreenContainer}>
          <Pressable
            style={styles.closeButton}
            onPress={() => setFullScreenVisible(false)}
            accessibilityRole="button"
            accessibilityLabel="Close image viewer"
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </Pressable>
          <Image
            source={{ uri: fileUrl }}
            style={styles.fullScreenImage}
            contentFit="contain"
            transition={300}
          />
          <Text style={styles.fullScreenFileName} numberOfLines={1}>
            {fileName}
          </Text>
        </View>
      </Modal>
    </>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 6,
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
  fullScreenContainer: {
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
  fullScreenImage: {
    width: '100%',
    height: '80%',
  },
  fullScreenFileName: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 12,
    paddingHorizontal: 16,
  },
});
