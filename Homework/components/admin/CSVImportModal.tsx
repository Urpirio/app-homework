/**
 * CSVImportModal
 *
 * Modal for importing users from a CSV file.
 * Flow: expo-document-picker -> papaparse parsing -> validation preview ->
 * batched POST /auth/register (10 concurrent) -> progress bar -> summary.
 *
 * Validates: Requirements 6.6, 6.7
 */

import { AnimatedButton } from '@/components/login/AnimatedButton';
import { BaseModal } from '@/components/shared/BaseModal';
import { useTheme } from '@/hooks/useTheme';
import {
    CSVParseResult,
    ImportProgress,
    ValidatedRow,
    parseAndValidateCSV,
    processBatchRegistration,
} from '@/utils/csvUserImport';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import React, { useState } from 'react';
import {
    FlatList,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Toast from 'react-native-toast-message';

import api from '@/utils/api';

interface CSVImportModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type ImportStep = 'pick' | 'preview' | 'importing' | 'summary';

export function CSVImportModal({ visible, onClose, onSuccess }: CSVImportModalProps) {
  const { theme } = useTheme();

  const [step, setStep] = useState<ImportStep>('pick');
  const [parseResult, setParseResult] = useState<CSVParseResult | null>(null);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [fileName, setFileName] = useState('');

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/csv'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const asset = result.assets[0];
      setFileName(asset.name);

      // Read file content
      const content = await FileSystem.readAsStringAsync(asset.uri);

      // Parse and validate
      const parsed = parseAndValidateCSV(content);

      if (parsed.missingColumns.length > 0) {
        Toast.show({
          type: 'error',
          text1: 'Columnas faltantes',
          text2: `Faltan: ${parsed.missingColumns.join(', ')}`,
        });
        return;
      }

      if (parsed.totalRows === 0) {
        Toast.show({
          type: 'error',
          text1: 'Archivo vacio',
          text2: 'El archivo CSV no contiene filas de datos.',
        });
        return;
      }

      setParseResult(parsed);
      setStep('preview');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'No se pudo leer el archivo.',
      });
    }
  };

  const handleImport = async () => {
    if (!parseResult) return;

    const validRows = parseResult.rows.filter((r) => r.valid);
    if (validRows.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Sin filas validas',
        text2: 'No hay filas validas para importar.',
      });
      return;
    }

    setStep('importing');

    const registerFn = async (row: ValidatedRow['row']) => {
      await api.post('/auth/register', {
        email: row.email,
        fullName: row.fullName,
        role: row.role,
        ...(row.institutionId ? { institutionId: row.institutionId } : {}),
        ...(row.classroomId ? { classroomId: row.classroomId } : {}),
        ...(row.parentName ? { parentName: row.parentName } : {}),
        ...(row.parentPhone ? { parentPhone: row.parentPhone } : {}),
      });
    };

    const result = await processBatchRegistration(
      validRows,
      registerFn,
      (progress) => setImportProgress({ ...progress }),
      10
    );

    setImportProgress(result);
    setStep('summary');
    onSuccess?.();
  };

  const handleClose = () => {
    if (step === 'importing') return; // Don't close during import
    setStep('pick');
    setParseResult(null);
    setImportProgress(null);
    setFileName('');
    onClose();
  };

  const renderPickStep = () => (
    <View style={styles.pickContainer}>
      <View style={[styles.uploadArea, { borderColor: theme.colors.border }]}>
        <Ionicons name="cloud-upload-outline" size={48} color={theme.colors.primary} />
        <Text style={[styles.uploadTitle, { color: theme.colors.text }]}>
          Seleccionar archivo CSV
        </Text>
        <Text style={[styles.uploadHint, { color: theme.colors.textSecondary }]}>
          Columnas requeridas: fullName, email, role{'\n'}
          Opcionales: classroomId, institutionId, parentName, parentPhone
        </Text>
        <View style={{ marginTop: 16 }}>
          <AnimatedButton title="Seleccionar archivo" onPress={handlePickFile} />
        </View>
      </View>
    </View>
  );

  const renderPreviewStep = () => {
    if (!parseResult) return null;

    return (
      <View style={styles.previewContainer}>
        {/* Summary stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statBadge, { backgroundColor: '#34C75920' }]}>
            <Text style={[styles.statNumber, { color: '#34C759' }]}>
              {parseResult.validCount}
            </Text>
            <Text style={[styles.statLabel, { color: '#34C759' }]}>Validos</Text>
          </View>
          <View style={[styles.statBadge, { backgroundColor: '#FF3B3020' }]}>
            <Text style={[styles.statNumber, { color: '#FF3B30' }]}>
              {parseResult.invalidCount}
            </Text>
            <Text style={[styles.statLabel, { color: '#FF3B30' }]}>Invalidos</Text>
          </View>
          <View style={[styles.statBadge, { backgroundColor: '#FF950020' }]}>
            <Text style={[styles.statNumber, { color: '#FF9500' }]}>
              {parseResult.duplicateCount}
            </Text>
            <Text style={[styles.statLabel, { color: '#FF9500' }]}>Duplicados</Text>
          </View>
        </View>

        {/* Validation preview table */}
        <Text style={[styles.previewTitle, { color: theme.colors.text }]}>
          Vista previa ({parseResult.totalRows} filas)
        </Text>

        <FlatList
          data={parseResult.rows}
          keyExtractor={(_, index) => String(index)}
          style={styles.previewList}
          renderItem={({ item }) => (
            <View
              style={[
                styles.previewRow,
                {
                  backgroundColor: item.valid
                    ? theme.colors.card
                    : item.duplicate
                      ? '#FF950010'
                      : '#FF3B3010',
                  borderLeftColor: item.valid
                    ? '#34C759'
                    : item.duplicate
                      ? '#FF9500'
                      : '#FF3B30',
                },
              ]}
            >
              <View style={styles.previewRowContent}>
                <Text style={[styles.previewName, { color: theme.colors.text }]}>
                  {item.row.fullName || '(vacio)'}
                </Text>
                <Text style={[styles.previewEmail, { color: theme.colors.textSecondary }]}>
                  {item.row.email || '(vacio)'} - {item.row.role || '(sin rol)'}
                </Text>
                {item.errors.length > 0 && (
                  <Text style={styles.previewError}>
                    {item.errors.join('; ')}
                  </Text>
                )}
              </View>
              <Ionicons
                name={item.valid ? 'checkmark-circle' : 'alert-circle'}
                size={20}
                color={item.valid ? '#34C759' : '#FF3B30'}
              />
            </View>
          )}
        />

        <View style={styles.previewActions}>
          <Pressable
            onPress={() => {
              setStep('pick');
              setParseResult(null);
            }}
            style={[styles.secondaryBtn, { borderColor: theme.colors.border }]}
          >
            <Text style={[styles.secondaryBtnText, { color: theme.colors.text }]}>
              Cambiar archivo
            </Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <AnimatedButton
              title={`Importar ${parseResult.validCount} usuario(s)`}
              onPress={handleImport}
              loading={false}
            />
          </View>
        </View>
      </View>
    );
  };

  const renderImportingStep = () => {
    if (!importProgress) return null;

    const pct =
      importProgress.total > 0
        ? Math.round((importProgress.completed / importProgress.total) * 100)
        : 0;

    return (
      <View style={styles.importingContainer}>
        <Ionicons name="sync-outline" size={48} color={theme.colors.primary} />
        <Text style={[styles.importingTitle, { color: theme.colors.text }]}>
          Importando usuarios...
        </Text>
        <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: theme.colors.primary, width: `${pct}%` },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
          {importProgress.completed} / {importProgress.total} ({pct}%)
        </Text>
      </View>
    );
  };

  const renderSummaryStep = () => {
    if (!importProgress) return null;

    return (
      <View style={styles.summaryContainer}>
        <Ionicons
          name={importProgress.failed === 0 ? 'checkmark-circle' : 'alert-circle'}
          size={56}
          color={importProgress.failed === 0 ? '#34C759' : '#FF9500'}
        />
        <Text style={[styles.summaryTitle, { color: theme.colors.text }]}>
          Importacion completada
        </Text>

        <View style={styles.summaryStats}>
          <View style={styles.summaryStatRow}>
            <Text style={[styles.summaryStatLabel, { color: theme.colors.textSecondary }]}>
              Creados exitosamente:
            </Text>
            <Text style={[styles.summaryStatValue, { color: '#34C759' }]}>
              {importProgress.succeeded}
            </Text>
          </View>
          {importProgress.skipped > 0 && (
            <View style={styles.summaryStatRow}>
              <Text style={[styles.summaryStatLabel, { color: theme.colors.textSecondary }]}>
                Omitidos (duplicados):
              </Text>
              <Text style={[styles.summaryStatValue, { color: '#FF9500' }]}>
                {importProgress.skipped}
              </Text>
            </View>
          )}
          {importProgress.failed > 0 && (
            <View style={styles.summaryStatRow}>
              <Text style={[styles.summaryStatLabel, { color: theme.colors.textSecondary }]}>
                Fallidos:
              </Text>
              <Text style={[styles.summaryStatValue, { color: '#FF3B30' }]}>
                {importProgress.failed}
              </Text>
            </View>
          )}
        </View>

        {importProgress.errors.length > 0 && (
          <View style={styles.errorList}>
            <Text style={[styles.errorListTitle, { color: theme.colors.text }]}>
              Errores:
            </Text>
            {importProgress.errors.slice(0, 10).map((err, i) => (
              <Text
                key={i}
                style={[styles.errorItem, { color: theme.colors.textSecondary }]}
              >
                Fila {err.rowIndex} ({err.email}): {err.error}
              </Text>
            ))}
            {importProgress.errors.length > 10 && (
              <Text style={[styles.errorItem, { color: theme.colors.textSecondary }]}>
                ...y {importProgress.errors.length - 10} mas
              </Text>
            )}
          </View>
        )}

        <View style={styles.buttonContainer}>
          <AnimatedButton title="Cerrar" onPress={handleClose} />
        </View>
      </View>
    );
  };

  return (
    <BaseModal visible={visible} onClose={handleClose}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Importar CSV
        </Text>
        {fileName && step !== 'pick' && (
          <Text style={[styles.fileName, { color: theme.colors.textSecondary }]}>
            {fileName}
          </Text>
        )}

        {step === 'pick' && renderPickStep()}
        {step === 'preview' && renderPreviewStep()}
        {step === 'importing' && renderImportingStep()}
        {step === 'summary' && renderSummaryStep()}
      </ScrollView>
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  fileName: {
    fontSize: 13,
    marginBottom: 16,
  },
  // Pick step
  pickContainer: {
    paddingVertical: 20,
  },
  uploadArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
  },
  uploadHint: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  // Preview step
  previewContainer: {
    paddingVertical: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statBadge: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  previewList: {
    maxHeight: 250,
    marginBottom: 16,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 6,
    borderLeftWidth: 3,
  },
  previewRowContent: {
    flex: 1,
  },
  previewName: {
    fontSize: 14,
    fontWeight: '600',
  },
  previewEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  previewError: {
    fontSize: 11,
    color: '#FF3B30',
    marginTop: 4,
  },
  previewActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  secondaryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Importing step
  importingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  importingTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 24,
  },
  progressBar: {
    width: '100%',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Summary step
  summaryContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 20,
  },
  summaryStats: {
    width: '100%',
    marginBottom: 16,
  },
  summaryStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryStatLabel: {
    fontSize: 14,
  },
  summaryStatValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  errorList: {
    width: '100%',
    marginBottom: 16,
  },
  errorListTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorItem: {
    fontSize: 12,
    lineHeight: 18,
  },
  buttonContainer: {
    width: '100%',
    paddingTop: 8,
    paddingBottom: 20,
  },
});
