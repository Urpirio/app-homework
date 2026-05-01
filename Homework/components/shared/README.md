# Shared Components

This directory contains reusable components that are used across multiple features in the application.

## ThemedView

A container component that automatically applies colors based on the current theme (light/dark mode).

### Features

- ✅ **Automatic Theme Detection**: Uses React Native's `useColorScheme` to detect system theme
- ✅ **Real-time Updates**: Automatically updates when system theme changes (Requirement 7.3)
- ✅ **Custom Colors**: Supports optional `lightColor` and `darkColor` props for custom theming
- ✅ **Style Composition**: Merges custom styles with theme-based colors
- ✅ **TypeScript Support**: Full type safety with TypeScript interfaces

### Requirements Validation

This component validates the following requirements from the spec:

- **Requirement 7.1**: Splash screen adapts colors according to system theme
- **Requirement 7.2**: Login screen adapts colors according to system theme
- **Requirement 7.3**: App updates colors in real-time when system theme changes

### Usage

#### Basic Usage

```tsx
import { ThemedView } from '@/components/shared';

function MyScreen() {
  return (
    <ThemedView>
      <Text>Content here</Text>
    </ThemedView>
  );
}
```

#### With Custom Colors

```tsx
<ThemedView 
  lightColor="#F5F5F5" 
  darkColor="#1A1A1A"
>
  <Text>Custom themed content</Text>
</ThemedView>
```

#### With Additional Styles

```tsx
<ThemedView style={{ padding: 20, borderRadius: 8 }}>
  <Text>Styled content</Text>
</ThemedView>
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `children` | `React.ReactNode` | Yes | Child components to render |
| `style` | `ViewStyle` | No | Additional styles to apply |
| `lightColor` | `string` | No | Custom background color for light mode |
| `darkColor` | `string` | No | Custom background color for dark mode |

### Implementation Details

The component uses the `useTheme` hook to access the current theme configuration. The background color is determined by:

1. If in dark mode and `darkColor` is provided, use `darkColor`
2. If in light mode and `lightColor` is provided, use `lightColor`
3. Otherwise, use the default `theme.colors.background`

This ensures that the component always has an appropriate background color while allowing for customization when needed.

### Testing

Unit tests are provided in `__tests__/ThemedView.test.tsx` covering:

- ✅ Light theme rendering
- ✅ Dark theme rendering
- ✅ Custom color props
- ✅ Style composition
- ✅ Theme switching
- ✅ Edge cases (null theme, empty styles, multiple children)

To run tests (once Jest is configured):

```bash
npm test -- components/shared/__tests__/ThemedView.test.tsx
```

### Examples

See `ThemedView.example.tsx` for comprehensive usage examples including:

- Basic usage
- Custom colors
- Styled containers
- Nested views
- Full screen layouts

---

## KeyboardAvoidingContainer

A container component that adjusts its content when the keyboard appears, ensuring input fields remain visible.

### Features

- ✅ **Platform-Specific Behavior**: Uses appropriate `KeyboardAvoidingView` behavior for iOS and Android
- ✅ **Keyboard Height Detection**: Automatically detects keyboard height using `useKeyboardHeight` hook
- ✅ **ScrollView Integration**: Optional ScrollView for content that needs scrolling
- ✅ **Automatic Padding**: Adjusts padding when keyboard is visible
- ✅ **TypeScript Support**: Full type safety with TypeScript interfaces

### Requirements Validation

This component validates the following requirements from the spec:

- **Requirement 9.4**: Login screen adjusts layout when keyboard appears to keep focused field visible

### Usage

#### Basic Usage

```tsx
import { KeyboardAvoidingContainer } from '@/components/shared';

function LoginScreen() {
  return (
    <KeyboardAvoidingContainer>
      <TextInput placeholder="Email" />
      <TextInput placeholder="Password" secureTextEntry />
      <Button title="Login" />
    </KeyboardAvoidingContainer>
  );
}
```

#### Without ScrollView

```tsx
<KeyboardAvoidingContainer enableScroll={false}>
  <View>
    <TextInput placeholder="Email" />
    <TextInput placeholder="Password" />
  </View>
</KeyboardAvoidingContainer>
```

#### With Custom Styles

```tsx
<KeyboardAvoidingContainer style={{ padding: 20 }}>
  <TextInput placeholder="Email" />
  <TextInput placeholder="Password" />
</KeyboardAvoidingContainer>
```

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `children` | `React.ReactNode` | Yes | - | Child components to render |
| `style` | `ViewStyle` | No | - | Additional styles to apply to container |
| `enableScroll` | `boolean` | No | `true` | Whether to wrap content in ScrollView |

### Implementation Details

The component uses:

1. **KeyboardAvoidingView**: Platform-specific behavior
   - iOS: `padding` behavior (works better with native keyboard)
   - Android: `height` behavior (adjusts container height)

2. **useKeyboardHeight Hook**: Detects keyboard height and visibility
   - Listens to platform-specific keyboard events
   - Returns current keyboard height and visibility state

3. **ScrollView** (optional): Wraps content for scrolling
   - Configured with `keyboardShouldPersistTaps="handled"` for better UX
   - Adds bottom padding when keyboard is visible

### Platform Differences

#### iOS
- Uses `keyboardWillShow` and `keyboardWillHide` events
- Behavior: `padding`
- Smoother animations due to "will" events

#### Android
- Uses `keyboardDidShow` and `keyboardDidHide` events
- Behavior: `height`
- Adjusts after keyboard is fully shown

### Testing

Unit tests are provided in `__tests__/KeyboardAvoidingContainer.test.tsx` covering:

- ✅ Basic rendering
- ✅ Platform-specific behavior
- ✅ ScrollView integration
- ✅ Keyboard event listeners
- ✅ Custom styles
- ✅ Edge cases

To run tests:

```bash
npm test -- components/shared/__tests__/KeyboardAvoidingContainer.test.tsx
```

### Related Hooks

- **useKeyboardHeight**: Hook used internally to detect keyboard height
  - See `hooks/useKeyboardHeight.ts` for implementation
  - Tests in `hooks/__tests__/useKeyboardHeight.test.ts`
