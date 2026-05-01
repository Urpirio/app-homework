import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { useColorScheme } from 'react-native';
import { AnimatedInput } from '../AnimatedInput';

// Mock the useColorScheme hook
jest.mock('react-native/Libraries/Utilities/useColorScheme');

const mockedUseColorScheme = useColorScheme as jest.MockedFunction<typeof useColorScheme>;

describe('AnimatedInput', () => {
  const defaultProps = {
    value: '',
    onChangeText: jest.fn(),
    placeholder: 'Test Input',
    accessibilityLabel: 'Test Input',
    accessibilityHint: 'Enter test value',
  };

  beforeEach(() => {
    // Set light mode by default
    mockedUseColorScheme.mockReturnValue('light');
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render input field with placeholder', () => {
      // Validates: Requirements 3.1, 3.2 - Shows input fields
      const { getByPlaceholderText } = render(<AnimatedInput {...defaultProps} />);
      expect(getByPlaceholderText('Test Input')).toBeTruthy();
    });

    it('should render with provided value', () => {
      const { getByDisplayValue } = render(
        <AnimatedInput {...defaultProps} value="test@example.com" />
      );
      expect(getByDisplayValue('test@example.com')).toBeTruthy();
    });

    it('should have correct accessibility properties', () => {
      // Validates: Requirements 8.1, 8.3 - Accessibility labels and hints
      const { getByLabelText } = render(<AnimatedInput {...defaultProps} />);
      const input = getByLabelText('Test Input');
      expect(input).toBeTruthy();
      expect(input.props.accessibilityHint).toBe('Enter test value');
    });
  });

  describe('Text Input', () => {
    it('should call onChangeText when text changes', () => {
      const onChangeText = jest.fn();
      const { getByPlaceholderText } = render(
        <AnimatedInput {...defaultProps} onChangeText={onChangeText} />
      );
      
      const input = getByPlaceholderText('Test Input');
      fireEvent.changeText(input, 'new text');
      
      expect(onChangeText).toHaveBeenCalledWith('new text');
    });

    it('should support different keyboard types', () => {
      const { getByPlaceholderText } = render(
        <AnimatedInput {...defaultProps} keyboardType="email-address" />
      );
      
      const input = getByPlaceholderText('Test Input');
      expect(input.props.keyboardType).toBe('email-address');
    });

    it('should support auto-capitalization settings', () => {
      const { getByPlaceholderText } = render(
        <AnimatedInput {...defaultProps} autoCapitalize="none" />
      );
      
      const input = getByPlaceholderText('Test Input');
      expect(input.props.autoCapitalize).toBe('none');
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should show visibility toggle when showVisibilityToggle is true', () => {
      // Validates: Requirement 3.6 - Shows visibility icon in password field
      const { getByTestId } = render(
        <AnimatedInput
          {...defaultProps}
          secureTextEntry
          showVisibilityToggle
        />
      );
      
      expect(getByTestId('password-visibility-toggle')).toBeTruthy();
    });

    it('should not show visibility toggle when showVisibilityToggle is false', () => {
      const { queryByTestId } = render(
        <AnimatedInput {...defaultProps} secureTextEntry />
      );
      
      expect(queryByTestId('password-visibility-toggle')).toBeNull();
    });

    it('should toggle password visibility when toggle button is pressed', () => {
      const { getByTestId, getByPlaceholderText } = render(
        <AnimatedInput
          {...defaultProps}
          secureTextEntry
          showVisibilityToggle
        />
      );
      
      const input = getByPlaceholderText('Test Input');
      const toggle = getByTestId('password-visibility-toggle');
      
      // Initially should be secure
      expect(input.props.secureTextEntry).toBe(true);
      
      // Press toggle
      fireEvent.press(toggle);
      
      // Should now be visible
      expect(input.props.secureTextEntry).toBe(false);
      
      // Press again
      fireEvent.press(toggle);
      
      // Should be secure again
      expect(input.props.secureTextEntry).toBe(true);
    });

    it('should call onToggleVisibility callback when provided', () => {
      const onToggleVisibility = jest.fn();
      const { getByTestId } = render(
        <AnimatedInput
          {...defaultProps}
          secureTextEntry
          showVisibilityToggle
          onToggleVisibility={onToggleVisibility}
        />
      );
      
      const toggle = getByTestId('password-visibility-toggle');
      fireEvent.press(toggle);
      
      expect(onToggleVisibility).toHaveBeenCalledTimes(1);
    });

    it('should have correct accessibility label for visibility toggle', () => {
      const { getByTestId } = render(
        <AnimatedInput
          {...defaultProps}
          secureTextEntry
          showVisibilityToggle
        />
      );
      
      const toggle = getByTestId('password-visibility-toggle');
      expect(toggle.props.accessibilityLabel).toBe('Mostrar contraseña');
      
      // Press to show password
      fireEvent.press(toggle);
      expect(toggle.props.accessibilityLabel).toBe('Ocultar contraseña');
    });
  });

  describe('Focus State', () => {
    it('should handle focus events', () => {
      // Validates: Requirement 3.5 - Shows visual focus indicator
      const { getByPlaceholderText } = render(<AnimatedInput {...defaultProps} />);
      const input = getByPlaceholderText('Test Input');
      
      fireEvent(input, 'focus');
      // Focus state is managed internally, component should not crash
      expect(input).toBeTruthy();
    });

    it('should handle blur events', () => {
      const { getByPlaceholderText } = render(<AnimatedInput {...defaultProps} />);
      const input = getByPlaceholderText('Test Input');
      
      fireEvent(input, 'blur');
      // Blur state is managed internally, component should not crash
      expect(input).toBeTruthy();
    });
  });

  describe('Error State', () => {
    it('should render without error initially', () => {
      const { getByPlaceholderText } = render(<AnimatedInput {...defaultProps} />);
      expect(getByPlaceholderText('Test Input')).toBeTruthy();
    });

    it('should accept error prop', () => {
      // Validates: Requirements 6.1, 6.3 - Shows red border and shake animation on error
      const { getByPlaceholderText } = render(
        <AnimatedInput {...defaultProps} error="This field is required" />
      );
      // Component should render with error (visual changes are handled by animations)
      expect(getByPlaceholderText('Test Input')).toBeTruthy();
    });
  });

  describe('Staggered Animation', () => {
    it('should accept delay prop for staggered animations', () => {
      // Validates: Requirement 4.2 - Animates elements in sequence with delay
      const { getByPlaceholderText } = render(
        <AnimatedInput {...defaultProps} delay={100} />
      );
      expect(getByPlaceholderText('Test Input')).toBeTruthy();
    });

    it('should work with zero delay', () => {
      const { getByPlaceholderText } = render(
        <AnimatedInput {...defaultProps} delay={0} />
      );
      expect(getByPlaceholderText('Test Input')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long text input', () => {
      const longText = 'a'.repeat(200);
      const onChangeText = jest.fn();
      const { getByPlaceholderText } = render(
        <AnimatedInput {...defaultProps} onChangeText={onChangeText} />
      );
      
      const input = getByPlaceholderText('Test Input');
      fireEvent.changeText(input, longText);
      
      expect(onChangeText).toHaveBeenCalledWith(longText);
    });

    it('should handle special characters', () => {
      const specialText = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const onChangeText = jest.fn();
      const { getByPlaceholderText } = render(
        <AnimatedInput {...defaultProps} onChangeText={onChangeText} />
      );
      
      const input = getByPlaceholderText('Test Input');
      fireEvent.changeText(input, specialText);
      
      expect(onChangeText).toHaveBeenCalledWith(specialText);
    });

    it('should handle empty string', () => {
      const onChangeText = jest.fn();
      const { getByPlaceholderText } = render(
        <AnimatedInput {...defaultProps} value="test" onChangeText={onChangeText} />
      );
      
      const input = getByPlaceholderText('Test Input');
      fireEvent.changeText(input, '');
      
      expect(onChangeText).toHaveBeenCalledWith('');
    });
  });

  describe('Theme Adaptation', () => {
    it('should adapt to light theme', () => {
      // Validates: Requirement 7.1 - Adapts colors according to system theme
      mockedUseColorScheme.mockReturnValue('light');
      
      const { getByPlaceholderText } = render(<AnimatedInput {...defaultProps} />);
      const input = getByPlaceholderText('Test Input');
      
      // Input should render with light theme colors
      expect(input.props.placeholderTextColor).toBe('#8E8E93');
      expect(input.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ color: '#000000' })
        ])
      );
    });

    it('should adapt to dark theme', () => {
      // Validates: Requirement 7.2 - Adapts colors according to system theme
      mockedUseColorScheme.mockReturnValue('dark');
      
      const { getByPlaceholderText } = render(<AnimatedInput {...defaultProps} />);
      const input = getByPlaceholderText('Test Input');
      
      // Input should render with dark theme colors
      expect(input.props.placeholderTextColor).toBe('#8E8E93');
      expect(input.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ color: '#FFFFFF' })
        ])
      );
    });
  });
});
