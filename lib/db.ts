import fs from "fs";
import path from "path";
import { randomUUID, scryptSync, timingSafeEqual } from "crypto";
import { DatabaseSync } from "node:sqlite";
import { cleanName, normName, phoneKey } from "./format";

const DATA_DIR = path.join(process.cwd(), "data");

const globalForDb = globalThis as unknown as { eventDb?: DatabaseSync };

const SALT_BYTES = 16;
const KEY_BYTES = 32;

export function hashPassword(password: string): string {
  const randomSalt = scryptSync(randomUUID(), "salt-seed", SALT_BYTES);
  const derived = scryptSync(password, randomSalt, KEY_BYTES);
  return `${randomSalt.toString("hex")}:${derived.toString("hex")}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  try {
    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(hashHex, "hex");
    const derived = scryptSync(password, salt, KEY_BYTES);
    return derived.length === expected.length && timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

// Simple in-memory login rate limiter (per identifier, 15-minute window).
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function checkLoginRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(identifier);
  if (!record || now > record.resetAt) {
    loginAttempts.set(identifier, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return true;
  }
  if (record.count >= 10) return false;
  record.count += 1;
  return true;
}

export type UserRow = {
  id: string;
  guest_id: string | null;
  name: string;
  name_key: string;
  email: string;
  phone: string;
  phone_key: string;
  password_hash: string | null;
  session_version: number;
  college: string;
  year: string;
  occupation: string;
  role: "user" | "admin";
  points: number;
  dollars: number;
  team_id: string | null;
  task: string;
  secret_task: string;
  linkedin: string;
  instagram: string;
  github: string;
  discord: string;
  portfolio: string;
  bio: string;
  slug: string;
  approval_status: string;
  heard_from: string;
  signals: string;
  created_at: string;
  team_name?: string | null;
  team_color?: string | null;
};

export type TeamRow = {
  id: string;
  name: string;
  motto: string;
  color: string;
  bonus_points: number;
  created_at: string;
  members?: number;
  member_points?: number;
  marks?: number;
};

export type GoodieRow = {
  id: string;
  name: string;
  description: string;
  cost: number;
  stock: number;
  active: number;
};

export type RedemptionRow = {
  id: string;
  user_id: string;
  goodie_id: string;
  goodie_name: string;
  cost: number;
  quantity: number;
  status: string;
  created_at: string;
  user_name?: string;
};

export type LedgerRow = {
  id: string;
  user_id: string | null;
  team_id: string | null;
  kind: string;
  delta: number;
  note: string;
  actor_id: string | null;
  created_at: string;
  user_name?: string | null;
};

function createSchema(db: DatabaseSync) {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      motto TEXT NOT NULL DEFAULT '',
      color TEXT NOT NULL DEFAULT 'butter',
      bonus_points INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      guest_id TEXT UNIQUE,
      name TEXT NOT NULL,
      name_key TEXT NOT NULL,
      email TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      phone_key TEXT NOT NULL DEFAULT '',
      password_hash TEXT NOT NULL DEFAULT '',
      session_version INTEGER NOT NULL DEFAULT 0,
      college TEXT NOT NULL DEFAULT '',
      year TEXT NOT NULL DEFAULT '',
      occupation TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL DEFAULT 'user',
      points INTEGER NOT NULL DEFAULT 0,
      dollars INTEGER NOT NULL DEFAULT 0,
      team_id TEXT,
      task TEXT NOT NULL DEFAULT '',
      secret_task TEXT NOT NULL DEFAULT '',
      linkedin TEXT NOT NULL DEFAULT '',
      instagram TEXT NOT NULL DEFAULT '',
      github TEXT NOT NULL DEFAULT '',
      discord TEXT NOT NULL DEFAULT '',
      portfolio TEXT NOT NULL DEFAULT '',
      bio TEXT NOT NULL DEFAULT '',
      slug TEXT NOT NULL UNIQUE,
      approval_status TEXT NOT NULL DEFAULT '',
      heard_from TEXT NOT NULL DEFAULT '',
      signals TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS goodies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      cost INTEGER NOT NULL,
      stock INTEGER NOT NULL,
      active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS redemptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      goodie_id TEXT NOT NULL,
      goodie_name TEXT NOT NULL,
      cost INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'claimed',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS connections (
      id TEXT PRIMARY KEY,
      scanner_id TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE (scanner_id, owner_id)
    );

    CREATE TABLE IF NOT EXISTS ledger (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      team_id TEXT,
      kind TEXT NOT NULL,
      delta INTEGER NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      actor_id TEXT,
      created_at TEXT NOT NULL
    );
  `);
}

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  const src = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < src.length; i += 1) {
    const char = src[i];
    if (inQuotes) {
      if (char === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') inQuotes = true;
    else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") cell += char;
  }

  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }

  const [header, ...body] = rows.filter((entry) => entry.some((value) => value.trim()));
  if (!header) return [];

  return body.map((entry) => {
    const record: Record<string, string> = {};
    header.forEach((key, index) => {
      record[key] = entry[index] ?? "";
    });
    return record;
  });
}

