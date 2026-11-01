import type { AuthResult, AuthService, SignInInput, SignUpInput } from './types';

const SIMULATED_DELAY_MS = 600;

export const HARDCODED_USER = {
  email: 'drake@gmail.com',
  password: 'drakegwapo123',
};

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const mockAuthService: AuthService = {
  isMock: true,
  signIn: async ({ email, password }: SignInInput): Promise<AuthResult> => {
    await wait(SIMULATED_DELAY_MS);

    const normalizedEmail = email.trim().toLowerCase();
    if (
      normalizedEmail === HARDCODED_USER.email.toLowerCase() &&
      password === HARDCODED_USER.password
    ) {
      return {
        status: 'success',
        notice: 'Successfully signed in as drake@gmail.com.',
      };
    }

    return {
      status: 'error',
      message: 'Invalid email or password. Use drake@gmail.com and drakegwapo123 for testing.',
    };
  },
  signUp: async ({ email }: SignUpInput): Promise<AuthResult> => {
    await wait(SIMULATED_DELAY_MS);
    if (email.trim().toLowerCase().startsWith('error@')) {
      return {
        status: 'error',
        message: "We couldn't reach the server. Check your connection and try again.",
      };
    }
    return {
      status: 'success',
      notice: 'Account created successfully.',
    };
  },
};
