# Plan de Implementación: Animated Splash Login

## Descripción General

Este plan implementa una experiencia de bienvenida moderna para la aplicación React Native/Expo, incluyendo una pantalla splash animada que transiciona automáticamente a una pantalla de login con diseño contemporáneo. La implementación utiliza React Native Reanimated 4.x para animaciones de alto rendimiento y Expo Router para navegación declarativa.

## Tareas

- [x] 1. Configurar dependencias y estructura base del proyecto
  - Instalar React Native Reanimated 4.x, Expo Haptics y dependencias necesarias
  - Crear estructura de carpetas: components/, hooks/, utils/, types/
  - Configurar babel.config.js para Reanimated
  - _Requisitos: 1.2, 4.1, 5.5_

- [ ] 2. Implementar sistema de temas y utilidades
  - [x] 2.1 Crear configuraciones de tema (lightTheme, darkTheme)
    - Implementar interfaces Theme, ColorScheme, Spacing, BorderRadius, Shadows en types/theme.ts
    - Definir colores, espaciados y sombras para modo claro y oscuro
    - _Requisitos: 7.1, 7.2, 7.4_
  
  - [x] 2.2 Crear hook useTheme
    - Implementar detección del tema del sistema usando useColorScheme
    - Retornar tema actual y flag isDark
    - _Requisitos: 7.1, 7.2, 7.3_
  
  - [x] 2.3 Crear utilidades de animación y validación
    - Implementar animationPresets en utils/animations.ts con configuraciones de duración y easing
    - Implementar funciones de validación de email y password en utils/validation.ts
    - Implementar wrapper de haptics en utils/haptics.ts
    - _Requisitos: 1.3, 1.5, 4.2, 5.4, 6.1_

- [ ] 3. Implementar componentes compartidos
  - [x] 3.1 Crear ThemedView component
    - Implementar componente que aplica colores según tema actual
    - Soportar props lightColor y darkColor opcionales
    - _Requisitos: 7.1, 7.2_
  
  - [x] 3.2 Crear KeyboardAvoidingContainer component
    - Implementar hook useKeyboardHeight para detectar altura del teclado
    - Crear contenedor que ajusta padding/scroll cuando aparece el teclado
    - Usar KeyboardAvoidingView con behavior apropiado por plataforma
    - _Requisitos: 9.4_

- [x] 4. Implementar pantalla Splash y sus componentes
  - [x] 4.1 Crear SplashContainer component
    - Implementar contenedor con ThemedView y SafeAreaView
    - Centrar contenido vertical y horizontalmente
    - _Requisitos: 1.1, 7.1, 9.3_
  
  - [x] 4.2 Crear AnimatedLogo component
    - Implementar animación de entrada: scale (0→1) + opacity (0→1) en 1500ms
    - Implementar animación de salida: scale (1→1.2) + opacity (1→0) en 800ms
    - Usar useSharedValue y useAnimatedStyle de Reanimated
    - Invocar callback onAnimationComplete al finalizar
    - _Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [ ]* 4.3 Escribir property test para animaciones del splash
    - **Property 2: Splash Entry Animation Execution**
    - **Property 3: Splash Animation Timing Compliance**
    - **Valida: Requisitos 1.2, 1.3, 1.5**
  
  - [x] 4.4 Crear hook useAnimatedTransition
    - Implementar lógica para iniciar transición después de animaciones
    - Usar router.replace() para navegar sin permitir volver atrás
    - _Requisitos: 2.1, 2.4_
  
  - [x] 4.5 Crear pantalla splash.tsx
    - Integrar SplashContainer y AnimatedLogo
    - Usar useAnimatedTransition para navegar a /login después de animaciones
    - _Requisitos: 1.1, 1.2, 1.4, 2.1_
  
  - [ ]* 4.6 Escribir property test para navegación automática
    - **Property 5: Automatic Navigation After Splash**
    - **Property 7: Splash Screen Stack Removal**
    - **Valida: Requisitos 2.1, 2.4**

- [x] 5. Checkpoint - Verificar splash screen funcional
  - Asegurar que todos los tests pasen, preguntar al usuario si surgen dudas.

