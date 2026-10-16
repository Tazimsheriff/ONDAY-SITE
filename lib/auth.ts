import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserById, type UserRow } from "./db";

const COOKIE = "sc_session";

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value) throw new Error("SESSION_SECRET is missing");
  return value;
}

export function signSession(userId: string): string {
  const exp = Date.now() + 1000 * 60 * 60 * 18;
  const body = `${userId}.${exp}`;
  const sig = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function readSession(token: string | undefined): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, exp, sig] = parts;
  if (!userId || !exp || !sig) return null;
  const expected = createHmac("sha256", secret()).update(`${userId}.${exp}`).digest("base64url");
  const left = Buffer.from(sig);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  if (Number(exp) < Date.now()) return null;
  return userId;
}

export async function getSessionUser(): Promise<UserRow | null> {
  const jar = await cookies();
  const userId = readSession(jar.get(COOKIE)?.value);
  if (!userId) return null;
  return getUserById(userId);
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
  jar.set(COOKIE, signSession(userId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 18,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}
