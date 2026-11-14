const ACCESS_TOKEN_KEY = "profitai_access_token";
const ORG_ID_KEY = "profitai_org_id";
const ORGS_KEY = "profitai_organizations";

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
  (remember ? window.localStorage : window.sessionStorage).setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(ORG_ID_KEY);
  window.sessionStorage.removeItem(ORG_ID_KEY);
  window.localStorage.removeItem(ORGS_KEY);
  window.sessionStorage.removeItem(ORGS_KEY);
}

// --- Organization ID ---

export function saveOrgId(orgId: number, remember: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ORG_ID_KEY);
  window.sessionStorage.removeItem(ORG_ID_KEY);
  (remember ? window.localStorage : window.sessionStorage).setItem(ORG_ID_KEY, String(orgId));
}

export function getOrgId(): string | null {
  if (typeof window === "undefined") return null;
  return (
    window.localStorage.getItem(ORG_ID_KEY) ??
    window.sessionStorage.getItem(ORG_ID_KEY)
  );
}

// --- Organizations list ---

export interface OrgOption {
  organization_id: number;
  organization_name: string;
  role: string;
}

export function saveOrganizations(orgs: OrgOption[], remember: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ORGS_KEY);
  window.sessionStorage.removeItem(ORGS_KEY);
  (remember ? window.localStorage : window.sessionStorage).setItem(ORGS_KEY, JSON.stringify(orgs));
}

export function getOrganizations(): OrgOption[] {
  if (typeof window === "undefined") return [];
  try {
    const raw =
      window.localStorage.getItem(ORGS_KEY) ??
      window.sessionStorage.getItem(ORGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function switchOrg(orgId: number): void {
  if (typeof window === "undefined") return;
  // Simpan ke storage yang sama dengan token
  const inLocal = window.localStorage.getItem(ACCESS_TOKEN_KEY) !== null;
  if (inLocal) {
    window.localStorage.setItem(ORG_ID_KEY, String(orgId));
  } else {
    window.sessionStorage.setItem(ORG_ID_KEY, String(orgId));
  }
}
