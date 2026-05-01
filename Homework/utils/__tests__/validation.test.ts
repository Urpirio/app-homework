import { validateEmail, validateLoginForm, validatePassword } from '../validation';

describe('validateEmail', () => {
  it('should return undefined for valid email addresses', () => {
    expect(validateEmail('user@example.com')).toBeUndefined();
    expect(validateEmail('test.user@domain.co.uk')).toBeUndefined();
    expect(validateEmail('name+tag@example.org')).toBeUndefined();
  });

  it('should return undefined for valid usernames', () => {
    expect(validateEmail('username')).toBeUndefined();
    expect(validateEmail('user_name')).toBeUndefined();
    expect(validateEmail('user123')).toBeUndefined();
  });

  it('should return error for empty email', () => {
    expect(validateEmail('')).toBe('El correo electrónico es requerido');
    expect(validateEmail('   ')).toBe('El correo electrónico es requerido');
  });

  it('should return error for invalid email format', () => {
    expect(validateEmail('invalid')).toBe('Ingresa un correo electrónico válido');
    expect(validateEmail('no@domain')).toBe('Ingresa un correo electrónico válido');
    expect(validateEmail('@example.com')).toBe('Ingresa un correo electrónico válido');
    expect(validateEmail('user@')).toBe('Ingresa un correo electrónico válido');
  });

  it('should return error for username that is too short', () => {
    expect(validateEmail('ab')).toBe('Ingresa un correo electrónico válido');
  });
});

describe('validatePassword', () => {
  it('should return undefined for valid passwords', () => {
    expect(validatePassword('password123')).toBeUndefined();
    expect(validatePassword('123456')).toBeUndefined();
    expect(validatePassword('!@#$%^&*()')).toBeUndefined();
  });

  it('should return error for empty password', () => {
    expect(validatePassword('')).toBe('La contraseña es requerida');
  });

  it('should return error for password shorter than 6 characters', () => {
    expect(validatePassword('12345')).toBe('La contraseña debe tener al menos 6 caracteres');
    expect(validatePassword('abc')).toBe('La contraseña debe tener al menos 6 caracteres');
  });
});

describe('validateLoginForm', () => {
  it('should return empty object for valid credentials', () => {
    const errors = validateLoginForm('user@example.com', 'password123');
    expect(Object.keys(errors).length).toBe(0);
  });

  it('should return email error when email is invalid', () => {
    const errors = validateLoginForm('', 'password123');
    expect(errors.email).toBe('El correo electrónico es requerido');
    expect(errors.password).toBeUndefined();
  });

  it('should return password error when password is invalid', () => {
    const errors = validateLoginForm('user@example.com', '123');
    expect(errors.email).toBeUndefined();
    expect(errors.password).toBe('La contraseña debe tener al menos 6 caracteres');
  });

  it('should return both errors when both fields are invalid', () => {
    const errors = validateLoginForm('', '123');
    expect(errors.email).toBe('El correo electrónico es requerido');
    expect(errors.password).toBe('La contraseña debe tener al menos 6 caracteres');
  });
});
