# AnimatedInput Component

A fully-featured animated input field component for React Native with Reanimated 4.x support.

## Features

- ✅ **Entry Animation**: Smooth fade-in and slide-up animation with configurable delay for staggered effects
- ✅ **Focus Animation**: Visual feedback with border color change, border width increase (1→2), and subtle scale (1→1.02)
- ✅ **Error Animation**: Shake animation when error is present, with red border styling
- ✅ **Password Visibility Toggle**: Optional eye icon to show/hide password text
- ✅ **Theme Support**: Automatically adapts to light/dark mode using the app's theme system
- ✅ **Accessibility**: Full screen reader support with labels, hints, and proper roles
- ✅ **Keyboard Types**: Support for email, numeric, phone, and other keyboard types
- ✅ **Auto-capitalization**: Configurable text capitalization behavior

## Usage

### Basic Text Input

```tsx
import { AnimatedInput } from '@/components/login';

function MyForm() {
  const [username, setUsername] = useState('');

  return (
    <AnimatedInput
      value={username}
      onChangeText={setUsername}
      placeholder="Username"
      accessibilityLabel="Username"
      accessibilityHint="Enter your username"
      delay={0}
    />
  );
}
```

### Email Input with Validation

```tsx
import { AnimatedInput } from '@/components/login';

function EmailField() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>();

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (text && !text.includes('@')) {
      setError('Please enter a valid email address');
    } else {
      setError(undefined);
    }
  };

  return (
    <AnimatedInput
      value={email}
      onChangeText={handleEmailChange}
      placeholder="Email"
      error={error}
      keyboardType="email-address"
      autoCapitalize="none"
      accessibilityLabel="Email address"
      accessibilityHint="Enter your email address"
      delay={100}
    />
  );
}
```

### Password Input with Visibility Toggle

```tsx
import { AnimatedInput } from '@/components/login';

function PasswordField() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (text && text.length < 6) {
      setError('Password must be at least 6 characters');
    } else {
      setError(undefined);
    }
  };

  return (
    <AnimatedInput
      value={password}
      onChangeText={handlePasswordChange}
      placeholder="Password"
      error={error}
      secureTextEntry
      showVisibilityToggle
      accessibilityLabel="Password"
      accessibilityHint="Enter your password"
      delay={200}
    />
  );
}
```

### Staggered Form Animation

```tsx
import { AnimatedInput } from '@/components/login';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <View>
      {/* First field appears immediately */}
      <AnimatedInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        accessibilityLabel="Email"
        accessibilityHint="Enter your email"
        delay={0}
      />
      
      {/* Second field appears 100ms later */}
      <AnimatedInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
        showVisibilityToggle
        accessibilityLabel="Password"
        accessibilityHint="Enter your password"
        delay={100}
      />
    </View>
  );
}
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `value` | `string` | Yes | - | Current value of the input field |
| `onChangeText` | `(text: string) => void` | Yes | - | Callback when text changes |
| `placeholder` | `string` | Yes | - | Placeholder text |
| `error` | `string` | No | `undefined` | Error message (triggers error styling and shake animation) |
| `secureTextEntry` | `boolean` | No | `false` | Whether to hide text (for passwords) |
| `autoCapitalize` | `'none' \| 'sentences' \| 'words' \| 'characters'` | No | `'none'` | Auto-capitalization behavior |
| `keyboardType` | `KeyboardTypeOptions` | No | `'default'` | Keyboard type (email-address, numeric, phone-pad, etc.) |
| `accessibilityLabel` | `string` | Yes | - | Label for screen readers |
| `accessibilityHint` | `string` | Yes | - | Hint describing the field's purpose |
| `delay` | `number` | No | `0` | Delay in milliseconds for entry animation (for staggered effects) |
| `showVisibilityToggle` | `boolean` | No | `false` | Whether to show password visibility toggle |
| `onToggleVisibility` | `() => void` | No | `undefined` | Callback when visibility toggle is pressed |

## Animations

### Entry Animation
- **Duration**: 600ms
- **Effect**: Opacity (0→1) + TranslateY (50→0)
- **Easing**: Cubic ease-out
- **Delay**: Configurable via `delay` prop

### Focus Animation
- **Duration**: 200ms
- **Effect**: 
  - Border color changes to primary theme color
  - Border width increases from 1 to 2
  - Scale increases from 1.0 to 1.02
- **Easing**: Ease-out

### Error Animation
- **Duration**: 400ms
- **Effect**: Horizontal shake (translateX oscillates between -10 and 10)
- **Trigger**: When `error` prop is provided
- **Visual**: Red border color from theme

## Accessibility

The component provides full accessibility support:

- **Screen Reader Labels**: Uses `accessibilityLabel` for field identification
- **Hints**: Uses `accessibilityHint` to describe the field's purpose
- **Password Toggle**: Has proper accessibility label ("Show password" / "Hide password")
- **Role**: Properly identifies as a button for the visibility toggle

## Theme Integration

The component automatically adapts to the app's theme (light/dark mode):

- **Input Background**: Uses `theme.colors.inputBackground`
- **Text Color**: Uses `theme.colors.text`
- **Placeholder**: Uses `theme.colors.textSecondary`
- **Border (Normal)**: Uses `theme.colors.border`
- **Border (Focus)**: Uses `theme.colors.primary`
- **Border (Error)**: Uses `theme.colors.error`
- **Border Radius**: Uses `theme.borderRadius.md`
- **Shadow**: Uses `theme.shadows.sm`

## Requirements Validated

This component validates the following requirements from the spec:

- **3.1**: Shows input field for email or username
- **3.2**: Shows input field for password
- **3.5**: Shows visual focus indicator when user taps field
- **3.6**: Shows visibility icon in password field
- **4.1**: Animates entry of form elements when login screen mounts
- **4.2**: Animates elements in sequence with 100ms delay
- **4.3**: Uses fade and slide from bottom animations
- **6.1**: Shows red border on empty fields when validation fails
- **6.2**: Shows error message below field (via parent component)
- **6.3**: Animates error appearance with shake animation
- **8.1**: Provides accessibility labels for input fields
- **8.3**: Provides accessibility hints describing field purpose

## Testing

The component includes comprehensive unit tests covering:

- Rendering with different props
- Text input and change handling
- Password visibility toggle functionality
- Focus and blur events
- Error state handling
- Staggered animation delays
- Edge cases (long text, special characters)
- Theme adaptation (light/dark mode)
- Accessibility features

Run tests with:
```bash
npm test -- AnimatedInput.test.tsx
```

## Example

See `AnimatedInput.example.tsx` for a complete working example demonstrating all features.

## Dependencies

- `react-native-reanimated`: For high-performance animations
- `@/hooks/useTheme`: For theme integration
- `@/utils/animations`: For animation presets

## Notes

- The component uses React Native Reanimated 4.x for native-thread animations
- All animations run at 60 FPS on the native thread
- The shake animation is triggered automatically when the `error` prop changes
- The visibility toggle only appears when `showVisibilityToggle` is true
- The component is fully controlled - parent must manage state
