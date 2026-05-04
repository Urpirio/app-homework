/**
 * ExportButton
 *
 * Dropdown button that lets users choose an export format (CSV, Excel, PDF)
 * and triggers the corresponding export function.
 *
 * Validates: Requirements 14.9
 * Design: Analytics & Visualization Design — Data Export Design
 */

import { useTheme } from '@/hooks/useTheme';
import {
    ExportFormat,
    ExportResult,
    exportToCSV,
    exportToExcel,
    exportToPDF,
} from '@/utils/dataExport';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ExportButtonProps {
  /**
   * Data to export. For CSV/Excel this is an array of row objects (or a
   * sheet-name → rows map for multi-sheet Excel). For PDF this field is
   * ignored — use `htmlContent` instead.
   */
  data?: Record<string, unknown>[] | Record<string, Record<string, unknown>[]>;
  /**
   * HTML string used for PDF export. When the user picks PDF, this content
   * is rendered to a PDF file via expo-print.
   */
  htmlContent?: string;
  /** Base filename (without extension) for the exported file. */
  filename?: string;
  /** Callback fired after an export attempt completes. */
  onExportComplete?: (result: ExportResult) => void;
  /** Which formats to offer. Defaults to all three. */
  formats?: ExportFormat[];
}

// ─── Format metadata ─────────────────────────────────────────────────────────

interface FormatOption {
  key: ExportFormat;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const ALL_FORMATS: FormatOption[] = [
  { key: 'csv', label: 'CSV', icon: 'document-text-outline' },
  { key: 'excel', label: 'Excel', icon: 'grid-outline' },
  { key: 'pdf', label: 'PDF', icon: 'document-outline' },
];

// ─── Component ───────────────────────────────────────────────────────────────

export function ExportButton({
  data,
  htmlContent,
  filename = 'reporte',
  onExportComplete,
  formats,
}: ExportButtonProps) {
  const { theme } = useTheme();
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [exporting, setExporting] = useState(false);
  const exportingRef = useRef(false);

  const availableFormats = formats
    ? ALL_FORMATS.filter((f) => formats.includes(f.key))
    : ALL_FORMATS;

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      if (exportingRef.current) return;
      exportingRef.current = true;
      setExporting(true);
      setDropdownVisible(false);

      let result: ExportResult;

      try {
        switch (format) {
          case 'csv': {
            const rows = Array.isArray(data) ? data : [];
            result = await exportToCSV(rows, filename);
            break;
          }
          case 'excel': {
            result = await exportToExcel(data ?? [], filename);
            break;
          }
          case 'pdf': {
            const html =
              htmlContent ?? '<html><body><p>Sin contenido</p></body></html>';
            result = await exportToPDF(html, filename);
            break;
          }
          default:
            result = { success: false, error: 'Formato no soportado' };
        }
      } catch (error) {
        result = {
          success: false,
          error:
            error instanceof Error ? error.message : 'Error al exportar',
        };
      }

      setExporting(false);
      exportingRef.current = false;
      onExportComplete?.(result);
    },
    [data, htmlContent, filename, onExportComplete],
  );

  return (
    <View>
      {/* Trigger button */}
      <Pressable
        onPress={() => setDropdownVisible(true)}
        disabled={exporting}
        accessibilityRole="button"
        accessibilityLabel="Exportar datos"
        accessibilityHint="Abre opciones de formato de exportación"
        style={[
          styles.trigger,
          {
            backgroundColor: theme.colors.primary,
            opacity: exporting ? 0.6 : 1,
          },
        ]}
      >
        {exporting ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Ionicons name="download-outline" size={18} color="#FFFFFF" />
        )}
        <Text style={styles.triggerText}>Exportar</Text>
      </Pressable>

      {/* Dropdown modal */}
      <Modal
        visible={dropdownVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setDropdownVisible(false)}
        >
          <View
            style={[
              styles.dropdown,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border + '50',
              },
            ]}
          >
            <Text
              style={[styles.dropdownTitle, { color: theme.colors.text }]}
            >
              Formato de exportación
            </Text>

            {availableFormats.map((format) => (
              <Pressable
                key={format.key}
                onPress={() => handleExport(format.key)}
                accessibilityRole="menuitem"
                accessibilityLabel={`Exportar como ${format.label}`}
                style={({ pressed }) => [
                  styles.option,
                  {
                    backgroundColor: pressed
                      ? theme.colors.border + '20'
                      : 'transparent',
                  },
                ]}
              >
                <Ionicons
                  name={format.icon}
                  size={20}
                  color={theme.colors.primary}
                />
                <Text
                  style={[styles.optionText, { color: theme.colors.text }]}
                >
                  {format.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  triggerText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdown: {
    width: 260,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  dropdownTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ExportButton;