function pick(row: Record<string, string>, part: string): string {
  const key = Object.keys(row).find((name) => name.toLowerCase().includes(part.toLowerCase()));
  return key ? row[key].trim() : "";
}

function seed(db: DatabaseSync) {
  const count = db.prepare("SELECT COUNT(*) AS count FROM users").get() as { count: number };
  if (count.count > 0) return;

  const now = new Date().toISOString();
  const teams = [
    ["Explore", "Network past your own campus.", "mint"],
    ["Evelve", "Become a sharper version of yourself.", "sky"],
    ["Engineer", "Build something you can show.", "butter"],
    ["Orbit", "Find your people and stay in motion.", "lilac"],
    ["Signal", "Say the useful thing out loud.", "peach"],
    ["Forge", "Make the game, don't just win it.", "violet"],
  ];

  const insertTeam = db.prepare(
    "INSERT INTO teams (id, name, motto, color, bonus_points, created_at) VALUES (?, ?, ?, ?, 0, ?)",
  );
  const insertGoodie = db.prepare(
    "INSERT INTO goodies (id, name, description, cost, stock, active) VALUES (?, ?, ?, ?, ?, 1)",
  );
  const insertUser = db.prepare(`
    INSERT INTO users (
      id, guest_id, name, name_key, email, phone, phone_key, college, year, occupation,
      role, points, dollars, team_id, task, secret_task, linkedin, instagram, github,
      portfolio, bio, slug, approval_status, heard_from, signals, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'user', 0, 0, NULL, '', '', '', '', '', '', '', ?, ?, ?, ?, ?)
  `);

  db.exec("BEGIN");
  try {
    for (const [name, motto, color] of teams) {
      insertTeam.run(randomUUID(), name, motto, color, now);
    }

    const goodies: [string, string, number, number][] = [
      ["Sticker sheet", "The CodeSapiens mark, peeled and stuck on something you carry.", 20, 40],
      ["Snack pass", "One counter snack. Hunger is not a personality.", 15, 60],
      ["Pin badge", "A small metal claim that you were in the room.", 30, 30],
      ["Demo-slot token", "Jump the line and show what you made.", 60, 10],
      ["Tote bag", "Carry the syllabus you were supposed to leave behind.", 80, 16],
    ];
    for (const [name, description, cost, stock] of goodies) {
      insertGoodie.run(randomUUID(), name, description, cost, stock);
    }

    const adminPassword = process.env.ADMIN_PASSWORD?.trim();
    if (!adminPassword) {
      throw new Error(
        "ADMIN_PASSWORD must be configured before initial seeding. Set the ADMIN_PASSWORD environment variable.",
      );
    }
    const adminPasswordHash = hashPassword(adminPassword);
    db.prepare(`
      INSERT INTO users (
        id, guest_id, name, name_key, email, phone, phone_key, password_hash, session_version, college, year, occupation,
        role, points, dollars, team_id, task, secret_task, linkedin, instagram, github,
        portfolio, bio, slug, approval_status, heard_from, signals, created_at
      ) VALUES (
        'admin', NULL, 'Sapiens Admin', 'sapiens admin', '', ?, ?, ?, 0, 'CodeSapiens', '', 'Organizer',
        'admin', 0, 0, NULL, '', '', '', '', '', '', '', 'admin', 'approved', '', '[]', ?
      )
    `).run(adminPassword, adminPassword.toLowerCase(), adminPasswordHash, now);

    const csvPath = path.join(DATA_DIR, "guests.csv");
    if (fs.existsSync(csvPath)) {
      const records = parseCsv(fs.readFileSync(csvPath, "utf8"));
      for (const record of records) {
        const name = cleanName(record.name || "");
        const guestId = (record.guest_id || "").trim();
        if (!name || !guestId) continue;
        const phone = (record.phone_number || "").trim();
        const signals = [
          pick(record, "Jack of All Trades"),
          pick(record, "Stage or Behind"),
          pick(record, "iPhone or Android"),
          pick(record, "Batman or Spider"),
          pick(record, "Solo Trip"),
          pick(record, "Win the Game"),
          pick(record, "People or Places"),
        ].filter(Boolean);

        insertUser.run(
          guestId,
          guestId,
          name,
          normName(name),
          (record.email || "").trim(),
          phone,
          phone ? phoneKey(phone) : "",
          pick(record, "College/Company"),
          pick(record, "year do you belong"),
          pick(record, "Occupation"),
          guestId,
          (record.approval_status || "").trim(),
          pick(record, "hear about"),
          JSON.stringify(signals),
          record.created_at || now,
        );
      }
    }

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function ensureDemo(db: DatabaseSync) {
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_DEMO !== "true") return;
  const existing = db.prepare("SELECT id FROM users WHERE id = 'demo'").get();
  if (existing) return;
  const phone = "9000000001";
  const passwordHash = hashPassword(phone);
  db.prepare(
    `INSERT INTO users (
      id, guest_id, name, name_key, email, phone, phone_key, password_hash, session_version, college, year, occupation,
      role, points, dollars, team_id, task, secret_task, linkedin, instagram, github,
      portfolio, bio, slug, approval_status, heard_from, signals, created_at
    ) VALUES (
      'demo', NULL, 'Demo Sapien', 'demo sapien', '', ?, ?, ?, 0, 'Sapiens Campus', 'First Year', 'Student',
      'user', 0, 0, NULL, '', '', '', '', '', '', '', 'demo', 'demo', '', '[]', ?
    )`,
  ).run(phone, phoneKey(phone), passwordHash, new Date().toISOString());
}

function ensureColumns(db: DatabaseSync) {
  const columns = db.prepare("PRAGMA table_info(users)").all() as { name: string }[];
  for (const column of ["discord", "password_hash", "session_version"]) {
    if (!columns.some((c) => c.name === column)) {
      db.exec(
        `ALTER TABLE users ADD COLUMN ${column} ${column === "session_version" ? "INTEGER NOT NULL DEFAULT 0" : "TEXT NOT NULL DEFAULT ''"}`,
      );
    }
  }
  if (!columns.some((c) => c.name === "quantity")) {
    // quantity lives on redemptions, not users; ensure that table column too
    const redeemCols = db.prepare("PRAGMA table_info(redemptions)").all() as { name: string }[];
    if (!redeemCols.some((c) => c.name === "quantity")) {
      db.exec("ALTER TABLE redemptions ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1");
    }
  }
  db.exec(`
    CREATE TABLE IF NOT EXISTS connections (
      id TEXT PRIMARY KEY,
      scanner_id TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE (scanner_id, owner_id)
    );
  `);
}

function resolveDbPath(): string {
  // Vercel’s app directory is read-only. /tmp is the only place a file can be created.
  const dir = process.env.VERCEL ? path.join("/tmp", "class101") : DATA_DIR;
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, "event.db");
}

