# LoginForm Component

## Overview

The `LoginForm` component is the main form component that orchestrates the complete login experience. It integrates `AnimatedInput`, `AnimatedButton`, `ErrorMessage`, and the `useFormValidation` hook to create a fully functional login form with staggered animations, validation, and accessibility support.

## Features

- ✅ **Staggered Entry Animations**: Elements animate in sequence with 100ms delays
  - Email input: 0ms delay
  - Password input: 100ms delay
  - Login button: 200ms delay
- ✅ **Form Validation**: Real-time validation with error messages
- ✅ **Loading State**: Shows loading indicator during authentication
- ✅ **Password Visibility Toggle**: Users can show/hide password
- ✅ **Accessibility**: Full screen reader support with logical navigation order
- ✅ **Theme Support**: Automatically adapts to light/dark mode
- ✅ **Error Handling**: Displays validation errors with shake animations

## Usage

### Basic Example

```tsx
import { LoginForm } from '@/components/login';
import { router } from 'expo-router';

export default function LoginScreen() {
  const handleLogin = async (credentials: LoginCredentials) => {
    try {
      // Authenticate user
      await authenticateUser(credentials);
      
      // Navigate to home screen
      router.replace('/home');
    } catch (error) {
      // Handle authentication errors
      console.error('Authentication failed:', error);
      throw error;
    }
  };

  return (
    <View style={styles.container}>
      <LoginForm onSubmit={handleLogin} />
    </View>
  );
}
```

### With Error Handling

```tsx
import { LoginForm } from '@/components/login';
import { useState } from 'react';

export default function LoginScreen() {
  const [authError, setAuthError] = useState<string | null>(null);

  const handleLogin = async (credentials: LoginCredentials) => {
    try {
      setAuthError(null);
      await authenticateUser(credentials);
      router.replace('/home');
    } catch (error) {
      if (error instanceof NetworkError) {
        setAuthError('Error de conexión. Verifica tu internet e intenta nuevamente');
      } else if (error instanceof AuthenticationError) {
        setAuthError('Correo o contraseña incorrectos');
      } else {
        setAuthError('Ocurrió un error inesperado. Intenta nuevamente');
      }
      throw error;
    }
  };

  return (
    <View style={styles.container}>
      <LoginForm onSubmit={handleLogin} />
      {authError && (
        <ErrorMessage message={authError} visible={true} />
      )}
    </View>
  );
}
```

## Props

### LoginFormProps

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onSubmit` | `(credentials: LoginCredentials) => Promise<void>` | Yes | Callback function called when form is submitted with valid credentials |

### LoginCredentials

```typescript
interface LoginCredentials {
  email: string;      // Email or username
  password: string;   // Password
}
```

## Animation Timing

The component implements staggered entry animations:

1. **Email Input**: Appears immediately (0ms delay)
2. **Password Input**: Appears 100ms after email
3. **Login Button**: Appears 200ms after email (100ms after password)

Total animation sequence completes in less than 1000ms as per requirements.

## Validation

The form validates:

### Email Field
- ✅ Required (cannot be empty)
- ✅ Must be valid email format OR valid username (min 3 characters)
- ❌ Error: "El correo electrónico es requerido"
- ❌ Error: "Ingresa un correo electrónico válido"

### Password Field
- ✅ Required (cannot be empty)
- ✅ Minimum 6 characters
- ❌ Error: "La contraseña es requerida"
- ❌ Error: "La contraseña debe tener al menos 6 caracteres"

## Accessibility

The component provides full accessibility support:

- **Screen Reader Labels**: All inputs and buttons have descriptive labels
- **Accessibility Hints**: Each field has hints describing its purpose
- **Error Announcements**: Errors are announced to screen readers via `accessibilityLiveRegion`
- **Logical Navigation Order**: Tab order follows: email → password → button
- **Loading State**: Button announces "busy" state during loading

## State Management

The component uses the `useFormValidation` hook to manage:

- Form field values (email, password)
- Validation errors
- Loading state
- Error clearing on input

## Error Handling

### Validation Errors
- Displayed below each field with shake animation
- Automatically cleared when user starts typing
- Red border applied to fields with errors

### Authentication Errors
- Should be handled in the parent component's `onSubmit` handler
- Can be displayed using the `ErrorMessage` component
- Loading state is automatically cleared on error

## Integration with Other Components

The LoginForm integrates:

1. **AnimatedInput**: For email and password fields
2. **AnimatedButton**: For the submit button
3. **ErrorMessage**: For displaying validation errors
4. **useFormValidation**: For state management and validation logic

## Requirements Validated

This component validates the following requirements:

- **3.1**: Shows input field for email or username
- **3.2**: Shows input field for password
- **3.3**: Shows login button
- **4.1**: Animates entry of form elements when login screen mounts
- **4.2**: Animates elements in sequence with 100ms delay between each
- **4.3**: Uses fade and slide from bottom animations
- **4.4**: Completes all entry animations in less than 1000ms
- **6.1**: Shows red border on empty fields when validation fails
- **6.2**: Shows error message below each field
- **8.5**: Maintains logical navigation order for keyboard navigation

## Testing

### Unit Tests

```typescript
describe('LoginForm', () => {
  it('should render email and password inputs', () => {
    const { getByLabelText } = render(<LoginForm onSubmit={jest.fn()} />);
    expect(getByLabelText('Correo electrónico')).toBeTruthy();
    expect(getByLabelText('Contraseña')).toBeTruthy();
  });

  it('should show validation errors on submit with empty fields', async () => {
    const { getByRole, getByText } = render(<LoginForm onSubmit={jest.fn()} />);
    const button = getByRole('button');
    
    fireEvent.press(button);
    
    await waitFor(() => {
      expect(getByText('El correo electrónico es requerido')).toBeTruthy();
      expect(getByText('La contraseña es requerida')).toBeTruthy();
    });
  });

  it('should call onSubmit with valid credentials', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const { getByLabelText, getByRole } = render(<LoginForm onSubmit={onSubmit} />);
    
    fireEvent.changeText(getByLabelText('Correo electrónico'), 'user@example.com');
    fireEvent.changeText(getByLabelText('Contraseña'), 'password123');
    fireEvent.press(getByRole('button'));
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'password123',
      });
    });
  });
});
```

## Related Components

- [AnimatedInput](./AnimatedInput.README.md)
- [AnimatedButton](./AnimatedButton.README.md)
- [ErrorMessage](./ErrorMessage.tsx)
- [LoadingIndicator](./LoadingIndicator.tsx)

## Related Hooks

- [useFormValidation](../../hooks/useFormValidation.ts)

## Related Utilities

- [validation](../../utils/validation.ts)
- [animations](../../utils/animations.ts)
