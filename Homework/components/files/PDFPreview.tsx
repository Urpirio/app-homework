/**
 * PDFPreview Component
 *
 * Displays a PDF icon with filename. Tapping opens the PDF
 * via expo-web-browser (system browser/viewer).
 *
 * Validates: Requirements 8.3, 2.5
 */

import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { useTheme } from '../../hooks/useTheme';
import { formatFileSize } from './fileUtils';
import type { FilePreviewProps } from './types';

export function PDFPreview({ fileUrl, fileName, fileSize }: FilePreviewProps) {
  const { theme } = useTheme();

  const handleOpen = async () => {
    await WebBrowser.openBrowserAsync(fileUrl);
  };

  return (
    <Pressable
      style={[styles.container, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
      onPress={handleOpen}
      accessibilityRole="button"
      accessibilityLabel={`Open PDF ${fileName}`}
    >
      <View style={[styles.iconContainer, { backgroundColor: '#FFF0F0' }]}>
        <Ionicons name="document-text" size={28} color="#E53935" />
      </View>
      <View style={styles.info}>
        <Text style={[styles.fileName, { color: theme.colors.text }]} numberOfLines={1}>
          {fileName}
        </Text>
        <Text style={[styles.fileType, { color: theme.colors.textSecondary }]}>
          PDF{fileSize != null ? ` · ${formatFileSize(fileSize)}` : ''}
        </Text>
      </View>
      <Ionicons name="open-outline" size={20} color={theme.colors.textSecondary} />
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
  info: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
  },
  fileType: {
    fontSize: 12,
    marginTop: 2,
  },
});