export function getDb(): DatabaseSync {
  if (!globalForDb.eventDb) {
    const db = new DatabaseSync(resolveDbPath());
    createSchema(db);
    ensureColumns(db);
    seed(db);
    globalForDb.eventDb = db;
  }
  ensureColumns(globalForDb.eventDb);
  ensureDemo(globalForDb.eventDb);
  return globalForDb.eventDb;
}

export function getUserById(id: string): UserRow | null {
  const row = getDb()
    .prepare(
      `SELECT u.*, t.name AS team_name, t.color AS team_color
       FROM users u LEFT JOIN teams t ON t.id = u.team_id
       WHERE u.id = ?`,
    )
    .get(id) as UserRow | undefined;
  return row ?? null;
}

export function getUserBySlug(slug: string): UserRow | null {
  const row = getDb()
    .prepare(
      `SELECT u.id, u.name, u.college, u.year, u.occupation, u.slug, u.linkedin, u.instagram,
              u.github, u.discord, u.portfolio, u.bio, u.signals, u.points, u.dollars, u.team_id, u.role,
              t.name AS team_name, t.color AS team_color
       FROM users u LEFT JOIN teams t ON t.id = u.team_id
       WHERE u.slug = ? AND u.role = 'user'`,
    )
    .get(slug) as UserRow | undefined;
  return row ?? null;
}

