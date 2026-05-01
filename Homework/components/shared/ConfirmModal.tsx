import { useTheme } from '@/hooks/useTheme';
import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { BaseModal } from '../shared/BaseModal';
import { AnimatedButton } from '../login/AnimatedButton';

interface ConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
}

export const ConfirmModal = ({ 
  visible, 
  onClose, 
  onConfirm, 
  title, 
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  isDestructive = false
}: ConfirmModalProps) => {
  const { theme } = useTheme();

  return (
    <BaseModal visible={visible} onClose={onClose}>
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      <Text style={[styles.message, { color: theme.colors.textSecondary }]}>{message}</Text>
      
      <View style={styles.buttonRow}>
        <Pressable 
          onPress={onClose}
          style={[styles.cancelButton, { borderColor: theme.colors.border }]}
        >
          <Text style={[styles.cancelLabel, { color: theme.colors.text }]}>{cancelLabel}</Text>
        </Pressable>
        
        <View style={styles.confirmButtonWrapper}>
          <AnimatedButton 
            title={confirmLabel} 
            onPress={() => { onConfirm(); onClose(); }}
            variant={isDestructive ? 'error' : 'primary'}
          />
        </View>
      </View>
    </BaseModal>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 30,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  cancelButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  confirmButtonWrapper: {
    flex: 1,
  },
});
