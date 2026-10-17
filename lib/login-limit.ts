import { getDb } from "./db";
import { normName } from "./format";

const WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;
const NAME_LIMIT = 5;
const IP_LIMIT = 40;

type Attempt = { fails: number; window_start: number; locked_until: number };

function bucketKey(kind: "ip" | "name", value: string): string {
  return `${kind}:${value.slice(0, 80)}`;
}

function readAttempt(bucket: string, now: number): Attempt {
  const row = getDb()
    .prepare("SELECT fails, window_start, locked_until FROM login_attempts WHERE bucket = ?")
    .get(bucket) as Attempt | undefined;
  if (!row) return { fails: 0, window_start: now, locked_until: 0 };
  if (row.locked_until > now) return row;
  if (now - row.window_start > WINDOW_MS) return { fails: 0, window_start: now, locked_until: 0 };
  return row;
}

function writeAttempt(bucket: string, attempt: Attempt) {
  getDb()
    .prepare(
      `INSERT INTO login_attempts (bucket, fails, window_start, locked_until)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(bucket) DO UPDATE SET
         fails = excluded.fails,
         window_start = excluded.window_start,
         locked_until = excluded.locked_until`,
    )
    .run(bucket, attempt.fails, attempt.window_start, attempt.locked_until);
}

function prune(now: number) {
  getDb()
    .prepare("DELETE FROM login_attempts WHERE locked_until < ? AND window_start < ?")
    .run(now, now - WINDOW_MS);
}

export function clientIp(header: (name: string) => string | null): string {
  const real = header("x-real-ip")?.trim();
  if (real) return real.slice(0, 64);
  const forwarded = header("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded.slice(0, 64);
  return "unknown";
}

export function loginBlocked(ip: string, name: string): boolean {
  const now = Date.now();
  prune(now);
  const nameKey = normName(name);
  const ipAttempt = readAttempt(bucketKey("ip", ip || "unknown"), now);
  if (ipAttempt.locked_until > now) return true;
  if (nameKey.length < 2) return false;
  const nameAttempt = readAttempt(bucketKey("name", nameKey), now);
  return nameAttempt.locked_until > now;
}

export function recordLoginFailure(ip: string, name: string) {
  const now = Date.now();
  const ipBucket = bucketKey("ip", ip || "unknown");
  const ipAttempt = readAttempt(ipBucket, now);
  const ipFails = ipAttempt.fails + 1;
  writeAttempt(ipBucket, {
    fails: ipFails,
    window_start: ipAttempt.fails === 0 ? now : ipAttempt.window_start,
    locked_until: ipFails >= IP_LIMIT ? now + LOCK_MS : 0,
  });

  const nameKey = normName(name);
  if (nameKey.length < 2) return;
  const nameBucket = bucketKey("name", nameKey);
  const nameAttempt = readAttempt(nameBucket, now);
  const nameFails = nameAttempt.fails + 1;
  writeAttempt(nameBucket, {
    fails: nameFails,
    window_start: nameAttempt.fails === 0 ? now : nameAttempt.window_start,
    locked_until: nameFails >= NAME_LIMIT ? now + LOCK_MS : 0,
  });
}

export function recordLoginSuccess(ip: string, name: string) {
  const nameKey = normName(name);
  const db = getDb();
  db.prepare("DELETE FROM login_attempts WHERE bucket = ?").run(bucketKey("ip", ip || "unknown"));
  if (nameKey.length >= 2) {
    db.prepare("DELETE FROM login_attempts WHERE bucket = ?").run(bucketKey("name", nameKey));
  }
}
