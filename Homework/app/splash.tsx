import { AnimatedLogo } from '@/components/splash/AnimatedLogo';
import { SplashContainer } from '@/components/splash/SplashContainer';
import { useAnimatedTransition } from '@/hooks/useAnimatedTransition';
import React from 'react';

/**
 * Splash Screen
 * 
 * Pantalla de presentación inicial de la aplicación que muestra el logo animado
 * y transiciona automáticamente a la pantalla de login después de completar
 * las animaciones de entrada y salida.
 * 
 * **Flujo de Animación:**
 * 1. El logo aparece con animación de entrada (scale y opacity: 0 → 1) en 1500ms
 * 2. El logo desaparece con animación de salida (scale: 1 → 1.2, opacity: 1 → 0) en 800ms
 * 3. Al completar las animaciones, navega automáticamente a /login
 * 
 * **Navegación:**
 * - Usa `router.replace()` para remover la pantalla splash del stack de navegación
 * - Esto previene que el usuario pueda volver atrás a la pantalla splash
 * 
 * @component
 * @example
 * ```tsx
 * // Esta pantalla se muestra automáticamente como punto de entrada de la app
 * // según la configuración en _layout.tsx
 * ```
 * 
 * **Validates: Requirements 1.1, 1.2, 1.4, 2.1**
 * - 1.1: Muestra el logo/marca cuando la app se inicia
 * - 1.2: Ejecuta animación de entrada del logo
 * - 1.4: Ejecuta animación de salida después de completar la entrada
 * - 2.1: Navega automáticamente a login después de completar animaciones
 */
export default function SplashScreen() {
  // Hook para gestionar la transición a la pantalla de login
  const { startTransition } = useAnimatedTransition('/login');

  /**
   * Callback invocado cuando las animaciones del logo se completan
   * Inicia la transición a la pantalla de login
   */
  const handleAnimationComplete = () => {
    startTransition();
  };

  return (
    <SplashContainer>
      <AnimatedLogo 
        onAnimationComplete={handleAnimationComplete}
        size={120}
      />
    </SplashContainer>
  );
}
