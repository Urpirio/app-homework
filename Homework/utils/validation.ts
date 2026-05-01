/**
 * Validation utility functions for form inputs
 */

/**
 * Validates an email address format
 * 
 * @param email - The email string to validate
 * @returns Error message if invalid, undefined if valid
 * 
 * @example
 * ```typescript
 * const error = validateEmail('user@example.com');
 * if (error) {
 *   console.log(error); // undefined - valid email
 * }
 * 
 * const error2 = validateEmail('invalid');
 * if (error2) {
 *   console.log(error2); // "Ingresa un correo electrónico válido"
 * }
 * ```
 */
export function validateEmail(email: string): string | undefined {
  // Check if empty
  if (!email || email.trim().length === 0) {
    return 'El correo electrónico es requerido';
  }

  // Basic email regex pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  // Check if it matches email format
  if (emailRegex.test(email.trim())) {
    return undefined; // Valid email
  }

  // Check if it could be a username (min 3 characters, alphanumeric + underscore)
  const usernameRegex = /^[a-zA-Z0-9_]{3,}$/;
  if (usernameRegex.test(email.trim())) {
    return undefined; // Valid username
  }

  return 'Ingresa un correo electrónico válido';
}

/**
 * Validates a password
 * 
 * @param password - The password string to validate
 * @returns Error message if invalid, undefined if valid
 * 
 * @example
 * ```typescript
 * const error = validatePassword('mypassword123');
 * if (error) {
 *   console.log(error); // undefined - valid password
 * }
 * 
 * const error2 = validatePassword('123');
 * if (error2) {
 *   console.log(error2); // "La contraseña debe tener al menos 6 caracteres"
 * }
 * ```
 */
export function validatePassword(password: string): string | undefined {
  // Check if empty
  if (!password || password.length === 0) {
    return 'La contraseña es requerida';
  }

  // Check minimum length
  if (password.length < 6) {
    return 'La contraseña debe tener al menos 6 caracteres';
  }

  return undefined; // Valid password
}

/**
 * Validates all login form fields
 * 
 * @param email - The email/username to validate
 * @param password - The password to validate
 * @returns Object with error messages for each field, or empty object if all valid
 * 
 * @example
 * ```typescript
 * const errors = validateLoginForm('user@example.com', 'password123');
 * if (Object.keys(errors).length === 0) {
 *   // Form is valid
 * }
 * ```
 */
export function validateLoginForm(
  email: string,
  password: string
): { email?: string; password?: string } {
  const errors: { email?: string; password?: string } = {};

  const emailError = validateEmail(email);
  if (emailError) {
    errors.email = emailError;
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    errors.password = passwordError;
  }

  return errors;
}
