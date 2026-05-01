import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';
import React from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    ViewStyle,
} from 'react-native';

/**
 * Props para el componente KeyboardAvoidingContainer
 */
export interface KeyboardAvoidingContainerProps {
  /** Contenido hijo del contenedor */
  children: React.ReactNode;
  /** Estilos adicionales para el contenedor */
  style?: ViewStyle;
  /** Si se debe usar ScrollView internamente (default: true) */
  enableScroll?: boolean;
}

/**
 * Contenedor que ajusta su contenido cuando aparece el teclado
 * 
 * Este componente utiliza KeyboardAvoidingView con el behavior apropiado
 * por plataforma y ajusta el padding/scroll para mantener visible el campo activo.
 * 
 * **Valida: Requisito 9.4**
 * 
 * @example
 * <KeyboardAvoidingContainer>
 *   <TextInput placeholder="Email" />
 *   <TextInput placeholder="Password" />
 * </KeyboardAvoidingContainer>
 */
export function KeyboardAvoidingContainer({
  children,
  style,
  enableScroll = true,
}: KeyboardAvoidingContainerProps) {
  const { keyboardHeight } = useKeyboardHeight();

  // Behavior apropiado por plataforma
  // iOS: 'padding' funciona mejor con el teclado nativo
  // Android: 'height' ajusta la altura del contenedor
  const behavior = Platform.select({
    ios: 'padding' as const,
    android: 'height' as const,
  });

  // Offset adicional para iOS para evitar que el contenido quede muy pegado al teclado
  const keyboardVerticalOffset = Platform.OS === 'ios' ? 0 : 0;

  return (
    <KeyboardAvoidingView
      behavior={behavior}
      keyboardVerticalOffset={keyboardVerticalOffset}
      style={[styles.container, style]}
    >
      {enableScroll ? (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: keyboardHeight > 0 ? 20 : 0 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
