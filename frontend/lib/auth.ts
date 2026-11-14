const ACCESS_TOKEN_KEY = "profitai_access_token";
const ORG_ID_KEY = "profitai_org_id";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    window.localStorage.getItem(ACCESS_TOKEN_KEY) ??
    window.sessionStorage.getItem(ACCESS_TOKEN_KEY)
  );
}

export function saveAccessToken(token: string, remember: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  (remember ? window.localStorage : window.sessionStorage).setItem(
    ACCESS_TOKEN_KEY,
    token,
  );
}

export function clearAccessToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(ORG_ID_KEY);
  window.sessionStorage.removeItem(ORG_ID_KEY);
}

// --- Organization ID ---

export function saveOrgId(orgId: number, remember: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ORG_ID_KEY);
  window.sessionStorage.removeItem(ORG_ID_KEY);
  (remember ? window.localStorage : window.sessionStorage).setItem(
    ORG_ID_KEY,
    String(orgId),
  );
}

export function getOrgId(): string | null {
  if (typeof window === "undefined") return null;
  return (
    window.localStorage.getItem(ORG_ID_KEY) ??
    window.sessionStorage.getItem(ORG_ID_KEY)
  );
}
