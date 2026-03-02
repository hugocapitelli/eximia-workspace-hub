const CACHE_KEY = "_wh_mp";

export function getCachedMasterPassword(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(CACHE_KEY);
}

export function cacheMasterPassword(password: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(CACHE_KEY, password);
}

export function clearCachedMasterPassword(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(CACHE_KEY);
}
