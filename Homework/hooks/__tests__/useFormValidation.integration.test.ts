/**
 * Integration tests for useFormValidation hook with actual validation functions
 * 
 * These tests verify the hook works correctly with the real validation
 * functions from utils/validation.ts
 * 
 * Validates Requirements: 6.1, 6.2, 6.4, 10.1, 10.2, 10.3
 */

import { act, renderHook } from '@testing-library/react-native';
import { validateEmail, validatePassword } from '../../utils/validation';
import { useFormValidation } from '../useFormValidation';

describe('useFormValidation Integration Tests', () => {
  const initialValues = {
    email: '',
    password: '',
  };

  const validationRules = {
    email: validateEmail,
    password: validatePassword,
  };

  describe('Integration with Real Validation Functions', () => {
    it('should validate empty email with real validator', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialValues, validationRules)
      );

      act(() => {
        result.current.handleSubmit();
      });

      expect(result.current.errors.email).toBe('El correo electrónico es requerido');
    });

    it('should validate invalid email format with real validator', () => {
      const { result } = renderHook(() =>
        useFormValidation({ email: 'invalid', password: '' }, validationRules)
      );

      act(() => {
        result.current.handleSubmit();
      });

      expect(result.current.errors.email).toBe('Ingresa un correo electrónico válido');
    });

    it('should accept valid email with real validator', () => {
      const { result } = renderHook(() =>
        useFormValidation(
          { email: 'user@example.com', password: 'password123' },
          validationRules
        )
      );

      let isValid: boolean = false;

      act(() => {
        isValid = result.current.handleSubmit();
      });

      expect(isValid).toBe(true);
      expect(result.current.errors.email).toBeUndefined();
    });

    it('should accept valid username with real validator', () => {
      const { result } = renderHook(() =>
        useFormValidation(
          { email: 'username123', password: 'password123' },
          validationRules
        )
      );

      let isValid: boolean = false;

      act(() => {
        isValid = result.current.handleSubmit();
      });

      expect(isValid).toBe(true);
      expect(result.current.errors.email).toBeUndefined();
    });

    it('should validate empty password with real validator', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialValues, validationRules)
      );

      act(() => {
        result.current.handleSubmit();
      });

      expect(result.current.errors.password).toBe('La contraseña es requerida');
    });

    it('should validate short password with real validator', () => {
      const { result } = renderHook(() =>
        useFormValidation({ email: '', password: '123' }, validationRules)
      );

      act(() => {
        result.current.handleSubmit();
      });

      expect(result.current.errors.password).toBe(
        'La contraseña debe tener al menos 6 caracteres'
      );
    });

    it('should accept valid password with real validator', () => {
      const { result } = renderHook(() =>
        useFormValidation(
          { email: 'user@example.com', password: 'password123' },
          validationRules
        )
      );

      let isValid: boolean = false;

      act(() => {
        isValid = result.current.handleSubmit();
      });

      expect(isValid).toBe(true);
      expect(result.current.errors.password).toBeUndefined();
    });
  });

  describe('Requirement 6.4: Error Clearing on Input', () => {
    it('should clear email error when user starts typing', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialValues, validationRules)
      );

      // Submit to generate errors
      act(() => {
        result.current.handleSubmit();
      });

      expect(result.current.errors.email).toBe('El correo electrónico es requerido');

      // Start typing - error should clear
      act(() => {
        result.current.handleChange('email', 'u');
      });

      expect(result.current.errors.email).toBeUndefined();
      expect(result.current.values.email).toBe('u');
    });

    it('should clear password error when user starts typing', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialValues, validationRules)
      );

      // Submit to generate errors
      act(() => {
        result.current.handleSubmit();
      });

      expect(result.current.errors.password).toBe('La contraseña es requerida');

      // Start typing - error should clear
      act(() => {
        result.current.handleChange('password', 'p');
      });

      expect(result.current.errors.password).toBeUndefined();
      expect(result.current.values.password).toBe('p');
    });

    it('should not affect other field errors when clearing one field', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialValues, validationRules)
      );

      // Submit to generate errors for both fields
      act(() => {
        result.current.handleSubmit();
      });

      expect(result.current.errors.email).toBeDefined();
      expect(result.current.errors.password).toBeDefined();

      // Clear only email error
      act(() => {
        result.current.handleChange('email', 'user@example.com');
      });

      expect(result.current.errors.email).toBeUndefined();
      expect(result.current.errors.password).toBe('La contraseña es requerida');
    });
  });

  describe('Requirements 10.1, 10.2, 10.3: Loading State', () => {
    it('should manage loading state for async operations', () => {
      const { result } = renderHook(() =>
        useFormValidation(
          { email: 'user@example.com', password: 'password123' },
          validationRules
        )
      );

      expect(result.current.isLoading).toBe(false);

      // Simulate starting async operation
      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);

      // Simulate completing async operation
      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should support typical login flow with loading state', async () => {
      const { result } = renderHook(() =>
        useFormValidation(
          { email: 'user@example.com', password: 'password123' },
          validationRules
        )
      );

      // Step 1: Validate form
      let isValid: boolean = false;
      act(() => {
        isValid = result.current.handleSubmit();
      });

      expect(isValid).toBe(true);

      // Step 2: Start loading
      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);

      // Step 3: Simulate async operation
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Step 4: Stop loading
      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Complete Form Workflow', () => {
    it('should handle complete login workflow', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialValues, validationRules)
      );

      // Step 1: User enters email
      act(() => {
        result.current.handleChange('email', 'user@example.com');
      });

      expect(result.current.values.email).toBe('user@example.com');

      // Step 2: User enters password
      act(() => {
        result.current.handleChange('password', 'mypassword');
      });

      expect(result.current.values.password).toBe('mypassword');

      // Step 3: User submits form
      let isValid: boolean = false;
      act(() => {
        isValid = result.current.handleSubmit();
      });

      expect(isValid).toBe(true);
      expect(result.current.errors).toEqual({});

      // Step 4: Start authentication
      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('should handle workflow with validation errors', () => {
      const { result } = renderHook(() =>
        useFormValidation(initialValues, validationRules)
      );

      // Step 1: User enters invalid email
      act(() => {
        result.current.handleChange('email', 'invalid');
      });

      // Step 2: User enters short password
      act(() => {
        result.current.handleChange('password', '123');
      });

      // Step 3: User submits form
      let isValid: boolean = true;
      act(() => {
        isValid = result.current.handleSubmit();
      });

      expect(isValid).toBe(false);
      expect(result.current.errors.email).toBe('Ingresa un correo electrónico válido');
      expect(result.current.errors.password).toBe(
        'La contraseña debe tener al menos 6 caracteres'
      );

      // Step 4: User corrects email
      act(() => {
        result.current.handleChange('email', 'user@example.com');
      });

      expect(result.current.errors.email).toBeUndefined();
      expect(result.current.errors.password).toBeDefined(); // Still has error

      // Step 5: User corrects password
      act(() => {
        result.current.handleChange('password', 'password123');
      });

      expect(result.current.errors.password).toBeUndefined();

      // Step 6: User submits again
      act(() => {
        isValid = result.current.handleSubmit();
      });

      expect(isValid).toBe(true);
      expect(result.current.errors).toEqual({});
    });
  });
});
