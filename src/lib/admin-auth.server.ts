// Server-only helpers for the simple NGO admin login.
// Only import this file from inside server function handlers (dynamic import) or other *.server.ts files.
import { getCookie, setCookie, deleteCookie, getRequest } from "@tanstack/react-start/server";

// ── DEFAULT ADMIN LOGIN ─────────────────────────────────────────────────────
// Change these here, or set ADMIN_USERNAME / ADMIN_PASSWORD as environment variables.
export const DEFAULT_ADMIN_USERNAME = "admin";
export const DEFAULT_ADMIN_PASSWORD = "riseandtails@123";
// ────────────────────────────────────────────────────────────────────────────

const COOKIE = "rt_admin";
const SESSION_SECONDS = 60 * 60 * 8; // stay signed in for 8 hours

const enc = new TextEncoder();

function adminCredentials() {
  return {
    username: process.env["ADMIN_USERNAME"] || DEFAULT_ADMIN_USERNAME,
    password: process.env["ADMIN_PASSWORD"] || DEFAULT_ADMIN_PASSWORD,
  };
}

function secret(): string {
  const s = process.env["ADMIN_SESSION_SECRET"] || process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!s) {
    throw new Error(
      "Admin panel needs SUPABASE_SERVICE_ROLE_KEY (or ADMIN_SESSION_SECRET) set on the server.",
    );
  }
  return s;
}

const b64url = (buf: ArrayBuffer | Uint8Array) => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}

// Constant-time string compare so the password check doesn't leak timing info.
function safeEqual(a: string, b: string): boolean {
  const x = enc.encode(a), y = enc.encode(b);
  let diff = x.length ^ y.length;
  const n = Math.max(x.length, y.length);
  for (let i = 0; i < n; i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

export function credentialsAreValid(username: string, password: string): boolean {
  const c = adminCredentials();
  // Evaluate both so timing doesn't reveal which one was wrong.
  const okUser = safeEqual(username.trim(), c.username);
  const okPass = safeEqual(password, c.password);
  return okUser && okPass;
}

export async function startAdminSession(): Promise<void> {
  const payload = b64url(enc.encode(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS })));
  const token = `${payload}.${await hmac(payload)}`;
  const secure = new URL(getRequest().url).protocol === "https:";
  setCookie(COOKIE, token, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: SESSION_SECONDS });
}

export function endAdminSession(): void {
  deleteCookie(COOKIE, { path: "/" });
}

export async function isAdminSignedIn(): Promise<boolean> {
  const token = getCookie(COOKIE);
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  if (!safeEqual(sig, await hmac(payload))) return false;
  try {
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as { exp?: number };
    return typeof json.exp === "number" && json.exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdminSignedIn())) throw new Error("Unauthorized: please sign in to the admin panel.");
}
