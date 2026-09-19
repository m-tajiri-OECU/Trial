import { createHash } from "crypto";

export const ADMIN_SESSION_COOKIE = "oecu_admin_session";

const DEFAULT_PASSWORD = "oecu-trial-2026";
const DEFAULT_SECRET = "oecu-skill-portal-default-secret";

function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD;
}

function getSessionSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || DEFAULT_SECRET;
}

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function verifyPassword(password: string): boolean {
  return password === getAdminPassword();
}

export function getSessionToken(): string {
  return hash(`${getAdminPassword()}:${getSessionSecret()}`);
}

export function isAuthorized(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false;
  return cookieValue === getSessionToken();
}
