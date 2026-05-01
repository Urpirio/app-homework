import { render } from '@testing-library/react-native';
import React from 'react';
import { useColorScheme } from 'react-native';
import { LoadingIndicator } from '../LoadingIndicator';

// Mock the useColorScheme hook
jest.mock('react-native/Libraries/Utilities/useColorScheme');

const mockedUseColorScheme = useColorScheme as jest.MockedFunction<typeof useColorScheme>;

/**
 * Unit tests for LoadingIndicator component
 * 
 * **Validates: Requirements 10.1, 10.4**
 */
describe('LoadingIndicator', () => {
  beforeEach(() => {
    // Set light mode by default
    mockedUseColorScheme.mockReturnValue('light');
    jest.clearAllMocks();
  });

  it('should render with default props', () => {
    const { getByTestId } = render(<LoadingIndicator />);
    const indicator = getByTestId('loading-indicator');
    expect(indicator).toBeTruthy();
  });

  it('should render with small size by default', () => {
    const { getByTestId } = render(<LoadingIndicator />);
    const indicator = getByTestId('loading-indicator');
    expect(indicator.props.size).toBe('small');
  });

  it('should render with large size when specified', () => {
    const { getByTestId } = render(<LoadingIndicator size="large" />);
    const indicator = getByTestId('loading-indicator');
    expect(indicator.props.size).toBe('large');
  });

  it('should use custom color when provided', () => {
    const customColor = '#FF0000';
    const { getByTestId } = render(<LoadingIndicator color={customColor} />);
    const indicator = getByTestId('loading-indicator');
    expect(indicator.props.color).toBe(customColor);
  });

  it('should use light theme primary color when no custom color is provided', () => {
    // Validates: Requirement 10.4 - Adapts color according to theme
    mockedUseColorScheme.mockReturnValue('light');
    
    const { getByTestId } = render(<LoadingIndicator />);
    const indicator = getByTestId('loading-indicator');
    
    // Light theme primary color
    expect(indicator.props.color).toBe('#007AFF');
  });

  it('should use dark theme primary color in dark mode', () => {
    // Validates: Requirement 10.4 - Adapts color according to theme
    mockedUseColorScheme.mockReturnValue('dark');
    
    const { getByTestId } = render(<LoadingIndicator />);
    const indicator = getByTestId('loading-indicator');
    
    // Dark theme primary color
    expect(indicator.props.color).toBe('#0A84FF');
  });

  it('should render ActivityIndicator component', () => {
    // Validates: Requirement 10.1, 10.4 - Shows animated spinner
    const { getByTestId } = render(<LoadingIndicator />);
    const indicator = getByTestId('loading-indicator');
    
    expect(indicator).toBeTruthy();
    expect(indicator.type).toBe('ActivityIndicator');
  });
});
