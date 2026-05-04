/**
 * FileIcon Component
 *
 * Displays a generic file icon with extension label.
 * Tapping triggers a download via expo-file-system and opens
 * the system share sheet via expo-sharing.
 *
 * Validates: Requirements 8.3, 8.4
 */

import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { useTheme } from '../../hooks/useTheme';
import { formatFileSize, getFileExtension } from './fileUtils';
import type { FilePreviewProps } from './types';

export function FileIcon({ fileUrl, fileName, fileSize }: FilePreviewProps) {
  const { theme } = useTheme();
  const [downloading, setDownloading] = useState(false);
  const extension = getFileExtension(fileName);

  const handleDownload = async () => {
    if (downloading) return;

    setDownloading(true);
    try {
      const localUri = `${FileSystem.cacheDirectory}${fileName}`;
      const { uri } = await FileSystem.downloadAsync(fileUrl, localUri);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Downloaded', `File saved to ${uri}`);
      }
    } catch {
      Alert.alert('Download failed', 'Could not download the file. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Pressable
      style={[styles.container, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
      onPress={handleDownload}
      disabled={downloading}
      accessibilityRole="button"
      accessibilityLabel={`Download file ${fileName}`}
    >
      <View style={[styles.iconContainer, { backgroundColor: theme.colors.inputBackground }]}>
        <Ionicons name="document-outline" size={24} color={theme.colors.textSecondary} />
        {extension ? (
          <Text style={[styles.extensionLabel, { color: theme.colors.primary }]}>
            {extension}
          </Text>
        ) : null}
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
      {downloading ? (
        <ActivityIndicator size="small" color={theme.colors.primary} />
      ) : (
        <Ionicons name="download-outline" size={20} color={theme.colors.primary} />
      )}
    </Pressable>
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
  extensionLabel: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 1,
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
});
