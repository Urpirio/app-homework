# Hooks

This directory contains custom React hooks for the animated splash and login feature.

## Available Hooks

### `useAnimatedTransition`

Hook for managing animated transitions between screens, specifically designed for navigating from the splash screen to the login screen.

**Features:**
- Uses `router.replace()` to remove the splash screen from navigation stack
- Prevents users from navigating back to the splash screen
- Supports optional delay before transition
- Prevents multiple simultaneous transitions
- Provides transition state for UI feedback

**Usage:**
```typescript
import { useAnimatedTransition } from '@/hooks/useAnimatedTransition';

const { startTransition, isTransitioning } = useAnimatedTransition('/login');

// Call startTransition after animations complete
const handleAnimationComplete = () => {
  startTransition();
};
```

**Parameters:**
- `targetRoute` (string): The route to navigate to (e.g., '/login')
- `delay` (number, optional): Delay in milliseconds before navigation (default: 0)

**Returns:**
- `startTransition` (function): Function to initiate the transition
- `isTransitioning` (boolean): Whether a transition is in progress

**Validates Requirements:** 2.1, 2.4

---

### `useTheme`

Hook for accessing the current theme (light or dark) based on system preferences.

**Usage:**
```typescript
import { useTheme } from '@/hooks/useTheme';

const { theme, isDark } = useTheme();
```

---

### `useKeyboardHeight`

Hook for detecting keyboard height and visibility state.

**Usage:**
```typescript
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';

const { keyboardHeight, isKeyboardVisible } = useKeyboardHeight();
```

---

### `useFormValidation` (Coming Soon)

Hook for form validation logic in the login screen.

## Examples

See the `.example.tsx` files in this directory for detailed usage examples of each hook.
