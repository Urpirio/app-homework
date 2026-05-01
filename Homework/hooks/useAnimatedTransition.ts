import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';

/**
 * Hook para gestionar la transición animada entre pantallas
 * 
 * Este hook maneja la navegación desde la pantalla splash a la pantalla de login,
 * asegurando que la pantalla splash sea removida de la pila de navegación.
 * 
 * @param targetRoute - Ruta de destino para la navegación (ej: '/login')
 * @param delay - Retraso opcional antes de iniciar la transición (en ms)
 * @returns Objeto con función startTransition y estado isTransitioning
 * 
 * @example
 * ```tsx
 * const { startTransition, isTransitioning } = useAnimatedTransition('/login');
 * 
 * // Iniciar transición después de que las animaciones se completen
 * const handleAnimationComplete = () => {
 *   startTransition();
 * };
 * ```
 */
export interface UseAnimatedTransitionReturn {
  /**
   * Inicia la transición a la ruta de destino
   * Usa router.replace() para evitar que el usuario pueda volver atrás
   */
  startTransition: () => void;
  
  /**
   * Indica si la transición está en progreso
   */
  isTransitioning: boolean;
}

export function useAnimatedTransition(
  targetRoute: string,
  delay: number = 0
): UseAnimatedTransitionReturn {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);

  const startTransition = useCallback(() => {
    // Prevenir múltiples transiciones simultáneas
    if (isTransitioning) {
      return;
    }

    setIsTransitioning(true);

    // Aplicar delay si se especifica
    const transitionTimeout = setTimeout(() => {
      // Usar replace() en lugar de push() para remover la pantalla splash
      // de la pila de navegación, evitando que el usuario pueda volver atrás
      router.replace(targetRoute as any);
    }, delay);

    // Cleanup function para cancelar el timeout si el componente se desmonta
    return () => {
      clearTimeout(transitionTimeout);
    };
  }, [targetRoute, delay, isTransitioning, router]);

  return {
    startTransition,
    isTransitioning,
  };
}
