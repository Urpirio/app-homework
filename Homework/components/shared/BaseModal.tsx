import { useTheme } from '@/hooks/useTheme';
import React from 'react';
import { Modal, StyleSheet, View, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, { FadeIn, SlideInUp, SlideInDown, FadeOut } from 'react-native-reanimated';

interface BaseModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export const BaseModal = ({ visible, onClose, children }: BaseModalProps) => {
  const { theme } = useTheme();

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View 
          entering={FadeIn} 
          exiting={FadeOut} 
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
          style={styles.keyboardView}
        >
          <Animated.View 
            entering={SlideInDown.duration(400)}
            style={[
              styles.content, 
              { backgroundColor: theme.colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24 }
            ]}
          >
            <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />
            {children}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  keyboardView: {
    width: '100%',
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    padding: 24,
    paddingTop: 12,
    minHeight: 200,
    maxHeight: '90%',
    flexShrink: 1,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
});
