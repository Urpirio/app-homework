 import { BackgroundShapes } from '@/components/login/BackgroundShapes';
import { AnimatedButton } from '@/components/login/AnimatedButton';
import { AnimatedInput } from '@/components/login/AnimatedInput';
import { ThemedView } from '@/components/shared/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { 
  ScrollView, 
  StyleSheet, 
  Text, 
  View, 
  Dimensions, 
  Pressable,
  Switch,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import * as SecureStore from 'expo-secure-store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SecurityScreen() {
  const { theme } = useTheme();

  // State for password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // State for toggles
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  React.useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const biometric = await SecureStore.getItemAsync('isBiometricEnabled');
    setIsBiometricEnabled(biometric === 'true');
  };

  const handleToggleBiometrics = async (value: boolean) => {
    setIsBiometricEnabled(value);
    await SecureStore.setItemAsync('isBiometricEnabled', value ? 'true' : 'false');
  };

  const horizontalPadding = SCREEN_WIDTH > 400 ? theme.spacing.xl : theme.spacing.md;

  const validate = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Todos los campos son obligatorios');
      return false;
    }
    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres');
      return false;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas nuevas no coinciden');
      return false;
    }
    setError(null);
    return true;
  };

  const handleUpdatePress = () => {
    if (validate()) {
      setConfirmVisible(true);
    }
  };

  const handleConfirmUpdate = async () => {
    setIsLoading(true);
    try {
      await api.patch('/auth/change-password', {
        currentPassword,
        newPassword
      });
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setConfirmVisible(false);
      
      Alert.alert('Éxito', 'Contraseña actualizada con éxito');
    } catch (error: any) {
      console.error('Error changing password:', error);
      const msg = error.response?.data?.message || 'No se pudo actualizar la contraseña. Verifica tu contraseña actual.';
      setError(Array.isArray(msg) ? msg[0] : msg);
      setConfirmVisible(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ThemedView style={styles.container}>
        <BackgroundShapes />
        
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={{ paddingHorizontal: horizontalPadding }}>
              <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                  <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </Pressable>
                <Text style={[styles.title, { color: theme.colors.text }]}>Seguridad</Text>
                <View style={{ width: 40 }} />
              </View>

              <Animated.View entering={FadeInDown.duration(800)} style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Cambiar Contraseña</Text>
                <View style={styles.formContainer}>
                  {error && (
                    <View style={[styles.errorBadge, { backgroundColor: theme.colors.error + '15' }]}>
                      <Ionicons name="alert-circle" size={16} color={theme.colors.error} />
                      <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
                    </View>
                  )}
                  
                  <AnimatedInput
                    value={currentPassword}
                    onChangeText={(val) => { setCurrentPassword(val); setError(null); }}
                    placeholder="Contraseña actual"
                    secureTextEntry
                    icon="lock-closed-outline"
                    showVisibilityToggle
                  />
                  <AnimatedInput
                    value={newPassword}
                    onChangeText={(val) => { setNewPassword(val); setError(null); }}
                    placeholder="Nueva contraseña"
                    secureTextEntry
                    icon="key-outline"
                    showVisibilityToggle
                  />
                  <AnimatedInput
                    value={confirmPassword}
                    onChangeText={(val) => { setConfirmPassword(val); setError(null); }}
                    placeholder="Confirmar nueva contraseña"
                    secureTextEntry
                    icon="checkmark-circle-outline"
                    showVisibilityToggle
                  />
                  <View style={styles.buttonWrapper}>
                    <AnimatedButton 
                      title="Actualizar Contraseña" 
                      onPress={handleUpdatePress}
                      isLoading={isLoading}
                    />
                  </View>
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Protección Adicional</Text>
                
                <SecurityToggle 
                  icon="finger-print-outline" 
                  label="Autenticación Biométrica" 
                  description="Usa FaceID o Huella para entrar"
                  value={isBiometricEnabled}
                  onToggle={handleToggleBiometrics}
                />

                <SecurityToggle 
                  icon="shield-checkmark-outline" 
                  label="Doble Factor (2FA)" 
                  description="Verificación adicional por correo"
                  value={isTwoFactorEnabled}
                  onToggle={setIsTwoFactorEnabled}
                />
              </Animated.View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <ConfirmModal 
          visible={confirmVisible}
          onClose={() => setConfirmVisible(false)}
          onConfirm={handleConfirmUpdate}
          title="Cambiar Contraseña"
          message="¿Estás seguro de que deseas cambiar tu contraseña actual? Deberás usar la nueva la próxima vez que inicies sesión."
          confirmLabel="Cambiar"
        />
      </ThemedView>
    </SafeAreaView>
  );
}

const SecurityToggle = ({ icon, label, description, value, onToggle }: any) => {
  const { theme } = useTheme();
  return (
    <View style={styles.toggleItem}>
      <View style={[styles.toggleIcon, { backgroundColor: theme.colors.card }]}>
        <Ionicons name={icon} size={22} color={theme.colors.text} />
      </View>
      <View style={styles.toggleText}>
        <Text style={[styles.toggleLabel, { color: theme.colors.text }]}>{label}</Text>
        <Text style={[styles.toggleDescription, { color: theme.colors.textSecondary }]}>{description}</Text>
      </View>
      <Switch 
        value={value} 
        onValueChange={onToggle}
        trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
        thumbColor={Platform.OS === 'ios' ? undefined : '#FFFFFF'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 10,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800' },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 20,
  },
  formContainer: {
    gap: 4,
  },
  errorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },
  buttonWrapper: {
    marginTop: 12,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  toggleIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  toggleText: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  toggleDescription: {
    fontSize: 13,
  },
});
