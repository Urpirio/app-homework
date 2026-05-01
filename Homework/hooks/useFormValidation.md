# useFormValidation Hook

Custom React hook for managing form validation state and logic in the login form.

## Overview

The `useFormValidation` hook provides a complete solution for form state management, including:
- Form field values
- Validation errors per field
- Automatic error clearing when user types (Requirement 6.4)
- Form validation on submit (Requirements 6.1, 6.2)
- Loading state management (Requirements 10.1, 10.2, 10.3)

## Installation

The hook is already included in the project. Import it from the hooks module:

```typescript
import { useFormValidation } from '@/hooks';
```

## API Reference

### Parameters

```typescript
useFormValidation<T>(
  initialValues: T,
  validationRules: ValidationRules<T>
): UseFormValidationReturn<T>
```

- **initialValues**: Initial values for form fields (e.g., `{ email: '', password: '' }`)
- **validationRules**: Object mapping field names to validation functions

### Return Value

```typescript
interface UseFormValidationReturn<T> {
  values: T;                                    // Current form field values
  errors: Record<string, string | undefined>;   // Validation errors per field
  handleChange: (field: keyof T, value: string) => void;  // Update field value
  handleSubmit: () => boolean;                  // Validate all fields
  clearError: (field: keyof T) => void;         // Clear specific field error
  setLoading: (loading: boolean) => void;       // Update loading state
  isLoading: boolean;                           // Current loading state
}
```

## Usage Example

### Basic Usage

```typescript
import { useFormValidation } from '@/hooks';
import { validateEmail, validatePassword } from '@/utils/validation';

function LoginForm() {
  const {
    values,
    errors,
    handleChange,
    handleSubmit,
    setLoading,
    isLoading,
  } = useFormValidation(
    { email: '', password: '' },
    {
      email: validateEmail,
      password: validatePassword,
    }
  );

  const onSubmit = async () => {
    // Validate all fields
    if (!handleSubmit()) {
      return; // Form has errors
    }

    // Start loading
    setLoading(true);

    try {
      await authenticateUser(values);
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <TextInput
        value={values.email}
        onChangeText={(text) => handleChange('email', text)}
        editable={!isLoading}
      />
      {errors.email && <Text>{errors.email}</Text>}

      <TextInput
        value={values.password}
        onChangeText={(text) => handleChange('password', text)}
        secureTextEntry
        editable={!isLoading}
      />
      {errors.password && <Text>{errors.password}</Text>}

      <Button
        title={isLoading ? 'Loading...' : 'Login'}
        onPress={onSubmit}
        disabled={isLoading}
      />
    </View>
  );
}
```

### Custom Validation Rules

```typescript
const form = useFormValidation(
  { username: '', age: '' },
  {
    username: (value) => {
      if (!value) return 'Username is required';
      if (value.length < 3) return 'Username too short';
      return undefined;
    },
    age: (value) => {
      if (!value) return 'Age is required';
      const num = parseInt(value);
      if (isNaN(num) || num < 18) return 'Must be 18 or older';
      return undefined;
    },
  }
);
```

## Features

### 1. Automatic Error Clearing (Requirement 6.4)

When a user starts typing in a field that has an error, the error is automatically cleared:

```typescript
// User submits form with empty email
handleSubmit(); // errors.email = "El correo electrónico es requerido"

// User starts typing
handleChange('email', 'u'); // errors.email = undefined (cleared!)
```

This provides immediate feedback and improves user experience.

### 2. Validation on Submit (Requirements 6.1, 6.2)

The `handleSubmit` function validates all fields and returns a boolean:

```typescript
const isValid = handleSubmit();

if (isValid) {
  // All fields are valid, proceed with submission
  console.log('Form is valid:', values);
} else {
  // Form has errors
  console.log('Validation errors:', errors);
}
```

### 3. Loading State Management (Requirements 10.1, 10.2, 10.3)

The hook manages loading state for async operations:

```typescript
setLoading(true);  // Start loading
// ... perform async operation
setLoading(false); // Stop loading

// Use isLoading to disable inputs and show loading indicators
<TextInput editable={!isLoading} />
<Button disabled={isLoading} />
```

### 4. Programmatic Error Clearing

Clear errors for specific fields programmatically:

```typescript
clearError('email'); // Clear email error only
```

## Validation Rules

Validation rules are functions that take a field value and return:
- `undefined` if the field is valid
- An error message string if the field is invalid

```typescript
type ValidationRule = (value: string) => string | undefined;
```

### Example Validation Rules

```typescript
const validationRules = {
  email: (value: string) => {
    if (!value) return 'Email is required';
    if (!value.includes('@')) return 'Invalid email format';
    return undefined;
  },
  password: (value: string) => {
    if (!value) return 'Password is required';
    if (value.length < 6) return 'Password must be at least 6 characters';
    return undefined;
  },
};
```

## Requirements Validation

This hook validates the following requirements:

- **Requirement 6.1**: Empty fields show validation errors on submit
- **Requirement 6.2**: Error messages are displayed below fields
- **Requirement 6.4**: Errors clear when user starts typing
- **Requirement 10.1**: Loading indicator display
- **Requirement 10.2**: Button disabled during loading
- **Requirement 10.3**: Input fields disabled during loading

## TypeScript Support

The hook is fully typed with TypeScript generics:

```typescript
interface LoginFormValues {
  email: string;
  password: string;
}

const form = useFormValidation<LoginFormValues>(
  { email: '', password: '' },
  {
    email: validateEmail,
    password: validatePassword,
  }
);

// form.values is typed as LoginFormValues
// form.handleChange accepts 'email' | 'password' as field names
```

## Testing

The hook includes comprehensive tests:

- **Unit tests**: Test individual hook functions
- **Integration tests**: Test with real validation functions
- **Workflow tests**: Test complete form submission workflows

Run tests:

```bash
npm test -- useFormValidation
```

## Best Practices

1. **Define validation rules outside the component** to avoid recreating them on every render:

```typescript
const validationRules = {
  email: validateEmail,
  password: validatePassword,
};

function MyComponent() {
  const form = useFormValidation(initialValues, validationRules);
  // ...
}
```

2. **Use the hook's loading state** instead of managing it separately:

```typescript
// ✅ Good
setLoading(true);
await submitForm();
setLoading(false);

// ❌ Bad - separate loading state
const [loading, setLoading] = useState(false);
```

3. **Check validation before async operations**:

```typescript
const onSubmit = async () => {
  if (!handleSubmit()) return; // Validate first
  
  setLoading(true);
  await submitForm(values);
  setLoading(false);
};
```

4. **Disable inputs during loading** to prevent user interaction:

```typescript
<TextInput
  value={values.email}
  onChangeText={(text) => handleChange('email', text)}
  editable={!isLoading}
/>
```

## Related

- [useTheme](./useTheme.ts) - Theme management hook
- [useKeyboardHeight](./useKeyboardHeight.ts) - Keyboard height detection
- [Validation Utils](../utils/validation.ts) - Validation functions
- [Auth Types](../types/auth.ts) - Form state types
