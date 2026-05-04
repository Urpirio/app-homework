/**
 * Tests for ErrorState component
 *
 * Validates: Requirements 4.7, 9.3, 9.4
 */

import { fireEvent, render } from '@testing-library/react-native';
import { AxiosError, AxiosHeaders } from 'axios';
import React from 'react';
import { useColorScheme } from 'react-native';

import type { CategorizedError } from '../../../utils/errorHandler';
import { ErrorState } from '../ErrorState';

jest.mock('react-native/Libraries/Utilities/useColorScheme');

const mockedUseColorScheme = useColorScheme as jest.MockedFunction<typeof useColorScheme>;

describe('ErrorState', () => {
  beforeEach(() => {
    mockedUseColorScheme.mockReturnValue('dark');
  });

  describe('with CategorizedError', () => {
    it('should display the user message', () => {
      const error: CategorizedError = {
        category: 'network',
        userMessage: 'No internet connection.',
        retryable: true,
        action: 'retry',
      };
      const { getByText } = render(<ErrorState error={error} onRetry={jest.fn()} />);
      expect(getByText('No internet connection.')).toBeTruthy();
    });

    it('should show Retry button for retry action', () => {
      const error: CategorizedError = {
        category: 'network',
        userMessage: 'No internet connection.',
        retryable: true,
        action: 'retry',
      };
      const onRetry = jest.fn();
      const { getByText } = render(<ErrorState error={error} onRetry={onRetry} />);
      fireEvent.press(getByText('Retry'));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should show Log In button for auth action', () => {
      const error: CategorizedError = {
        category: 'auth',
        userMessage: 'Session expired. Please log in again.',
        retryable: false,
        action: 'login',
      };
      const onLogin = jest.fn();
      const { getByText } = render(<ErrorState error={error} onLogin={onLogin} />);
      fireEvent.press(getByText('Log In'));
      expect(onLogin).toHaveBeenCalledTimes(1);
    });

    it('should show Go Back button for back action', () => {
      const error: CategorizedError = {
        category: 'permission',
        userMessage: "You don't have permission for this action.",
        retryable: false,
        action: 'back',
      };
      const onBack = jest.fn();
      const { getByText } = render(<ErrorState error={error} onBack={onBack} />);
      fireEvent.press(getByText('Go Back'));
      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('should show Contact Support button for contact_support action', () => {
      const error: CategorizedError = {
        category: 'server',
        userMessage: 'Something went wrong. Try again later.',
        retryable: true,
        action: 'contact_support',
      };
      const onRetry = jest.fn();
      const { getByText } = render(<ErrorState error={error} onRetry={onRetry} />);
      fireEvent.press(getByText('Contact Support'));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should not show action button when no matching callback is provided', () => {
      const error: CategorizedError = {
        category: 'auth',
        userMessage: 'Session expired.',
        retryable: false,
        action: 'login',
      };
      // No onLogin provided
      const { queryByText } = render(<ErrorState error={error} />);
      expect(queryByText('Log In')).toBeNull();
    });
  });

  describe('with AxiosError', () => {
    it('should categorize a 401 AxiosError as auth', () => {
      const axiosError = new AxiosError('Unauthorized', '401', undefined, undefined, {
        status: 401,
        statusText: 'Unauthorized',
        data: {},
        headers: {},
        config: { headers: new AxiosHeaders() },
      });
      const { getByText } = render(<ErrorState error={axiosError} onLogin={jest.fn()} />);
      expect(getByText('Session expired. Please log in again.')).toBeTruthy();
      expect(getByText('Log In')).toBeTruthy();
    });

    it('should categorize a 500 AxiosError as server', () => {
      const axiosError = new AxiosError('Server Error', '500', undefined, undefined, {
        status: 500,
        statusText: 'Internal Server Error',
        data: {},
        headers: {},
        config: { headers: new AxiosHeaders() },
      });
      const { getByText } = render(<ErrorState error={axiosError} onRetry={jest.fn()} />);
      expect(getByText('Something went wrong. Try again later.')).toBeTruthy();
    });
  });

  describe('with generic Error', () => {
    it('should display the error message for a plain Error', () => {
      const error = new Error('Something broke');
      const { getByText } = render(<ErrorState error={error} />);
      expect(getByText('Something broke')).toBeTruthy();
    });
  });

  it('should render with light theme', () => {
    mockedUseColorScheme.mockReturnValue('light');
    const error: CategorizedError = {
      category: 'network',
      userMessage: 'No internet connection.',
      retryable: true,
      action: 'retry',
    };
    const { getByText } = render(<ErrorState error={error} onRetry={jest.fn()} />);
    expect(getByText('No internet connection.')).toBeTruthy();
  });
});
