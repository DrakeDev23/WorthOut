type ClerkLikeError = {
  message?: string;
  longMessage?: string;
  errors?: Array<{ longMessage?: string; message?: string }>;
};

export function getClerkErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== 'object') {
    return fallback;
  }

  const clerkError = error as ClerkLikeError;
  const nested = clerkError.errors?.[0];
  return (
    nested?.longMessage ||
    nested?.message ||
    clerkError.longMessage ||
    clerkError.message ||
    fallback
  );
}
