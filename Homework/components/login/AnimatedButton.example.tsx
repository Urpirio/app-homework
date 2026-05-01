import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AnimatedButton } from './AnimatedButton';

/**
 * Example usage of the AnimatedButton component
 * 
 * This example demonstrates:
 * - Basic button usage
 * - Loading state
 * - Disabled state
 * - Staggered entry animations
 */
export default function AnimatedButtonExample() {
  const [isLoading, setIsLoading] = useState(false);

  const handlePress = () => {
    console.log('Button pressed!');
    setIsLoading(true);
    
    // Simulate async operation
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  return (
    <View style={styles.container}>
      {/* Basic button */}
      <AnimatedButton
        onPress={handlePress}
        title="Iniciar Sesión"
        accessibilityLabel="Botón de inicio de sesión"
        accessibilityHint="Toca para iniciar sesión con tus credenciales"
        delay={0}
      />

      {/* Button with loading state */}
      <AnimatedButton
        onPress={handlePress}
        title="Iniciar Sesión"
        isLoading={isLoading}
        accessibilityLabel="Botón de inicio de sesión"
        accessibilityHint="Toca para iniciar sesión con tus credenciales"
        delay={100}
      />

      {/* Disabled button */}
      <AnimatedButton
        onPress={handlePress}
        title="Iniciar Sesión"
        disabled={true}
        accessibilityLabel="Botón de inicio de sesión"
        accessibilityHint="Completa todos los campos para habilitar el botón"
        delay={200}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
});
