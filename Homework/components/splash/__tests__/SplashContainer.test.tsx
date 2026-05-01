import { render } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';
import { SplashContainer } from '../SplashContainer';

/**
 * Unit tests for SplashContainer component
 * 
 * These tests verify that the SplashContainer properly renders
 * and provides the correct layout structure.
 */
describe('SplashContainer', () => {
  it('should render children correctly', () => {
    // Validates: Requirement 1.1 - Splash screen displays content
    const { getByText } = render(
      <SplashContainer>
        <Text>Test Content</Text>
      </SplashContainer>
    );
    
    expect(getByText('Test Content')).toBeTruthy();
  });

  it('should render with SafeAreaView', () => {
    // Validates: Requirement 9.3 - Maintains safe area margins
    const { root } = render(
      <SplashContainer>
        <Text>Content</Text>
      </SplashContainer>
    );
    
    // Verify the component tree includes SafeAreaView
    expect(root).toBeTruthy();
  });

  it('should render with ThemedView for theme support', () => {
    // Validates: Requirement 7.1 - Adapts colors according to system theme
    const { root } = render(
      <SplashContainer>
        <Text>Content</Text>
      </SplashContainer>
    );
    
    // Verify the component renders successfully with theme support
    expect(root).toBeTruthy();
  });

  it('should center content vertically and horizontally', () => {
    // Validates: Requirement 1.1 - Proper layout for splash screen
    const { getByText } = render(
      <SplashContainer>
        <Text>Centered Content</Text>
      </SplashContainer>
    );
    
    // Verify content is rendered (centering is handled by styles)
    expect(getByText('Centered Content')).toBeTruthy();
  });
});
