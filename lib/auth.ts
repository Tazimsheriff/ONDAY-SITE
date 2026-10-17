import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { canLogin, getDb, getUserById, type UserRow } from "./db";

const COOKIE = "sc_session";

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value) throw new Error("SESSION_SECRET is missing");
  return value;
}

export function signSession(userId: string, sessionVersion = 0): string {
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
  const sessionVersion = Number(sessionVersionStr);
  if (!Number.isInteger(sessionVersion) || sessionVersion < 0) return null;
  return { userId, sessionVersion };
}

export const getSessionUser = cache(async (): Promise<UserRow | null> => {
  const jar = await cookies();
  const session = readSession(jar.get(COOKIE)?.value);
  if (!session) return null;
  const user = getUserById(session.userId);
  if (!user || !canLogin(user)) return null;
  if ((user.session_version ?? 0) !== session.sessionVersion) return null;
  return user;
});

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

const SESSION_MAX_AGE = 60 * 60 * 18;

export function sessionCookie(userId: string) {
  const sessionVersion = getUserById(userId)?.session_version ?? 0;
  return {
    name: COOKIE,
    value: signSession(userId, sessionVersion),
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      path: "/",
      maxAge: SESSION_MAX_AGE,
      secure: process.env.NODE_ENV === "production",
    },
  };
}

export async function setSession(userId: string) {
  const jar = await cookies();
  const cookie = sessionCookie(userId);
  jar.set(cookie.name, cookie.value, cookie.options);
}

export async function clearSession() {
  const jar = await cookies();
  const session = readSession(jar.get(COOKIE)?.value);
  if (session) {
    getDb()
      .prepare("UPDATE users SET session_version = session_version + 1 WHERE id = ?")
      .run(session.userId);
  }
  jar.delete(COOKIE);
}
