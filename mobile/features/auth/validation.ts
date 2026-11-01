import type { FormErrors } from '@/hooks/useForm';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const PASSWORD_MIN_LENGTH = 8;

export function validateEmail(email: string): string | undefined {
  const value = email.trim();
  if (!value) return 'Enter your email address.';
  if (!EMAIL_PATTERN.test(value)) return 'Enter a valid email, like name@example.com.';
  return undefined;
}

export function validateName(name: string): string | undefined {
  const value = name.trim();
  if (!value) return 'Enter your name.';
  if (value.length < 2) return 'Your name should be at least 2 characters.';
  if (value.length > 60) return 'Your name should be 60 characters or fewer.';
  return undefined;
}

export function validateNewPassword(password: string): string | undefined {
  if (!password) return 'Create a password.';
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Use at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'Include at least one letter and one number.';
  }
  return undefined;
}

export function validateConfirmPassword(password: string, confirm: string): string | undefined {
  if (!confirm) return 'Re-enter your password.';
  if (confirm !== password) return "Passwords don't match.";
  return undefined;
}

function collect<T>(entries: [keyof T, string | undefined][]): FormErrors<T> {
  const errors: FormErrors<T> = {};
  entries.forEach(([field, message]) => {
    if (message) errors[field] = message;
  });
  return errors;
}

export interface LoginValues extends Record<string, string> {
  email: string;
  password: string;
}

export function validateLogin(values: LoginValues): FormErrors<LoginValues> {
  return collect<LoginValues>([
    ['email', validateEmail(values.email)],
    ['password', values.password ? undefined : 'Enter your password.'],
  ]);
}

export interface RegisterValues extends Record<string, string> {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export function validateRegister(values: RegisterValues): FormErrors<RegisterValues> {
  return collect<RegisterValues>([
    ['name', validateName(values.name)],
    ['email', validateEmail(values.email)],
    ['password', validateNewPassword(values.password)],
    ['confirmPassword', validateConfirmPassword(values.password, values.confirmPassword)],
  ]);
}