export function findLogin(name: string, password: string): UserRow | null {
  const identifier = `${name.toLowerCase().trim()}|${password.slice(0, 4)}`;
  if (!checkLoginRateLimit(identifier)) return null;

  const typed = normName(name);
  if (typed.length < 2 || !password) return null;

  const rows = getDb()
    .prepare("SELECT * FROM users")
    .all() as UserRow[];

  const candidates = rows.filter((user) => {
    if (user.role === "admin") {
      return typed === "admin" || typed === user.name_key;
    }
    if (typed === user.name_key) return true;
    return user.name_key.split(" ").includes(typed) && typed.length >= 3;
  });

  for (const user of candidates) {
    if (user.password_hash && verifyPassword(password, user.password_hash)) {
      return user;
    }
  }

  return null;
}

export function listStudents(): UserRow[] {
  return getDb()
    .prepare(
      `SELECT u.*, t.name AS team_name, t.color AS team_color
       FROM users u LEFT JOIN teams t ON t.id = u.team_id
       WHERE u.role = 'user'
       ORDER BY u.name_key`,
    )
    .all() as UserRow[];
}

export function listTeams(): TeamRow[] {
  return getDb()
    .prepare(
      `SELECT t.*,
              COUNT(u.id) AS members,
              COALESCE(SUM(u.points), 0) AS member_points,
              MAX(0, COALESCE(SUM(u.points), 0) + t.bonus_points) AS marks
       FROM teams t
       LEFT JOIN users u ON u.team_id = t.id AND u.role = 'user'
       GROUP BY t.id
       ORDER BY marks DESC, t.name COLLATE NOCASE`,
    )
    .all() as TeamRow[];
}

export function listTeamMembers(teamId: string): UserRow[] {
  return getDb()
    .prepare(
      `SELECT id, name, points, college, slug FROM users
       WHERE team_id = ? AND role = 'user'
       ORDER BY points DESC, name_key`,
    )
    .all(teamId) as UserRow[];
}

export function listGoodies(includeInactive = false): GoodieRow[] {
  const sql = includeInactive
    ? "SELECT * FROM goodies ORDER BY cost, name"
    : "SELECT * FROM goodies WHERE active = 1 ORDER BY cost, name";
  return getDb().prepare(sql).all() as GoodieRow[];
}

export function listRedemptions(userId?: string): RedemptionRow[] {
  if (userId) {
    return getDb()
      .prepare(
        `SELECT * FROM redemptions WHERE user_id = ? ORDER BY created_at DESC`,
      )
      .all(userId) as RedemptionRow[];
  }
  return getDb()
    .prepare(
      `SELECT r.*, u.name AS user_name
       FROM redemptions r JOIN users u ON u.id = r.user_id
       ORDER BY r.created_at DESC`,
    )
    .all() as RedemptionRow[];
}

