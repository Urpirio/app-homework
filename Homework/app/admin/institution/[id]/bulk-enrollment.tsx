import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { ThemedView } from '@/components/shared/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import api from '@/utils/api';
import Toast from 'react-native-toast-message';

export default function BulkEnrollmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  
  const [file, setFile] = useState<DocumentPicker.DocumentPickerResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any | null>(null);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setFile(result);
        setResults(null);
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'No se pudo seleccionar el archivo' });
    }
  };

  const handleUpload = async () => {
    if (!file || file.canceled) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Selecciona un archivo primero' });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      const asset = file.assets[0];
      
      // @ts-ignore
      formData.append('file', {
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const res = await api.post(`/institutions/${id}/bulk-enroll`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResults(res.data);
      Toast.show({ 
        type: 'success', 
        text1: 'Proceso completado', 
        text2: `Éxito: ${res.data.success}, Errores: ${res.data.errors}` 
      });
      setFile(null);
    } catch (error: any) {
      Toast.show({ 
        type: 'error', 
        text1: 'Error', 
        text2: error.response?.data?.message || 'Error al subir archivo' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />
        
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Volver">
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Carga Masiva</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Inscripción Masiva</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Sube un archivo Excel (.xlsx) con las columnas: fullName, email, classroomId (opcional).
            </Text>

            <Pressable 
              style={[
                styles.uploadArea, 
                { 
                  borderColor: file ? theme.colors.primary : theme.colors.border,
                  backgroundColor: file ? theme.colors.primary + '10' : 'transparent'
                }
              ]}
              onPress={pickDocument}
            >
              <Ionicons 
                name={file ? "document-text" : "cloud-upload-outline"} 
                size={48} 
                color={file ? theme.colors.primary : theme.colors.textSecondary} 
              />
              <Text style={[styles.uploadText, { color: theme.colors.text }]}>
                {file && !file.canceled ? file.assets[0].name : "Seleccionar Archivo Excel"}
              </Text>
              {file && !file.canceled && (
                <Text style={[styles.fileSize, { color: theme.colors.textSecondary }]}>
                  {(file.assets[0].size! / 1024).toFixed(2)} KB
                </Text>
              )}
            </Pressable>

            <View style={styles.actions}>
              <Pressable 
                style={[styles.btn, styles.primaryBtn, { backgroundColor: theme.colors.primary, opacity: (!file || loading) ? 0.6 : 1 }]}
                onPress={handleUpload}
                disabled={!file || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="play" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.btnText}>Iniciar Carga</Text>
                  </>
                )}
              </Pressable>
            </View>

            {results && (
              <View style={[styles.resultsCard, { backgroundColor: theme.colors.card }]}>
                <Text style={[styles.resultsTitle, { color: theme.colors.text }]}>Resultado del Proceso</Text>
                <View style={styles.statsRow}>
                  <StatItem label="Éxitos" value={results.success} color="#34C759" />
                  <StatItem label="Errores" value={results.errors} color="#FF3B30" />
                </View>
                {results.details.length > 0 && (
                  <View style={styles.errorLog}>
                    {results.details.slice(0, 5).map((detail: string, i: number) => (
                      <Text key={i} style={styles.errorText}>• {detail}</Text>
                    ))}
                    {results.details.length > 5 && (
                      <Text style={styles.errorText}>... y {results.details.length - 5} errores más</Text>
                    )}
                  </View>
                )}
              </View>
            )}
          </View>

          <View style={[styles.card, { marginTop: 20 }]}>
            <Text style={[styles.title, { color: theme.colors.text, fontSize: 18 }]}>Instrucciones</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              1. Asegúrate de que el archivo tenga una fila de encabezado.{"\n"}
              2. Los nombres de las columnas deben ser exactamente: fullName y email.{"\n"}
              3. Opcionalmente puedes incluir classroomId para asignar el aula.
            </Text>
          </View>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const StatItem = ({ label, value, color }: any) => {
  const { theme } = useTheme();
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 10 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', marginLeft: 10 },
  scrollContent: { padding: 20 },
  card: { padding: 24, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 14, marginBottom: 24, lineHeight: 20 },
  uploadArea: { 
    height: 180, 
    borderRadius: 24, 
    borderWidth: 2, 
    borderStyle: 'dashed', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 24
  },
  uploadText: { marginTop: 12, fontSize: 16, fontWeight: '600' },
  fileSize: { marginTop: 4, fontSize: 12 },
  actions: { gap: 12 },
  btn: { height: 56, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  primaryBtn: { flex: 1 },
  btnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  resultsCard: { marginTop: 24, padding: 20, borderRadius: 20 },
  resultsTitle: { fontSize: 16, fontWeight: '700', marginBottom: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 12, marginTop: 4 },
  errorLog: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 12 },
  errorText: { fontSize: 12, color: '#FF3B30', marginBottom: 4 },
});
