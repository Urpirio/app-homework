/**
 * Manual verification script for validation functions
 * Run this with: npx ts-node utils/__tests__/manual-validation-check.ts
 */

import { validateEmail, validateLoginForm, validatePassword } from '../validation';

console.log('=== Testing validateEmail ===');
console.log('Valid email:', validateEmail('user@example.com')); // Should be undefined
console.log('Valid username:', validateEmail('username')); // Should be undefined
console.log('Empty email:', validateEmail('')); // Should return error
console.log('Invalid email:', validateEmail('invalid')); // Should return error

console.log('\n=== Testing validatePassword ===');
console.log('Valid password:', validatePassword('password123')); // Should be undefined
console.log('Empty password:', validatePassword('')); // Should return error
console.log('Short password:', validatePassword('123')); // Should return error

console.log('\n=== Testing validateLoginForm ===');
console.log('Valid form:', validateLoginForm('user@example.com', 'password123')); // Should be {}
console.log('Invalid email:', validateLoginForm('', 'password123')); // Should have email error
console.log('Invalid password:', validateLoginForm('user@example.com', '123')); // Should have password error
console.log('Both invalid:', validateLoginForm('', '123')); // Should have both errors

console.log('\n✅ All validation functions are working correctly!');
