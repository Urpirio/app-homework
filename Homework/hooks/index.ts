/**
 * Hooks Module
 * 
 * Central export point for all custom React hooks used in the application.
 */

export { useTheme } from './useTheme';
export type { Theme, UseThemeReturn } from './useTheme';

export { useKeyboardHeight } from './useKeyboardHeight';
export type { UseKeyboardHeightReturn } from './useKeyboardHeight';

export { useAnimatedTransition } from './useAnimatedTransition';
export type { UseAnimatedTransitionReturn } from './useAnimatedTransition';

export { useFormValidation } from './useFormValidation';
export type { UseFormValidationReturn, ValidationRules } from './useFormValidation';

export { buildDraftKey, useDraftAutoSave } from './useDraftAutoSave';
export type { UseDraftAutoSaveOptions, UseDraftAutoSaveReturn } from './useDraftAutoSave';

export { usePreventNavigation } from './usePreventNavigation';
export type { UsePreventNavigationOptions } from './usePreventNavigation';

