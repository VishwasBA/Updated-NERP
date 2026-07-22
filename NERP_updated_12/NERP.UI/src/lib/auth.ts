/**
 * Small helper functions for reading and writing the auth token.
 * Centralizing token access reduces duplicate localStorage usage
 * and makes audits (eg. migrating off localStorage) easier.
 */
export function getAuthToken(): string | null {
  try {
    return localStorage.getItem("auth_token");
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
  try {
    localStorage.setItem("auth_token", token);
  } catch {
    // ignore storage errors
  }
}

export function clearAuthToken(): void {
  try {
    localStorage.removeItem("auth_token");
  } catch {
    // ignore storage errors
  }
}
