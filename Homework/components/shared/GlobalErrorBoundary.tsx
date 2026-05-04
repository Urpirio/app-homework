/**
 * GlobalErrorBoundary Component
 *
 * React error boundary that catches unhandled JS errors and renders
 * a crash recovery screen with a "Reload" button. Wraps the app root
 * as Layer 5 of the 5-layer error handling strategy.
 *
 * Validates: Requirements 9.3, 9.4
 */

import { Ionicons } from '@expo/vector-icons';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface GlobalErrorBoundaryProps {
  children: ReactNode;
  /** Optional callback invoked when the user taps Reload */
  onReset?: () => void;
}

interface GlobalErrorBoundaryState {
  hasError: boolean;
}

export class GlobalErrorBoundary extends Component<GlobalErrorBoundaryProps, GlobalErrorBoundaryState> {
  constructor(props: GlobalErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): GlobalErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Log error details for debugging — not shown to the user
    console.error('[GlobalErrorBoundary]', error, info.componentStack);
  }

  private handleReload = () => {
    this.setState({ hasError: false });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container} accessibilityRole="alert">
          <Ionicons name="bug-outline" size={56} color="#AEAEB2" style={styles.icon} />
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            An unexpected error occurred. Please reload the app.
          </Text>
          <TouchableOpacity
            style={styles.reloadButton}
            onPress={this.handleReload}
            accessibilityRole="button"
            accessibilityLabel="Reload"
          >
            <Text style={styles.reloadButtonText}>Reload</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#000000',
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#AEAEB2',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  reloadButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#0A84FF',
  },
  reloadButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
