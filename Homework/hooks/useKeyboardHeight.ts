import { useEffect, useState } from 'react';
import { Keyboard, KeyboardEvent, Platform } from 'react-native';

/**
 * Hook para detectar la altura del teclado y su visibilidad
 * 
 * @returns {Object} Objeto con keyboardHeight (altura del teclado) e isKeyboardVisible (visibilidad)
 * 
 * @example
 * const { keyboardHeight, isKeyboardVisible } = useKeyboardHeight();
 * 
 * // Usar la altura para ajustar el padding
 * <View style={{ paddingBottom: keyboardHeight }}>
 *   {children}
 * </View>
 */
export function useKeyboardHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    // Eventos específicos por plataforma
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    /**
     * Handler para cuando el teclado se muestra
     */
    const handleKeyboardShow = (event: KeyboardEvent) => {
      setKeyboardHeight(event.endCoordinates.height);
      setIsKeyboardVisible(true);
    };

    /**
     * Handler para cuando el teclado se oculta
     */
    const handleKeyboardHide = () => {
      setKeyboardHeight(0);
      setIsKeyboardVisible(false);
    };

    // Suscribirse a los eventos del teclado
    const showSubscription = Keyboard.addListener(showEvent, handleKeyboardShow);
    const hideSubscription = Keyboard.addListener(hideEvent, handleKeyboardHide);

    // Cleanup: remover listeners al desmontar
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return {
    keyboardHeight,
    isKeyboardVisible,
  };
}
