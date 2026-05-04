import { queryClient } from '@/utils/queryClient';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    AppState,
    AppStateStatus,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

const WARNING_THRESHOLD_MS = 25 * 60 * 1000; // 25 minutes
const LOGOUT_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes
const CHECK_INTERVAL_MS = 60 * 1000; // 60 seconds

interface SessionTimeoutProviderProps {
  children: React.ReactNode;
}

export function SessionTimeoutProvider({ children }: SessionTimeoutProviderProps) {
  const lastInteraction = useRef<number>(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const [showWarning, setShowWarning] = useState(false);

  const resetTimer = useCallback(() => {
    lastInteraction.current = Date.now();
    setShowWarning(false);
  }, []);

  const handleLogout = useCallback(async () => {
    // Clear the interval first to prevent further checks
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setShowWarning(false);

    try {
      await SecureStore.deleteItemAsync('userToken');
      await SecureStore.deleteItemAsync('refreshToken');
    } catch {
      // Ignore SecureStore cleanup errors
    }

    queryClient.clear();
    router.replace('/login');
  }, []);

  const checkInactivity = useCallback(() => {
    const elapsed = Date.now() - lastInteraction.current;

    if (elapsed >= LOGOUT_THRESHOLD_MS) {
      handleLogout();
    } else if (elapsed >= WARNING_THRESHOLD_MS) {
      setShowWarning(true);
    }
  }, [handleLogout]);

  // Set up the interval check
  useEffect(() => {
    intervalRef.current = setInterval(checkInactivity, CHECK_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkInactivity]);

  // Pause/resume on AppState changes
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        const previous = appStateRef.current ?? 'active';

        if (
          (previous === 'inactive' || previous === 'background') &&
          nextAppState === 'active'
        ) {
          // Resuming from background — restart the interval and check immediately
          lastInteraction.current = Date.now();
          if (!intervalRef.current) {
            intervalRef.current = setInterval(checkInactivity, CHECK_INTERVAL_MS);
          }
        } else if (nextAppState === 'inactive' || nextAppState === 'background') {
          // Going to background — pause the interval
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }

        appStateRef.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, [checkInactivity]);

  const handleTouch = useCallback(() => {
    lastInteraction.current = Date.now();
  }, []);

  const handleContinue = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  return (
    <View style={styles.container} onTouchStart={handleTouch}>
      {children}

      <Modal
        visible={showWarning}
        transparent
        animationType="fade"
        onRequestClose={handleContinue}
      >
        <View style={styles.overlay}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>Session Expiring</Text>
            <Text style={styles.message}>
              Your session will expire in 5 minutes due to inactivity. Tap
              Continue to stay logged in.
            </Text>
            <Pressable style={styles.button} onPress={handleContinue}>
              <Text style={styles.buttonText}>Continue</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: '#AEAEB2',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 48,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