- [x] 6. Implementar componentes de login
  - [x] 6.1 Crear ErrorMessage component
    - Implementar animación de shake: translateX oscila entre -10 y 10 en 400ms
    - Implementar fade in con opacity 0→1
    - Configurar accessibilityLiveRegion para anunciar errores
    - _Requisitos: 6.2, 6.3, 6.5, 8.4_
  
  - [ ]* 6.2 Escribir property test para animación de error
    - **Property 18: Error Message Shake Animation**
    - **Property 20: Shake Animation Duration**
    - **Valida: Requisitos 6.3, 6.5**
  
  - [x] 6.3 Crear LoadingIndicator component
    - Implementar spinner animado con ActivityIndicator
    - Adaptar color según tema
    - _Requisitos: 10.1, 10.4_
  
  - [x] 6.4 Crear AnimatedInput component
    - Implementar campo de entrada con estilos del tema
    - Implementar animación de entrada: opacity (0→1) + translateY (50→0) con delay configurable
    - Implementar animación de foco: borderColor, borderWidth (1→2), scale (1→1.02)
    - Implementar animación de error con shake
    - Agregar toggle de visibilidad para contraseña
    - Configurar accessibilityLabel y accessibilityHint
    - _Requisitos: 3.1, 3.2, 3.5, 3.6, 4.1, 4.2, 4.3, 6.1, 6.2, 6.3, 8.1, 8.3_
  
  - [ ]* 6.5 Escribir property tests para AnimatedInput
    - **Property 8: Input Focus Visual Feedback**
    - **Property 11: Fade and Slide Animation Pattern**
    - **Property 19: Error Clearing on Input**
    - **Valida: Requisitos 3.5, 4.3, 6.4**
  
  - [x] 6.6 Crear AnimatedButton component
    - Implementar botón con estilos del tema
    - Implementar animación de entrada: opacity (0→1) + translateY (50→0) con delay
    - Implementar animación de presión: scale (1→0.95) en press, (0.95→1) en release en 150ms
    - Integrar feedback háptico usando utils/haptics.ts
    - Mostrar LoadingIndicator cuando isLoading es true
    - Deshabilitar cuando disabled o isLoading
    - Configurar accessibilityLabel y accessibilityHint
    - _Requisitos: 3.3, 3.4, 4.1, 4.2, 5.1, 5.2, 5.3, 5.4, 5.5, 8.2, 10.2, 10.4_
  
  - [ ]* 6.7 Escribir property tests para AnimatedButton
    - **Property 13: Button Press Scale Animation**
    - **Property 14: Button Press-Release Round Trip**
    - **Property 15: Button Scale Animation Duration**
    - **Property 16: Haptic Feedback on Button Press**
    - **Valida: Requisitos 5.1, 5.2, 5.3, 5.4, 5.5**

- [x] 7. Implementar lógica de formulario y validación
  - [x] 7.1 Crear tipos de autenticación
    - Definir interfaces LoginCredentials y FormState en types/auth.ts
    - _Requisitos: 3.1, 3.2, 6.1, 6.2, 10.1_
  
  - [x] 7.2 Crear hook useFormValidation
    - Implementar gestión de estado del formulario (values, errors, isLoading)
    - Implementar handleChange que limpia errores al escribir
    - Implementar handleSubmit que valida todos los campos
    - Implementar clearError y setLoading
    - _Requisitos: 6.1, 6.2, 6.4, 10.1, 10.2, 10.3_
  
  - [ ]* 7.3 Escribir property tests para validación
    - **Property 17: Empty Field Validation Indicators**
    - **Valida: Requisitos 6.1, 6.2**

- [ ] 8. Implementar LoginForm y pantalla de login
  - [x] 8.1 Crear LoginForm component
    - Integrar AnimatedInput para email y password con delays escalonados (0ms, 100ms)
    - Integrar AnimatedButton con delay de 200ms
    - Integrar ErrorMessage para cada campo
    - Usar useFormValidation para gestión de estado
    - Implementar animaciones de entrada con stagger de 100ms
    - Configurar orden de navegación lógico (email → password → button)
    - _Requisitos: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4, 6.1, 6.2, 8.5_
  
  - [ ]* 8.2 Escribir property tests para LoginForm
    - **Property 9: Login Elements Entry Animation**
    - **Property 10: Staggered Animation Timing**
    - **Property 12: Total Login Animation Duration**
    - **Valida: Requisitos 4.1, 4.2, 4.4**
  
  - [x] 8.3 Crear pantalla login.tsx
    - Integrar ThemedView como contenedor principal
    - Integrar KeyboardAvoidingContainer
    - Integrar ScrollView para pantallas pequeñas
    - Integrar LoginForm con callback onSubmit
    - Aplicar SafeAreaView para márgenes seguros
    - _Requisitos: 3.1, 3.2, 3.3, 7.1, 7.2, 9.2, 9.3, 9.4, 9.5_
  
  - [ ]* 8.4 Escribir unit tests para renderizado de login
    - Verificar que se muestran campos de email, password y botón
    - Verificar que campo de password tiene secureTextEntry
    - Verificar que se muestra toggle de visibilidad
    - _Valida: Requisitos 3.1, 3.2, 3.3, 3.6_

- [ ] 9. Checkpoint - Verificar login screen funcional
  - Asegurar que todos los tests pasen, preguntar al usuario si surgen dudas.

