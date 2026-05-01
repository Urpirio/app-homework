# AnimatedButton Component

A button component with smooth animations, haptic feedback, and loading state support for the login screen.

## Features

- **Entry Animation**: Fades in and slides up from below with configurable delay for staggered animations
- **Press Animation**: Scales down to 0.95 on press and back to 1.0 on release in 150ms
- **Haptic Feedback**: Provides tactile feedback using Expo Haptics when pressed
- **Loading State**: Shows a spinner and disables interaction when `isLoading` is true
- **Disabled State**: Visual feedback and interaction blocking when `disabled` is true
- **Accessibility**: Full support for screen readers with labels and hints
- **Theme Support**: Automatically adapts colors based on light/dark mode

## Usage

```tsx
import { AnimatedButton } from '@/components/login';

function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await authenticateUser();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatedButton
      onPress={handleLogin}
      title="Iniciar Sesión"
      isLoading={isLoading}
      accessibilityLabel="Botón de inicio de sesión"
      accessibilityHint="Toca para iniciar sesión con tus credenciales"
      delay={200}
    />
  );
}
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `onPress` | `() => void` | Yes | - | Callback function when button is pressed |
| `title` | `string` | Yes | - | Text displayed on the button |
| `isLoading` | `boolean` | No | `false` | Shows loading spinner and disables button |
| `disabled` | `boolean` | No | `false` | Disables button interaction |
| `accessibilityLabel` | `string` | Yes | - | Label for screen readers |
| `accessibilityHint` | `string` | Yes | - | Hint describing what happens when pressed |
| `delay` | `number` | No | `0` | Delay in milliseconds before entry animation starts |

## Animations

### Entry Animation
- **Duration**: 600ms
- **Easing**: Cubic ease-out
- **Properties**: 
  - Opacity: 0 → 1
  - TranslateY: 50 → 0

### Press Animation
- **Duration**: 150ms
- **Easing**: Ease in-out
- **Properties**:
  - Scale: 1 → 0.95 (on press)
  - Scale: 0.95 → 1 (on release)

## Accessibility

The component includes:
- `accessibilityRole="button"` for proper identification
- `accessibilityState` with `disabled` and `busy` states
- Custom `accessibilityLabel` and `accessibilityHint` props
- Proper disabled state handling

## Requirements Validation

This component validates the following requirements:
- **3.3**: Shows login button
- **3.4**: Applies modern styles with rounded corners and subtle shadows
- **4.1**: Animates entry of form elements when login screen mounts
- **4.2**: Animates elements in sequence with 100ms delay
- **5.1**: Applies scale animation when user presses button
- **5.2**: Reduces scale to 0.95 during press
- **5.3**: Restores scale to 1.0 when user releases button
- **5.4**: Completes scale animation in 150ms
- **5.5**: Provides haptic feedback when user touches button
- **8.2**: Provides accessibility label for login button
- **10.2**: Disables button while loading indicator is visible
- **10.4**: Shows animated spinner inside button during loading

## Staggered Animations

Use the `delay` prop to create staggered entry animations:

```tsx
<AnimatedInput delay={0} {...emailProps} />
<AnimatedInput delay={100} {...passwordProps} />
<AnimatedButton delay={200} {...buttonProps} />
```

This creates a cascading effect where each element appears 100ms after the previous one.

## Theme Integration

The button automatically uses colors from the current theme:
- Background: `theme.colors.primary`
- Text: White (#FFFFFF)
- Shadow: `theme.shadows.md`
- Border radius: `theme.borderRadius.md`

## Loading State

When `isLoading` is true:
- The button text is replaced with a white spinner
- The button is automatically disabled
- The `accessibilityState.busy` is set to true for screen readers
- Opacity is reduced to 0.5

## Disabled State

When `disabled` is true:
- Button interaction is blocked
- Opacity is reduced to 0.5
- The `accessibilityState.disabled` is set to true for screen readers
