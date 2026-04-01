const ACCOUNTS_KEY = "interview_regulator_accounts";
const SESSION_KEY = "interview_regulator_session";
const LEGACY_KEY = "drdo_user";

export interface Education {
  degree: string;
  field: string;
  institution: string;
  year: number;
  grade: string;
}

export interface Experience {
  company: string;
  role: string;
  duration_months: number;
  projects: string[];
  skills: string[];
}

export interface CandidateProfile {
  id: string;
  email: string;
  name: string;
  job_role: string;
  education: Education[];
  experience: Experience[];
  type: "candidate";
}

export interface ExpertProfile {
  id: string;
  email: string;
  name: string;
  expertise: string;
  seniority: number;
  type: "expert";
}

export type UserProfile = CandidateProfile | ExpertProfile;

export interface AuthSession {
  email: string;
  profile: UserProfile;
}

interface StoredAccount {
  passwordHash: string;
  profile: UserProfile;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder().encode(password);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Remove legacy key so users re-auth with the new account model. */
export function clearLegacySession(): void {
  localStorage.removeItem(LEGACY_KEY);
}

function loadAccountsMap(): Record<string, StoredAccount> {
  clearLegacySession();
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, StoredAccount>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveAccountsMap(accounts: Record<string, StoredAccount>): void {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function writeSession(session: AuthSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSession(): AuthSession | null {
  clearLegacySession();
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}

export type RegisterResult = { ok: true } | { ok: false; error: string };
export type LoginResult = { ok: true } | { ok: false; error: string };

export async function registerAccount(
  email: string,
  password: string,
  profile: UserProfile
): Promise<RegisterResult> {
  clearLegacySession();
  const key = normalizeEmail(email);
  if (!key) {
    return { ok: false, error: "Email is required." };
  }
  const accounts = loadAccountsMap();
  if (accounts[key]) {
    return { ok: false, error: "An account with this email already exists." };
  }
  const passwordHash = await hashPassword(password);
  const profileWithEmail: UserProfile = {
    ...profile,
    email: key,
  } as UserProfile;
  accounts[key] = { passwordHash, profile: profileWithEmail };
  saveAccountsMap(accounts);
  writeSession({ email: key, profile: profileWithEmail });
  return { ok: true };
}

export async function login(email: string, password: string): Promise<LoginResult> {
  clearLegacySession();
  const key = normalizeEmail(email);
  const accounts = loadAccountsMap();
  const acc = accounts[key];
  if (!acc) {
    return { ok: false, error: "Invalid email or password." };
  }
  const hash = await hashPassword(password);
  if (hash !== acc.passwordHash) {
    return { ok: false, error: "Invalid email or password." };
  }
  writeSession({ email: key, profile: acc.profile });
  return { ok: true };
}
