import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LoadingIndicator } from './LoadingIndicator';

/**
 * Example usage of the LoadingIndicator component
 * 
 * This file demonstrates different configurations of the LoadingIndicator
 */
export default function LoadingIndicatorExample() {
  return (
    <View style={styles.container}>
      {/* Default small spinner with theme color */}
      <View style={styles.example}>
        <LoadingIndicator />
      </View>
      
      {/* Large spinner with theme color */}
      <View style={styles.example}>
        <LoadingIndicator size="large" />
      </View>
      
      {/* Small spinner with custom color */}
      <View style={styles.example}>
        <LoadingIndicator color="#FF3B30" />
      </View>
      
      {/* Large spinner with custom color */}
      <View style={styles.example}>
        <LoadingIndicator size="large" color="#34C759" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
  },
  example: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#C7C7CC',
    borderRadius: 8,
  },
});
