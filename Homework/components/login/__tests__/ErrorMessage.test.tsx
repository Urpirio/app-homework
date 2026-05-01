import { render } from '@testing-library/react-native';
import React from 'react';
import { useColorScheme } from 'react-native';
import { ErrorMessage } from '../ErrorMessage';

// Mock the useColorScheme hook
jest.mock('react-native/Libraries/Utilities/useColorScheme');

const mockedUseColorScheme = useColorScheme as jest.MockedFunction<typeof useColorScheme>;

describe('ErrorMessage', () => {
  beforeEach(() => {
    // Set light mode by default
    mockedUseColorScheme.mockReturnValue('light');
    jest.clearAllMocks();
  });
  
  it('should not render when message is undefined', () => {
    const { queryByText } = render(
      <ErrorMessage message={undefined} visible={false} />
    );
    
    expect(queryByText(/./)).toBeNull();
  });
  
  it('should not render when message is empty', () => {
    const { queryByText } = render(
      <ErrorMessage message="" visible={false} />
    );
    
    expect(queryByText(/./)).toBeNull();
  });
  
  it('should render error message when visible is true', () => {
    const errorMessage = 'El correo electrónico es requerido';
    const { getByText } = render(
      <ErrorMessage message={errorMessage} visible={true} />
    );
    
    expect(getByText(errorMessage)).toBeTruthy();
  });
  
  it('should have accessibility properties for screen readers', () => {
    // Validates: Requirement 8.4 - Announces errors to screen readers
    const errorMessage = 'La contraseña es requerida';
    const { getByText } = render(
      <ErrorMessage message={errorMessage} visible={true} />
    );
    
    const errorElement = getByText(errorMessage).parent;
    expect(errorElement?.props.accessibilityLiveRegion).toBe('polite');
    expect(errorElement?.props.accessibilityRole).toBe('alert');
  });
  
  it('should display different error messages', () => {
    const { getByText, rerender } = render(
      <ErrorMessage message="Error 1" visible={true} />
    );
    
    expect(getByText('Error 1')).toBeTruthy();
    
    rerender(<ErrorMessage message="Error 2" visible={true} />);
    
    expect(getByText('Error 2')).toBeTruthy();
  });
  
  it('should use error color from light theme', () => {
    // Validates: Requirements 6.2, 7.1 - Error styling with theme colors
    mockedUseColorScheme.mockReturnValue('light');
    
    const { getByText } = render(
      <ErrorMessage message="Test error" visible={true} />
    );
    
    const errorText = getByText('Test error');
    expect(errorText.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ color: '#FF3B30' }) // Light theme error color
      ])
    );
  });
  
  it('should use error color from dark theme', () => {
    // Validates: Requirements 6.2, 7.2 - Error styling with theme colors
    mockedUseColorScheme.mockReturnValue('dark');
    
    const { getByText } = render(
      <ErrorMessage message="Test error" visible={true} />
    );
    
    const errorText = getByText('Test error');
    expect(errorText.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ color: '#FF453A' }) // Dark theme error color
      ])
    );
  });
});
