/**
 * Authentication Type Definitions
 * 
 * This file contains TypeScript type definitions for authentication-related
 * data structures used in the login form.
 * 
 * Validates Requirements: 3.1, 3.2, 6.1, 6.2, 10.1
 */

/**
 * LoginCredentials
 * 
 * Model for authentication credentials.
 * 
 * @property email - Email address or username for authentication
 * @property password - Password in plain text (will be transmitted securely)
 * 
 * Validations:
 * - email: Non-empty, valid email format or valid username (min 3 characters)
 * - password: Non-empty, minimum 6 characters
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  SCHOOL_ADMIN = 'SCHOOL_ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  SUPPORT = 'SUPPORT'
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  identityCode?: string;
  institutionId?: string;
  isVerified: boolean;
}

/**
 * FormState
 * 
 * State management interface for the login form.
 * Tracks form values, validation errors, loading state, and password visibility.
 * 
 * @property email - Current value of the email input field
 * @property password - Current value of the password input field
 * @property errors - Object containing validation error messages for each field
 * @property isLoading - Indicates if authentication is in progress
 * @property showPassword - Controls password field visibility toggle
 * 
 * Possible States:
 * - Initial: Empty fields, no errors, not loading
 * - Editing: User typing, errors may be present
 * - Validating: After submit, before sending
 * - Loading: Sending credentials, fields disabled
 * - Error: Validation failed, errors visible
 * - Success: Authentication successful (transition to next screen)
 */
export interface FormState {
  email: string;
  password: string;
  errors: {
    email?: string;
    password?: string;
  };
  isLoading: boolean;
  showPassword: boolean;
}
