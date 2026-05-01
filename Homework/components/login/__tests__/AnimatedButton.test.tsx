import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { useColorScheme } from 'react-native';
import { AnimatedButton } from '../AnimatedButton';

// Mock the useColorScheme hook
jest.mock('react-native/Libraries/Utilities/useColorScheme');

const mockedUseColorScheme = useColorScheme as jest.MockedFunction<typeof useColorScheme>;

// Mock the haptics module
jest.mock('@/utils/haptics', () => ({
  triggerHapticFeedback: jest.fn(),
}));

/**
 * Unit tests for AnimatedButton component
 * 
 * **Validates: Requirements 3.3, 3.4, 5.1, 5.2, 5.3, 5.4, 5.5, 8.2, 10.2, 10.4**
 */
describe('AnimatedButton', () => {
  const defaultProps = {
    onPress: jest.fn(),
    title: 'Iniciar Sesión',
    accessibilityLabel: 'Botón de inicio de sesión',
    accessibilityHint: 'Toca para iniciar sesión',
  };

  beforeEach(() => {
    // Set light mode by default
    mockedUseColorScheme.mockReturnValue('light');
    jest.clearAllMocks();
  });

  it('should render button with title', () => {
    // Validates: Requirement 3.3 - Shows login button
    const { getByText } = render(<AnimatedButton {...defaultProps} />);
    expect(getByText('Iniciar Sesión')).toBeTruthy();
  });

  it('should call onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <AnimatedButton {...defaultProps} onPress={onPress} />
    );
    
    const button = getByRole('button');
    fireEvent.press(button);
    
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('should show loading indicator when isLoading is true', () => {
    // Validates: Requirement 10.4 - Shows animated spinner inside button during loading
    const { getByTestId, queryByText } = render(
      <AnimatedButton {...defaultProps} isLoading={true} />
    );
    
    // Loading indicator should be visible
    expect(getByTestId('loading-indicator')).toBeTruthy();
    
    // Button text should not be visible
    expect(queryByText('Iniciar Sesión')).toBeNull();
  });

  it('should be disabled when isLoading is true', () => {
    // Validates: Requirement 10.2 - Disables button while loading indicator is visible
    const onPress = jest.fn();
    const { getByRole } = render(
      <AnimatedButton {...defaultProps} onPress={onPress} isLoading={true} />
    );
    
    const button = getByRole('button');
    
    // Button should be disabled
    expect(button.props.accessibilityState.disabled).toBe(true);
    expect(button.props.accessibilityState.busy).toBe(true);
    
    // Press should not trigger onPress
    fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('should be disabled when disabled prop is true', () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <AnimatedButton {...defaultProps} onPress={onPress} disabled={true} />
    );
    
    const button = getByRole('button');
    
    // Button should be disabled
    expect(button.props.accessibilityState.disabled).toBe(true);
    
    // Press should not trigger onPress
    fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('should have proper accessibility attributes', () => {
    // Validates: Requirement 8.2 - Provides accessibility label for login button
    const { getByRole } = render(<AnimatedButton {...defaultProps} />);
    
    const button = getByRole('button');
    expect(button.props.accessibilityLabel).toBe('Botón de inicio de sesión');
    expect(button.props.accessibilityHint).toBe('Toca para iniciar sesión');
    expect(button.props.accessibilityRole).toBe('button');
  });

  it('should trigger haptic feedback on press', async () => {
    // Validates: Requirement 5.5 - Provides haptic feedback when user touches button
    const { triggerHapticFeedback } = require('@/utils/haptics');
    const { getByRole } = render(<AnimatedButton {...defaultProps} />);
    
    const button = getByRole('button');
    fireEvent(button, 'pressIn');
    
    await waitFor(() => {
      expect(triggerHapticFeedback).toHaveBeenCalled();
    });
  });

  it('should render with custom delay', () => {
    // Validates: Requirement 4.2 - Animates elements in sequence with delay
    const { getByText } = render(
      <AnimatedButton {...defaultProps} delay={200} />
    );
    
    // Component should render regardless of delay
    expect(getByText('Iniciar Sesión')).toBeTruthy();
  });

  it('should show button text when not loading', () => {
    const { getByText, queryByTestId } = render(
      <AnimatedButton {...defaultProps} isLoading={false} />
    );
    
    // Button text should be visible
    expect(getByText('Iniciar Sesión')).toBeTruthy();
    
    // Loading indicator should not be visible
    expect(queryByTestId('loading-indicator')).toBeNull();
  });

  it('should apply theme colors', () => {
    // Validates: Requirement 3.4 - Applies modern styles with theme colors
    mockedUseColorScheme.mockReturnValue('light');
    
    const { getByRole } = render(<AnimatedButton {...defaultProps} />);
    const button = getByRole('button');
    
    // Should use primary color from light theme
    expect(button.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          backgroundColor: '#007AFF', // Light theme primary color
        }),
      ])
    );
  });

  it('should apply dark theme colors in dark mode', () => {
    // Validates: Requirement 3.4 - Applies modern styles with theme colors
    mockedUseColorScheme.mockReturnValue('dark');
    
    const { getByRole } = render(<AnimatedButton {...defaultProps} />);
    const button = getByRole('button');
    
    // Should use primary color from dark theme
    expect(button.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          backgroundColor: '#0A84FF', // Dark theme primary color
        }),
      ])
    );
  });

  it('should reduce opacity when disabled', () => {
    const { getByRole } = render(
      <AnimatedButton {...defaultProps} disabled={true} />
    );
    
    const button = getByRole('button');
    
    // Should have reduced opacity
    expect(button.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          opacity: 0.5,
        }),
      ])
    );
  });

  it('should reduce opacity when loading', () => {
    const { getByRole } = render(
      <AnimatedButton {...defaultProps} isLoading={true} />
    );
    
    const button = getByRole('button');
    
    // Should have reduced opacity
    expect(button.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          opacity: 0.5,
        }),
      ])
    );
  });
});
