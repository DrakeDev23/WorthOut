
export interface SignInInput {
  email: string;
  password: string;
}

export interface SignUpInput {
  name: string;
  email: string;
  password: string;
}

export type AuthResult =
  | {
      status: 'success';
      notice?: string;
    }
  | { status: 'error'; message: string };

export interface AuthService {
  readonly isMock: boolean;
  signIn(input: SignInInput): Promise<AuthResult>;
  signUp(input: SignUpInput): Promise<AuthResult>;
}
