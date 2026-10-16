import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb, getUserById, type UserRow } from "./db";

const COOKIE = "sc_session";

let sessionSecretWarned = false;

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (value) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SESSION_SECRET is required in production. Set the SESSION_SECRET environment variable before deploying.",
    );
  }
  if (!sessionSecretWarned) {
    sessionSecretWarned = true;
    // eslint-disable-next-line no-console
    console.warn(
      "[ONDAY-SITE] SESSION_SECRET is not set. Using an insecure development fallback. Set SESSION_SECRET before deploying to production.",
    );
  }
  return "class-101-dev-fallback-secret-change-me";
}

export function signSession(userId: string, sessionVersion: number): string {
  const exp = Date.now() + 1000 * 60 * 60 * 18;
  const body = `${userId}.${exp}.${sessionVersion}`;
  const sig = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function readSession(token: string | undefined): { userId: string; sessionVersion: number } | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [userId, exp, sessionVersionStr, sig] = parts;
  if (!userId || !exp || !sessionVersionStr || !sig) return null;
  const expected = createHmac("sha256", secret()).update(`${userId}.${exp}.${sessionVersionStr}`).digest("base64url");
  const left = Buffer.from(sig);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  if (Number(exp) < Date.now()) return null;
  return { userId, sessionVersion: Number(sessionVersionStr) };
}

export async function getSessionUser(): Promise<UserRow | null> {
  const jar = await cookies();
  const session = readSession(jar.get(COOKIE)?.value);
  if (!session) return null;
  const user = getUserById(session.userId);
  if (!user) return null;
  if (user.session_version !== session.sessionVersion) return null;
  return user;
}

export async function requireUser(): Promise<UserRow> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<UserRow> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/dashboard");
  return user;
}

export async function setSession(userId: string) {
  const jar = await cookies();
  const user = getUserById(userId);
  const sessionVersion = user?.session_version ?? 0;
  jar.set(COOKIE, signSession(userId, sessionVersion), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 18,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  const session = readSession(token);
  if (session) {
    getDb()
      .prepare("UPDATE users SET session_version = session_version + 1 WHERE id = ?")
      .run(session.userId);
  }
  jar.delete(COOKIE);
}
