/** Shared redirect target for magic link and OAuth (Google). */
export function getAuthRedirectUrl(): string {
  return `${window.location.origin}/auth/callback`;
}
