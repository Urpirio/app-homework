/**
 * Tests for GlobalErrorBoundary component
 *
 * Validates: Requirements 9.3, 9.4
 */

import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import { GlobalErrorBoundary } from '../GlobalErrorBoundary';

// Suppress console.error output from the error boundary during tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});
afterAll(() => {
  console.error = originalConsoleError;
});

function ThrowingChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test crash');
  }
  return <Text>Child content</Text>;
}

describe('GlobalErrorBoundary', () => {
  it('should render children when no error occurs', () => {
    const { getByText } = render(
      <GlobalErrorBoundary>
        <ThrowingChild shouldThrow={false} />
      </GlobalErrorBoundary>,
    );
    expect(getByText('Child content')).toBeTruthy();
  });

  it('should render fallback UI when a child throws', () => {
    const { getByText } = render(
      <GlobalErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </GlobalErrorBoundary>,
    );
    expect(getByText('Something went wrong')).toBeTruthy();
    expect(getByText('An unexpected error occurred. Please reload the app.')).toBeTruthy();
    expect(getByText('Reload')).toBeTruthy();
  });

  it('should call onReset when Reload is pressed', () => {
    const onReset = jest.fn();

    const { getByText } = render(
      <GlobalErrorBoundary onReset={onReset}>
        <ThrowingChild shouldThrow={true} />
      </GlobalErrorBoundary>,
    );

    expect(getByText('Something went wrong')).toBeTruthy();
    fireEvent.press(getByText('Reload'));
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
