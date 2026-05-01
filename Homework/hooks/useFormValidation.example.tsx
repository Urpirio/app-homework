/**
 * Example usage of useFormValidation hook
 * 
 * This file demonstrates how to use the useFormValidation hook
 * in a React component for form management.
 */

import React from 'react';
import { Button, Text, TextInput, View } from 'react-native';
import { validateEmail, validatePassword } from '../utils/validation';
import { useFormValidation } from './useFormValidation';

/**
 * Example Login Form Component
 * 
 * Demonstrates the useFormValidation hook in action with:
 * - Email and password fields
 * - Real-time error clearing when typing
 * - Validation on submit
 * - Loading state management
 */
export function ExampleLoginForm() {
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
    const isValid = handleSubmit();
    
    if (!isValid) {
      console.log('Form has errors:', errors);
      return;
    }

    // Start loading
    setLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log('Login successful with:', values);
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      // Stop loading
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      {/* Email Input */}
      <View style={{ marginBottom: 16 }}>
        <TextInput
          value={values.email}
          onChangeText={(text) => handleChange('email', text)}
          placeholder="Email"
          editable={!isLoading}
          style={{
            borderWidth: 1,
            borderColor: errors.email ? 'red' : '#ccc',
            padding: 10,
            borderRadius: 8,
          }}
        />
        {errors.email && (
          <Text style={{ color: 'red', marginTop: 4 }}>
            {errors.email}
          </Text>
        )}
      </View>

      {/* Password Input */}
      <View style={{ marginBottom: 16 }}>
        <TextInput
          value={values.password}
          onChangeText={(text) => handleChange('password', text)}
          placeholder="Password"
          secureTextEntry
          editable={!isLoading}
          style={{
            borderWidth: 1,
            borderColor: errors.password ? 'red' : '#ccc',
            padding: 10,
            borderRadius: 8,
          }}
        />
        {errors.password && (
          <Text style={{ color: 'red', marginTop: 4 }}>
            {errors.password}
          </Text>
        )}
      </View>

      {/* Submit Button */}
      <Button
        title={isLoading ? 'Loading...' : 'Login'}
        onPress={onSubmit}
        disabled={isLoading}
      />
    </View>
  );
}

/**
 * Key Features Demonstrated:
 * 
 * 1. Form State Management:
 *    - values: Current field values
 *    - errors: Validation errors per field
 *    - isLoading: Loading state
 * 
 * 2. Error Clearing on Input (Requirement 6.4):
 *    - When user types in a field with an error, the error is automatically cleared
 *    - Implemented via handleChange function
 * 
 * 3. Validation on Submit (Requirements 6.1, 6.2):
 *    - handleSubmit validates all fields
 *    - Returns true if valid, false if errors exist
 *    - Updates errors state with validation messages
 * 
 * 4. Loading State (Requirements 10.1, 10.2, 10.3):
 *    - setLoading controls the loading state
 *    - Fields are disabled during loading
 *    - Button shows loading indicator
 */
