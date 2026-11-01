import type { AuthResult, AuthService, SignInInput, SignUpInput } from './types';


const SIMULATED_DELAY_MS = 1200;

const MOCK_NOTICE =
  'Demo mode: your details passed validation, but no account was created and nobody was signed in. Real authentication arrives in a later phase.';

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function simulate(email: string): Promise<AuthResult> {
  await wait(SIMULATED_DELAY_MS);
  if (email.trim().toLowerCase().startsWith('error@')) {
    return {
      status: 'error',
      message:
        "We couldn't reach the server. Check your connection and try again. (Simulated error)",
    };
  }
  return { status: 'success', notice: MOCK_NOTICE };
}

export const mockAuthService: AuthService = {
  isMock: true,
  signIn: ({ email }: SignInInput) => simulate(email),
  signUp: ({ email }: SignUpInput) => simulate(email),
};
