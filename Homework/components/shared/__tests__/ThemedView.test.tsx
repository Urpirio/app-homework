import { render } from '@testing-library/react-native';
import React from 'react';
import { Text, useColorScheme } from 'react-native';
import { ThemedView } from '../ThemedView';

// Mock the useColorScheme hook
jest.mock('react-native/Libraries/Utilities/useColorScheme');

const mockedUseColorScheme = useColorScheme as jest.MockedFunction<typeof useColorScheme>;

describe('ThemedView Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('Light Theme', () => {
    beforeEach(() => {
      // Set light mode
      mockedUseColorScheme.mockReturnValue('light');
    });

    it('should render children correctly', () => {
      // Validates: Basic rendering functionality
      const { getByText } = render(
        <ThemedView>
          <Text>Test Content</Text>
        </ThemedView>
      );
      
      expect(getByText('Test Content')).toBeTruthy();
    });

    it('should apply default light theme background color', () => {
      // Validates: Requirements 7.1, 7.2 - Theme color adaptation
      const { getByTestId } = render(
        <ThemedView>
          <Text testID="content">Test</Text>
        </ThemedView>
      );
      
      const view = getByTestId('content').parent;
      expect(view?.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ backgroundColor: '#FFFFFF' })
        ])
      );
    });

    it('should apply custom lightColor when provided', () => {
      // Validates: Custom color override functionality
      const customColor = '#F5F5F5';
      const { getByTestId } = render(
        <ThemedView lightColor={customColor}>
          <Text testID="content">Test</Text>
        </ThemedView>
      );
      
      const view = getByTestId('content').parent;
      expect(view?.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ backgroundColor: customColor })
        ])
      );
    });

    it('should merge custom styles with theme styles', () => {
      // Validates: Style composition functionality
      const customStyle = { padding: 20, borderRadius: 8 };
      const { getByTestId } = render(
        <ThemedView style={customStyle}>
          <Text testID="content">Test</Text>
        </ThemedView>
      );
      
      const view = getByTestId('content').parent;
      expect(view?.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ 
            backgroundColor: '#FFFFFF',
            padding: 20,
            borderRadius: 8
          })
        ])
      );
    });
  });

  describe('Dark Theme', () => {
    beforeEach(() => {
      // Set dark mode
      mockedUseColorScheme.mockReturnValue('dark');
    });

    it('should apply default dark theme background color', () => {
      // Validates: Requirements 7.1, 7.2 - Theme color adaptation
      const { getByTestId } = render(
        <ThemedView>
          <Text testID="content">Test</Text>
        </ThemedView>
      );
      
      const view = getByTestId('content').parent;
      expect(view?.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ backgroundColor: '#000000' })
        ])
      );
    });

    it('should apply custom darkColor when provided', () => {
      // Validates: Custom color override functionality
      const customColor = '#1A1A1A';
      const { getByTestId } = render(
        <ThemedView darkColor={customColor}>
          <Text testID="content">Test</Text>
        </ThemedView>
      );
      
      const view = getByTestId('content').parent;
      expect(view?.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ backgroundColor: customColor })
        ])
      );
    });

    it('should ignore lightColor in dark mode', () => {
      // Validates: Correct theme selection logic
      const { getByTestId } = render(
        <ThemedView lightColor="#F5F5F5" darkColor="#1A1A1A">
          <Text testID="content">Test</Text>
        </ThemedView>
      );
      
      const view = getByTestId('content').parent;
      expect(view?.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ backgroundColor: '#1A1A1A' })
        ])
      );
    });
  });

  describe('Theme Switching', () => {
    it('should update colors when theme changes from light to dark', () => {
      // Validates: Requirement 7.3 - Real-time theme updates
      mockedUseColorScheme.mockReturnValue('light');
      
      const { getByTestId, rerender } = render(
        <ThemedView>
          <Text testID="content">Test</Text>
        </ThemedView>
      );
      
      // Verify light theme
      let view = getByTestId('content').parent;
      expect(view?.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ backgroundColor: '#FFFFFF' })
        ])
      );
      
      // Switch to dark theme
      mockedUseColorScheme.mockReturnValue('dark');
      
      rerender(
        <ThemedView>
          <Text testID="content">Test</Text>
        </ThemedView>
      );
      
      // Verify dark theme
      view = getByTestId('content').parent;
      expect(view?.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ backgroundColor: '#000000' })
        ])
      );
    });

    it('should update custom colors when theme changes', () => {
      // Validates: Custom colors respect theme changes
      mockedUseColorScheme.mockReturnValue('light');
      
      const { getByTestId, rerender } = render(
        <ThemedView lightColor="#F5F5F5" darkColor="#1A1A1A">
          <Text testID="content">Test</Text>
        </ThemedView>
      );
      
      // Verify light custom color
      let view = getByTestId('content').parent;
      expect(view?.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ backgroundColor: '#F5F5F5' })
        ])
      );
      
      // Switch to dark theme
      mockedUseColorScheme.mockReturnValue('dark');
      
      rerender(
        <ThemedView lightColor="#F5F5F5" darkColor="#1A1A1A">
          <Text testID="content">Test</Text>
        </ThemedView>
      );
      
      // Verify dark custom color
      view = getByTestId('content').parent;
      expect(view?.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ backgroundColor: '#1A1A1A' })
        ])
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle null colorScheme (defaults to light)', () => {
      // Validates: Graceful handling of null theme
      mockedUseColorScheme.mockReturnValue(null);
      
      const { getByTestId } = render(
        <ThemedView>
          <Text testID="content">Test</Text>
        </ThemedView>
      );
      
      const view = getByTestId('content').parent;
      expect(view?.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ backgroundColor: '#FFFFFF' })
        ])
      );
    });

    it('should handle empty style prop', () => {
      // Validates: Optional style prop handling
      mockedUseColorScheme.mockReturnValue('light');
      
      const { getByTestId } = render(
        <ThemedView style={{}}>
          <Text testID="content">Test</Text>
        </ThemedView>
      );
      
      const view = getByTestId('content').parent;
      expect(view?.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ backgroundColor: '#FFFFFF' })
        ])
      );
    });

    it('should handle multiple children', () => {
      // Validates: Multiple children rendering
      mockedUseColorScheme.mockReturnValue('light');
      
      const { getByText } = render(
        <ThemedView>
          <Text>First Child</Text>
          <Text>Second Child</Text>
          <Text>Third Child</Text>
        </ThemedView>
      );
      
      expect(getByText('First Child')).toBeTruthy();
      expect(getByText('Second Child')).toBeTruthy();
      expect(getByText('Third Child')).toBeTruthy();
    });
  });
});
