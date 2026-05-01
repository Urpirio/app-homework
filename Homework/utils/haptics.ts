import * as Haptics from 'expo-haptics';

/**
 * Haptic feedback utility functions
 * Provides a simple wrapper around Expo Haptics with error handling
 */

/**
 * Triggers a light impact haptic feedback
 * Used for subtle interactions like button presses
 * 
 * @example
 * ```typescript
 * import { triggerHapticFeedback } from '@/utils/haptics';
 * 
 * <Pressable onPress={() => {
 *   triggerHapticFeedback();
 *   handleLogin();
 * }}>
 * ```
 */
export async function triggerHapticFeedback(): Promise<void> {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (error) {
    // Haptics may not be available on all devices/platforms
    // Fail silently to not disrupt user experience
    console.debug('Haptic feedback not available:', error);
  }
}

/**
 * Triggers a medium impact haptic feedback
 * Used for more prominent interactions
 * 
 * @example
 * ```typescript
 * triggerMediumHaptic();
 * ```
 */
export async function triggerMediumHaptic(): Promise<void> {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch (error) {
    console.debug('Haptic feedback not available:', error);
  }
}

/**
 * Triggers a heavy impact haptic feedback
 * Used for significant interactions or confirmations
 * 
 * @example
 * ```typescript
 * triggerHeavyHaptic();
 * ```
 */
export async function triggerHeavyHaptic(): Promise<void> {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch (error) {
    console.debug('Haptic feedback not available:', error);
  }
}

/**
 * Triggers a success notification haptic
 * Used to indicate successful completion of an action
 * 
 * @example
 * ```typescript
 * triggerSuccessHaptic();
 * ```
 */
export async function triggerSuccessHaptic(): Promise<void> {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (error) {
    console.debug('Haptic feedback not available:', error);
  }
}

/**
 * Triggers a warning notification haptic
 * Used to indicate a warning or caution
 * 
 * @example
 * ```typescript
 * triggerWarningHaptic();
 * ```
 */
export async function triggerWarningHaptic(): Promise<void> {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch (error) {
    console.debug('Haptic feedback not available:', error);
  }
}

/**
 * Triggers an error notification haptic
 * Used to indicate an error or failed action
 * 
 * @example
 * ```typescript
 * triggerErrorHaptic();
 * ```
 */
export async function triggerErrorHaptic(): Promise<void> {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch (error) {
    console.debug('Haptic feedback not available:', error);
  }
}

/**
 * Triggers a selection haptic feedback
 * Used for selection changes like toggles or pickers
 * 
 * @example
 * ```typescript
 * triggerSelectionHaptic();
 * ```
 */
export async function triggerSelectionHaptic(): Promise<void> {
  try {
    await Haptics.selectionAsync();
  } catch (error) {
    console.debug('Haptic feedback not available:', error);
  }
}
