import { AxiosError } from 'axios';

export interface CategorizedError {
  category: 'network' | 'timeout' | 'auth' | 'permission' | 'server' | 'validation' | 'unknown';
  userMessage: string;
  retryable: boolean;
  action: 'retry' | 'login' | 'back' | 'contact_support' | 'fix_input';
}

/**
 * Categorizes an Axios error into a user-friendly error object with
 * a category, message, retryable flag, and suggested action.
 *
 * Categories:
 * - network: No response received (connection issue)
 * - timeout: Request timed out (ECONNABORTED)
 * - auth: 401 Unauthorized
 * - permission: 403 Forbidden
 * - validation: 400/422 Bad Request / Unprocessable Entity
 * - server: 500+ Server Error
 * - unknown: Anything else
 */
export function categorizeError(error: AxiosError): CategorizedError {
  // No response — either a network error or a timeout
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return {
        category: 'timeout',
        userMessage: 'Request timed out. Check your connection.',
        retryable: true,
        action: 'retry',
      };
    }
    return {
      category: 'network',
      userMessage: 'No internet connection.',
      retryable: true,
      action: 'retry',
    };
  }

  const status = error.response.status;

  switch (status) {
    case 401:
      return {
        category: 'auth',
        userMessage: 'Session expired. Please log in again.',
        retryable: false,
        action: 'login',
      };
    case 403:
      return {
        category: 'permission',
        userMessage: "You don't have permission for this action.",
        retryable: false,
        action: 'back',
      };
    case 400:
    case 422:
      return {
        category: 'validation',
        userMessage: 'Please check your input.',
        retryable: false,
        action: 'fix_input',
      };
    default:
      if (status >= 500) {
        return {
          category: 'server',
          userMessage: 'Something went wrong. Try again later.',
          retryable: true,
          action: 'contact_support',
        };
      }
      return {
        category: 'unknown',
        userMessage: 'An unexpected error occurred.',
        retryable: false,
        action: 'contact_support',
      };
  }
}
