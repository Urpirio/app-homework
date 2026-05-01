/**
 * Tests for useFormValidation hook
 * 
 * Validates Requirements: 6.1, 6.2, 6.4, 10.1, 10.2, 10.3
 */

import { act, renderHook } from '@testing-library/react-native';
import { useFormValidation } from '../useFormValidation';

describe('useFormValidation', () => {
  const mockValidationRules = {
    email: (value: string) => {
      if (!value) return 'Email is required';
      if (!value.includes('@')) return 'Invalid email';
      return undefined;
    },
    password: (value: string) => {
      if (!value) return 'Password is required';
      if (value.length < 6) return 'Password too short';
      return undefined;
    },
  };

  const initialValues = {
    email: '',
    password: '',
  };

  it('should initialize with provided values', () => {
    const { result } = renderHook(() =>
      useFormValidation(initialValues, mockValidationRules)
    );

    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.isLoading).toBe(false);
  });

  it('should update field value when handleChange is called', () => {
    const { result } = renderHook(() =>
      useFormValidation(initialValues, mockValidationRules)
    );

    act(() => {
      result.current.handleChange('email', 'test@example.com');
    });

    expect(result.current.values.email).toBe('test@example.com');
  });

  it('should clear error when user starts typing (Requirement 6.4)', () => {
    const { result } = renderHook(() =>
      useFormValidation(initialValues, mockValidationRules)
    );

    // First, trigger validation to create errors
    act(() => {
      result.current.handleSubmit();
    });

    expect(result.current.errors.email).toBe('Email is required');

    // Now type in the field - error should clear
    act(() => {
      result.current.handleChange('email', 't');
    });

    expect(result.current.errors.email).toBeUndefined();
  });

  it('should validate all fields on submit and return false if invalid (Requirements 6.1, 6.2)', () => {
    const { result } = renderHook(() =>
      useFormValidation(initialValues, mockValidationRules)
    );

    let isValid: boolean = true;

    act(() => {
      isValid = result.current.handleSubmit();
    });

    expect(isValid).toBe(false);
    expect(result.current.errors.email).toBe('Email is required');
    expect(result.current.errors.password).toBe('Password is required');
  });

  it('should validate all fields on submit and return true if valid', () => {
    const { result } = renderHook(() =>
      useFormValidation(
        { email: 'test@example.com', password: 'password123' },
        mockValidationRules
      )
    );

    let isValid: boolean = false;

    act(() => {
      isValid = result.current.handleSubmit();
    });

    expect(isValid).toBe(true);
    expect(result.current.errors).toEqual({});
  });

  it('should show specific validation errors for each field', () => {
    const { result } = renderHook(() =>
      useFormValidation(
        { email: 'invalid', password: '123' },
        mockValidationRules
      )
    );

    act(() => {
      result.current.handleSubmit();
    });

    expect(result.current.errors.email).toBe('Invalid email');
    expect(result.current.errors.password).toBe('Password too short');
  });

  it('should clear specific field error with clearError', () => {
    const { result } = renderHook(() =>
      useFormValidation(initialValues, mockValidationRules)
    );

    // Create errors
    act(() => {
      result.current.handleSubmit();
    });

    expect(result.current.errors.email).toBeDefined();

    // Clear specific error
    act(() => {
      result.current.clearError('email');
    });

    expect(result.current.errors.email).toBeUndefined();
    expect(result.current.errors.password).toBeDefined(); // Other errors remain
  });

  it('should update loading state (Requirements 10.1, 10.2, 10.3)', () => {
    const { result } = renderHook(() =>
      useFormValidation(initialValues, mockValidationRules)
    );

    expect(result.current.isLoading).toBe(false);

    act(() => {
      result.current.setLoading(true);
    });

    expect(result.current.isLoading).toBe(true);

    act(() => {
      result.current.setLoading(false);
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('should handle multiple field updates correctly', () => {
    const { result } = renderHook(() =>
      useFormValidation(initialValues, mockValidationRules)
    );

    act(() => {
      result.current.handleChange('email', 'user@example.com');
      result.current.handleChange('password', 'securepass123');
    });

    expect(result.current.values.email).toBe('user@example.com');
    expect(result.current.values.password).toBe('securepass123');
  });

  it('should validate only fields with validation rules', () => {
    const partialRules = {
      email: (value: string) => (!value ? 'Email required' : undefined),
    };

    const { result } = renderHook(() =>
      useFormValidation(
        { email: '', password: 'anypassword' },
        partialRules
      )
    );

    act(() => {
      result.current.handleSubmit();
    });

    expect(result.current.errors.email).toBe('Email required');
    expect(result.current.errors.password).toBeUndefined();
  });
});