- [ ] 10. Implementar características de accesibilidad y responsividad
  - [ ] 10.1 Verificar y ajustar etiquetas de accesibilidad
    - Revisar que todos los campos tengan accessibilityLabel y accessibilityHint
    - Revisar que botón tenga accessibilityLabel
    - Revisar que errores usen accessibilityLiveRegion
    - _Requisitos: 8.1, 8.2, 8.3, 8.4_
  
  - [ ]* 10.2 Escribir unit tests de accesibilidad
    - Verificar accessibilityLabel en todos los elementos interactivos
    - Verificar accessibilityHint en campos de entrada
    - Verificar orden de navegación lógico
    - _Valida: Requisitos 8.1, 8.2, 8.3, 8.5_
  
  - [ ] 10.3 Implementar responsividad del logo
    - Ajustar tamaño del logo en AnimatedLogo según dimensiones de pantalla
    - Usar Dimensions API o porcentaje de ancho de pantalla
    - _Requisitos: 9.1_
  
  - [ ]* 10.4 Escribir property test para responsividad
    - **Property 25: Responsive Logo Sizing**
    - **Property 26: Responsive Layout Spacing**
    - **Valida: Requisitos 9.1, 9.2**
  
  - [ ] 10.5 Verificar adaptación de tema en tiempo real
    - Asegurar que useTheme detecta cambios del sistema
    - Verificar que componentes se re-renderizan con nuevos colores
    - _Requisitos: 7.3_
  
  - [ ]* 10.6 Escribir property tests para temas
    - **Property 21: Theme-Based Color Adaptation**
    - **Property 22: Real-Time Theme Updates**
    - **Property 23: Color Contrast Compliance**
    - **Valida: Requisitos 7.1, 7.2, 7.3, 7.4**

- [ ] 11. Implementar gestión de estado de carga
  - [ ] 11.1 Integrar estado de carga en LoginForm
    - Mostrar LoadingIndicator en botón cuando isLoading es true
    - Deshabilitar campos y botón durante carga
    - _Requisitos: 10.1, 10.2, 10.3, 10.4_
  
  - [ ]* 11.2 Escribir property tests para estado de carga
    - **Property 29: Loading Indicator Display**
    - **Property 30: Interactive Elements Disabled During Loading**
    - **Property 31: Loading Spinner in Button**
    - **Property 32: Loading State Round Trip**
    - **Valida: Requisitos 10.1, 10.2, 10.3, 10.4, 10.5**

- [ ] 12. Configurar navegación y layout raíz
  - [ ] 12.1 Configurar _layout.tsx
    - Configurar Stack Navigator de Expo Router
    - Definir splash como pantalla inicial
    - Configurar opciones de navegación (sin header, transiciones suaves)
    - _Requisitos: 2.1, 2.2, 2.3_
  
  - [ ]* 12.2 Escribir integration test para flujo completo
    - Verificar navegación de splash a login después de animaciones
    - Verificar que splash no está en el stack después de transición
    - _Valida: Requisitos 2.1, 2.4_
  
  - [ ]* 12.3 Escribir property test para transición de navegación
    - **Property 6: Navigation Transition Performance**
    - **Valida: Requisitos 2.3**

- [ ] 13. Implementar manejo de errores
  - [ ] 13.1 Agregar manejo de errores de validación
    - Implementar mensajes de error específicos en español
    - Asegurar que errores se muestran con animación de shake
    - _Requisitos: 6.1, 6.2, 6.3_
  
  - [ ] 13.2 Agregar manejo de errores de red y autenticación
    - Implementar try-catch en onSubmit de LoginForm
    - Mostrar mensajes de error apropiados (red, credenciales incorrectas)
    - Limpiar campo de password en error de autenticación
    - _Requisitos: 6.1, 6.2_
  
  - [ ]* 13.3 Escribir unit tests para edge cases
    - Verificar manejo de emails muy largos
    - Verificar manejo de caracteres especiales en password
    - Verificar prevención de múltiples submits rápidos
    - Verificar uso de ScrollView en pantallas pequeñas

- [ ] 14. Checkpoint final - Verificar integración completa
  - Ejecutar todos los tests (unit y property)
  - Verificar que la aplicación funciona en modo claro y oscuro
  - Verificar que las animaciones son fluidas (60 FPS)
  - Verificar accesibilidad con lector de pantalla
  - Preguntar al usuario si surgen dudas o se requieren ajustes.

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requisitos específicos para trazabilidad
- Los checkpoints aseguran validación incremental
- Los property tests validan propiedades universales de correctness
- Los unit tests validan ejemplos específicos y casos edge
- La implementación usa TypeScript para seguridad de tipos
- Las animaciones usan React Native Reanimated 4.x para rendimiento nativo
