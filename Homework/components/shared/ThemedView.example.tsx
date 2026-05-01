/**
 * ThemedView Component - Usage Examples
 * 
 * This file demonstrates various ways to use the ThemedView component.
 * These examples are for documentation purposes and can be used as reference.
 */

import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { ThemedView } from './ThemedView';

/**
 * Example 1: Basic usage with default theme colors
 * The background will automatically be white in light mode and black in dark mode
 */
export function BasicExample() {
  return (
    <ThemedView>
      <Text>This view uses default theme colors</Text>
    </ThemedView>
  );
}

/**
 * Example 2: Custom colors per theme
 * Specify different colors for light and dark modes
 */
export function CustomColorsExample() {
  return (
    <ThemedView 
      lightColor="#F5F5F5"  // Light gray in light mode
      darkColor="#1A1A1A"   // Dark gray in dark mode
    >
      <Text>This view has custom background colors</Text>
    </ThemedView>
  );
}

/**
 * Example 3: With additional styles
 * Combine theme colors with custom styling
 */
export function StyledExample() {
  return (
    <ThemedView style={styles.container}>
      <Text>This view has padding and rounded corners</Text>
    </ThemedView>
  );
}

/**
 * Example 4: Nested ThemedViews
 * Create complex layouts with multiple themed containers
 */
export function NestedExample() {
  return (
    <ThemedView style={styles.outerContainer}>
      <Text>Outer container</Text>
      
      <ThemedView 
        lightColor="#E5E5E5"
        darkColor="#2A2A2A"
        style={styles.innerContainer}
      >
        <Text>Inner container with different colors</Text>
      </ThemedView>
    </ThemedView>
  );
}

/**
 * Example 5: Full screen container
 * Use as a screen wrapper with safe areas
 */
export function ScreenExample() {
  return (
    <ThemedView style={styles.screen}>
      <Text style={styles.title}>Screen Title</Text>
      <Text>Screen content goes here</Text>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 8,
    margin: 10,
  },
  outerContainer: {
    padding: 20,
  },
  innerContainer: {
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
  },
  screen: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