export function listLedger(userId?: string, limit = 12): LedgerRow[] {
  if (userId) {
    return getDb()
      .prepare(
        `SELECT * FROM ledger WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
      )
      .all(userId, limit) as LedgerRow[];
  }
  return getDb()
    .prepare(
      `SELECT l.*, u.name AS user_name
       FROM ledger l LEFT JOIN users u ON u.id = l.user_id
       ORDER BY l.created_at DESC LIMIT ?`,
    )
    .all(limit) as LedgerRow[];
}

export type RankedPerson = UserRow & { rank: number };
export type RankedTeam = TeamRow & { rank: number };

function withRanks<T extends { marks?: number; points?: number }>(
  rows: T[],
  score: (row: T) => number,
): (T & { rank: number })[] {
  let lastScore: number | null = null;
  let lastRank = 0;
  return rows.map((row, index) => {
    const value = score(row);
    if (lastScore === null || value !== lastScore) {
      lastRank = index + 1;
      lastScore = value;
    }
    return { ...row, rank: lastRank };
  });
}

export function leaderboard(): { teams: RankedTeam[]; people: RankedPerson[] } {
  const teams = withRanks(listTeams(), (team) => team.marks ?? 0) as RankedTeam[];
  const people = getDb()
    .prepare(
      `SELECT u.id, u.name, u.college, u.year, u.points, u.dollars, u.slug, u.team_id,
              t.name AS team_name, t.color AS team_color
       FROM users u LEFT JOIN teams t ON t.id = u.team_id
       WHERE u.role = 'user'
       ORDER BY u.points DESC, u.name_key`,
    )
    .all() as UserRow[];
  return {
    teams,
    people: withRanks(people, (person) => person.points) as RankedPerson[],
  };
}

export function eventStats() {
  const db = getDb();
  const students = db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'user'").get() as { count: number };
  const assigned = db
    .prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'user' AND team_id IS NOT NULL")
    .get() as { count: number };
  const points = db.prepare("SELECT COALESCE(SUM(points), 0) AS total FROM users WHERE role = 'user'").get() as {
    total: number;
  };
  const dollars = db.prepare("SELECT COALESCE(SUM(dollars), 0) AS total FROM users WHERE role = 'user'").get() as {
    total: number;
  };
  const teams = db.prepare("SELECT COUNT(*) AS count FROM teams").get() as { count: number };
  return {
    students: students.count,
    assigned: assigned.count,
    unassigned: students.count - assigned.count,
    points: points.total,
    dollars: dollars.total,
    teams: teams.count,
  };
}

export type ConnectionPerson = {
  id: string;
  name: string;
  college: string;
  slug: string;
  team_name: string | null;
  created_at: string;
};

export function recordConnection(scannerId: string, ownerId: string): boolean {
  if (!scannerId || !ownerId || scannerId === ownerId) return false;
  const result = getDb()
    .prepare(
      `INSERT OR IGNORE INTO connections (id, scanner_id, owner_id, created_at) VALUES (?, ?, ?, ?)`,
    )
    .run(randomUUID(), scannerId, ownerId, new Date().toISOString());
  return result.changes > 0;
}

export function areConnected(a: string, b: string): boolean {
  const row = getDb()
    .prepare(
      `SELECT id FROM connections
       WHERE (scanner_id = ? AND owner_id = ?) OR (scanner_id = ? AND owner_id = ?)`,
    )
    .get(a, b, b, a);
  return Boolean(row);
}

export function listConnections(userId: string): ConnectionPerson[] {
  return getDb()
    .prepare(
      `SELECT u.id, u.name, u.college, u.slug, t.name AS team_name, MAX(c.created_at) AS created_at
       FROM (
         SELECT owner_id AS other_id, created_at FROM connections WHERE scanner_id = ?
         UNION ALL
         SELECT scanner_id AS other_id, created_at FROM connections WHERE owner_id = ?
       ) c
       JOIN users u ON u.id = c.other_id AND u.role = 'user'
       LEFT JOIN teams t ON t.id = u.team_id
       GROUP BY u.id
       ORDER BY created_at DESC, u.name_key`,
    )
    .all(userId, userId) as ConnectionPerson[];
}

export function writeLedger(entry: {
  userId?: string | null;
  teamId?: string | null;
  kind: string;
  delta: number;
  note: string;
  actorId?: string | null;
}) {
  getDb()
    .prepare(
      `INSERT INTO ledger (id, user_id, team_id, kind, delta, note, actor_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      randomUUID(),
      entry.userId ?? null,
      entry.teamId ?? null,
      entry.kind,
      entry.delta,
      entry.note,
      entry.actorId ?? null,
      new Date().toISOString(),
    );
}
