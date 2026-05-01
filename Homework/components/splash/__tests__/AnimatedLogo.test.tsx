import { render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { AnimatedLogo } from '../AnimatedLogo';

/**
 * Unit tests for AnimatedLogo component
 * 
 * These tests verify that the AnimatedLogo properly renders
 * and executes its animation sequence.
 */
describe('AnimatedLogo', () => {
  it('should render the logo', () => {
    // Validates: Requirement 1.1 - Splash screen displays the logo
    const mockCallback = jest.fn();
    const { getByTestId } = render(
      <AnimatedLogo onAnimationComplete={mockCallback} />
    );
    
    expect(getByTestId('animated-logo')).toBeTruthy();
  });

  it('should render with custom size', () => {
    // Validates: Requirement 9.1 - Logo adapts to screen dimensions
    const mockCallback = jest.fn();
    const customSize = 150;
    const { getByTestId } = render(
      <AnimatedLogo onAnimationComplete={mockCallback} size={customSize} />
    );
    
    const logo = getByTestId('animated-logo');
    expect(logo).toBeTruthy();
    expect(logo.props.style).toMatchObject(
      expect.objectContaining({
        width: customSize,
        height: customSize,
      })
    );
  });

  it('should call onAnimationComplete after animations finish', async () => {
    // Validates: Requirements 1.2, 1.4 - Executes entry and exit animations
    const mockCallback = jest.fn();
    render(<AnimatedLogo onAnimationComplete={mockCallback} />);
    
    // Wait for both animations to complete (1500ms entry + 800ms exit = 2300ms)
    // Add buffer for animation processing
    await waitFor(
      () => {
        expect(mockCallback).toHaveBeenCalledTimes(1);
      },
      { timeout: 3000 }
    );
  });

  it('should render with default size when size prop is not provided', () => {
    // Validates: Component has sensible defaults
    const mockCallback = jest.fn();
    const { getByTestId } = render(
      <AnimatedLogo onAnimationComplete={mockCallback} />
    );
    
    const logo = getByTestId('animated-logo');
    expect(logo).toBeTruthy();
    expect(logo.props.style).toMatchObject(
      expect.objectContaining({
        width: 120,
        height: 120,
      })
    );
  });

  it('should apply theme colors to the logo', () => {
    // Validates: Requirement 7.1 - Adapts colors according to system theme
    const mockCallback = jest.fn();
    const { getByTestId } = render(
      <AnimatedLogo onAnimationComplete={mockCallback} />
    );
    
    const logo = getByTestId('animated-logo');
    expect(logo).toBeTruthy();
    // The logo should have a backgroundColor from the theme
    expect(logo.props.style).toMatchObject(
      expect.objectContaining({
        backgroundColor: expect.any(String),
      })
    );
  });
});
