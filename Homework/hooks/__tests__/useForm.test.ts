/**
 * Tests for useForm hook with Zod schema validation
 *
 * Validates: Requirements 9.1, 9.2, 9.6
 */

import { act, renderHook } from '@testing-library/react-native';
import { z } from 'zod';
import { useForm } from '../useForm';

const testSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  email: z.string().email('Invalid email'),
  age: z.number().min(0, 'Age must be positive').optional(),
});

type TestValues = {
  name: string;
  email: string;
  age?: number;
};

const initialValues: TestValues = {
  name: '',
  email: '',
  age: undefined,
};

describe('useForm', () => {
  it('should initialize with provided values and empty errors', () => {
    const { result } = renderHook(() => useForm(testSchema, initialValues));

    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
    expect(result.current.isValid).toBe(false);
  });

  it('should update field value on handleChange', () => {
    const { result } = renderHook(() => useForm(testSchema, initialValues));

    act(() => {
      result.current.handleChange('name', 'Alice');
    });

    expect(result.current.values.name).toBe('Alice');
  });

  it('should clear field error on handleChange', () => {
    const { result } = renderHook(() => useForm(testSchema, initialValues));

    // Trigger errors via submit
    act(() => {
      result.current.handleSubmit();
    });
    expect(result.current.errors.name).toBeDefined();

    // Change the field — error should clear
    act(() => {
      result.current.handleChange('name', 'A');
    });
    expect(result.current.errors.name).toBeUndefined();
  });

  describe('handleBlur (field-level validation)', () => {
    it('should validate a single field on blur and set error', () => {
      const { result } = renderHook(() => useForm(testSchema, initialValues));

      act(() => {
        result.current.handleBlur('name');
      });

      expect(result.current.touched.name).toBe(true);
      expect(result.current.errors.name).toBe('Name is required');
    });

    it('should clear error on blur when field is valid', () => {
      const { result } = renderHook(() =>
        useForm(testSchema, { ...initialValues, name: 'Alice', email: 'a@b.com' })
      );

      act(() => {
        result.current.handleBlur('name');
      });

      expect(result.current.touched.name).toBe(true);
      expect(result.current.errors.name).toBeUndefined();
    });

    it('should only set error for the blurred field', () => {
      const { result } = renderHook(() => useForm(testSchema, initialValues));

      act(() => {
        result.current.handleBlur('name');
      });

      // email is also invalid but should not have an error yet
      expect(result.current.errors.name).toBeDefined();
      expect(result.current.errors.email).toBeUndefined();
    });
  });

  describe('handleSubmit (form-level validation)', () => {
    it('should return false and set errors when form is invalid', () => {
      const { result } = renderHook(() => useForm(testSchema, initialValues));

      let isValid: boolean = true;
      act(() => {
        isValid = result.current.handleSubmit();
      });

      expect(isValid).toBe(false);
      expect(result.current.errors.name).toBe('Name is required');
      expect(result.current.errors.email).toBeDefined();
    });

    it('should mark all fields as touched on submit', () => {
      const { result } = renderHook(() => useForm(testSchema, initialValues));

      act(() => {
        result.current.handleSubmit();
      });

      expect(result.current.touched.name).toBe(true);
      expect(result.current.touched.email).toBe(true);
    });

    it('should return true and clear errors when form is valid', () => {
      const { result } = renderHook(() =>
        useForm(testSchema, { name: 'Alice', email: 'alice@example.com' })
      );

      let isValid: boolean = false;
      act(() => {
        isValid = result.current.handleSubmit();
      });

      expect(isValid).toBe(true);
      expect(result.current.errors).toEqual({});
    });

    it('should call onSubmit callback when form is valid', () => {
      const onSubmit = jest.fn();
      const { result } = renderHook(() =>
        useForm(testSchema, { name: 'Alice', email: 'alice@example.com' })
      );

      act(() => {
        result.current.handleSubmit(onSubmit);
      });

      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Alice',
        email: 'alice@example.com',
      });
    });

    it('should not call onSubmit callback when form is invalid', () => {
      const onSubmit = jest.fn();
      const { result } = renderHook(() => useForm(testSchema, initialValues));

      act(() => {
        result.current.handleSubmit(onSubmit);
      });

      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('isValid', () => {
    it('should be false when required fields are empty', () => {
      const { result } = renderHook(() => useForm(testSchema, initialValues));
      expect(result.current.isValid).toBe(false);
    });

    it('should be true when all fields are valid', () => {
      const { result } = renderHook(() =>
        useForm(testSchema, { name: 'Alice', email: 'alice@example.com' })
      );
      expect(result.current.isValid).toBe(true);
    });

    it('should update reactively when values change', () => {
      const { result } = renderHook(() => useForm(testSchema, initialValues));

      expect(result.current.isValid).toBe(false);

      act(() => {
        result.current.handleChange('name', 'Alice');
      });
      act(() => {
        result.current.handleChange('email', 'alice@example.com');
      });

      expect(result.current.isValid).toBe(true);
    });
  });

  describe('reset', () => {
    it('should reset values to initial state', () => {
      const { result } = renderHook(() => useForm(testSchema, initialValues));

      act(() => {
        result.current.handleChange('name', 'Alice');
        result.current.handleChange('email', 'alice@example.com');
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.values).toEqual(initialValues);
      expect(result.current.errors).toEqual({});
      expect(result.current.touched).toEqual({});
    });
  });

  describe('field-specific error messages', () => {
    it('should show the first error per field on submit', () => {
      const strictSchema = z.object({
        password: z
          .string()
          .min(8, 'Password must be at least 8 characters')
          .max(100, 'Password too long'),
      });

      const { result } = renderHook(() =>
        useForm(strictSchema, { password: '' })
      );

      act(() => {
        result.current.handleSubmit();
      });

      // Should show the min-length error (first error for the field)
      expect(result.current.errors.password).toBe(
        'Password must be at least 8 characters'
      );
    });
  });
});
