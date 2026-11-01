import { mockAuthService } from './mockAuthService';
import type { AuthService } from './types';

export const authService: AuthService = mockAuthService;

export type { AuthResult, AuthService, SignInInput, SignUpInput } from './types';
