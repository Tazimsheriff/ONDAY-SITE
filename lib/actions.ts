"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearSession, requireAdmin, requireUser, setSession } from "./auth";
import {
  findLogin,
  getDb,
  getUserById,
  parseCsv,
  recordConnection,
  writeLedger,
  type UserRow,
} from "./db";
import { clampText, cleanName, genderLabel, integer, normName, phoneKey, safeReturn } from "./format";

function touch() {
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/leaderboard");
  revalidatePath("/redeem");
  revalidatePath("/admin");
  revalidatePath("/admin/students");
  revalidatePath("/admin/teams");
  revalidatePath("/admin/goodies");
}

export async function login(formData: FormData) {
  const user = findLogin(String(formData.get("name") || ""), String(formData.get("phone") || ""));
  if (!user) redirect("/login?error=mismatch");
  await setSession(user.id);
  const next = safeReturn(formData.get("next"), "");
  redirect(user.role === "admin" ? "/admin" : next || "/dashboard");
}

export async function logout() {
  await clearSession();
  redirect("/");
}

export async function updateProfile(formData: FormData) {
  const user = await requireUser();
  if (user.role !== "user") redirect("/admin");

  const college = clampText(String(formData.get("college") || ""), 120);
  const bio = String(formData.get("bio") || "").trim().slice(0, 280);
  const linkedin = clampText(String(formData.get("linkedin") || ""), 300);
  const instagram = clampText(String(formData.get("instagram") || ""), 300);
  const github = clampText(String(formData.get("github") || ""), 300);
  const discord = clampText(String(formData.get("discord") || ""), 300);
  const portfolio = clampText(String(formData.get("portfolio") || ""), 300);

  getDb()
    .prepare(
      `UPDATE users
       SET college = ?, bio = ?, linkedin = ?, instagram = ?, github = ?, discord = ?, portfolio = ?
       WHERE id = ?`,
    )
    .run(college, bio, linkedin, instagram, github, discord, portfolio, user.id);

  revalidatePath("/dashboard");
  revalidatePath("/profile");
  revalidatePath(`/card/${user.slug}`);
  revalidatePath("/leaderboard");
  redirect("/profile?notice=profile");
}

export async function redeem(formData: FormData) {
  const user = await requireUser();
  if (user.role !== "user") redirect("/admin");
  const goodieId = String(formData.get("goodieId") || "");
  const quantity = Math.min(100, Math.max(1, integer(formData.get("quantity"), 1)));
  const db = getDb();
  let failure: "stock" | "broke" | null = null;
  let redeemed: { name: string; cost: number; quantity: number } | null = null;

  db.exec("BEGIN");
  try {
    const goodie = db.prepare("SELECT * FROM goodies WHERE id = ? AND active = 1").get(goodieId) as
      | { id: string; name: string; cost: number; stock: number }
      | undefined;
    const current = db.prepare("SELECT dollars FROM users WHERE id = ?").get(user.id) as
      | { dollars: number }
      | undefined;
    const totalCost = goodie ? goodie.cost * quantity : 0;

    if (!goodie || !current || goodie.stock < quantity) failure = "stock";
    else if (current.dollars < totalCost) failure = "broke";
    else {
      const spent = db
        .prepare("UPDATE users SET dollars = dollars - ? WHERE id = ? AND dollars >= ?")
        .run(totalCost, user.id, totalCost);
      const taken = db
        .prepare("UPDATE goodies SET stock = stock - ? WHERE id = ? AND stock >= ?")
        .run(quantity, goodie.id, quantity);
      if (!spent.changes || !taken.changes) failure = "stock";
      else {
        db.prepare(
          `INSERT INTO redemptions (id, user_id, goodie_id, goodie_name, cost, quantity, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, 'claimed', ?)`,
        ).run(randomUUID(), user.id, goodie.id, goodie.name, goodie.cost, quantity, new Date().toISOString());
        redeemed = { name: goodie.name, cost: goodie.cost, quantity };
        db.exec("COMMIT");
      }
    }
    if (failure) db.exec("ROLLBACK");
  } catch (error) {
    try {
      db.exec("ROLLBACK");
    } catch {
      /* no open transaction */
    }
    throw error;
  }

  if (failure || !redeemed) redirect(`/redeem?error=${failure ?? "stock"}`);
  writeLedger({
    userId: user.id,
    kind: "dollars",
    delta: -redeemed.cost * redeemed.quantity,
    note: `Redeemed ${redeemed.quantity}x ${redeemed.name}`,
    actorId: user.id,
  });
  touch();
  redirect("/redeem?notice=redeemed");
}

export async function refundRedemption(formData: FormData) {
  const admin = await requireAdmin();
  const redemptionId = String(formData.get("redemptionId") || "");
  const db = getDb();
  const redemption = db
    .prepare("SELECT * FROM redemptions WHERE id = ?")
    .get(redemptionId) as
    | { id: string; user_id: string; goodie_id: string; goodie_name: string; cost: number; quantity: number; status: string }
    | undefined;

  if (!redemption || redemption.status !== "claimed") redirect("/admin/goodies?error=missing");

  const quantity = redemption.quantity || 1;
  const refundAmount = redemption.cost * quantity;

  db.exec("BEGIN");
  try {
    db.prepare("UPDATE users SET dollars = dollars + ? WHERE id = ?").run(refundAmount, redemption.user_id);
    db.prepare("UPDATE goodies SET stock = stock + ? WHERE id = ?").run(quantity, redemption.goodie_id);
    db.prepare("UPDATE redemptions SET status = 'refunded' WHERE id = ?").run(redemption.id);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  writeLedger({
    userId: redemption.user_id,
    kind: "dollars",
    delta: refundAmount,
    note: `Refunded ${quantity}x ${redemption.goodie_name}`,
    actorId: admin.id,
  });
  touch();
  redirect("/admin/goodies?notice=refunded");
}

async function studentOrRedirect(userId: string): Promise<UserRow> {
  const user = getUserById(userId);
  if (!user || user.role !== "user") redirect("/admin/students?error=missing");
  return user;
}

export async function addScore(formData: FormData) {
  const admin = await requireAdmin();
  const user = await studentOrRedirect(String(formData.get("userId") || ""));
  const kind = String(formData.get("kind") || "");
  const delta = integer(formData.get("delta"));
  if ((kind !== "points" && kind !== "dollars") || delta === 0 || Math.abs(delta) > 100000) {
    redirect(safeReturn(formData.get("returnTo"), "/admin/students") + "?error=invalid");
  }

  const column = kind === "points" ? "points" : "dollars";
  const current = kind === "points" ? user.points : user.dollars;
  const next = Math.max(0, current + delta);
  const applied = next - current;
  getDb().prepare(`UPDATE users SET ${column} = ? WHERE id = ?`).run(next, user.id);
  writeLedger({
    userId: user.id,
    kind,
    delta: applied,
    note: `${applied > 0 ? "Added" : "Removed"} ${Math.abs(applied)} ${kind === "points" ? "points" : "Sapien Dollars"}`,
    actorId: admin.id,
  });
  touch();
  revalidatePath(`/admin/students/${user.id}`);
  revalidatePath(`/card/${user.slug}`);
  redirect(safeReturn(formData.get("returnTo"), "/admin/students"));
}

export async function saveStudent(formData: FormData) {
  const admin = await requireAdmin();
  const user = await studentOrRedirect(String(formData.get("userId") || ""));
  const task = String(formData.get("task") || "").trim().slice(0, 500);
  const secretTask = String(formData.get("secretTask") || "").trim().slice(0, 500);
  const college = clampText(String(formData.get("college") || ""), 120);
  const phoneRaw = String(formData.get("phone") || "").trim();
  const nextPhoneKey = phoneRaw ? phoneKey(phoneRaw) : "";
  if (phoneRaw && !/^\d{10}$/.test(nextPhoneKey)) {
    redirect(`/admin/students/${user.id}?error=invalid`);
  }
  if (nextPhoneKey) {
    const clash = getDb().prepare("SELECT id FROM users WHERE phone_key = ? AND id != ?").get(nextPhoneKey, user.id);
    if (clash) redirect(`/admin/students/${user.id}?error=duplicate`);
  }
  const points = Math.max(0, Math.min(1_000_000, integer(formData.get("points"), user.points)));
  const dollars = Math.max(0, Math.min(1_000_000, integer(formData.get("dollars"), user.dollars)));
  const genderRaw = String(formData.get("gender") || "");
  const gender = genderLabel(genderRaw);
  if (genderRaw.trim() && !gender) redirect(`/admin/students/${user.id}?error=invalid`);
  const teamValue = String(formData.get("teamId") || "");
  const teamId = teamValue || null;

  if (teamId) {
    const team = getDb().prepare("SELECT id FROM teams WHERE id = ?").get(teamId);
    if (!team) redirect(`/admin/students/${user.id}?error=invalid`);
  }

  getDb()
    .prepare(
      `UPDATE users
       SET task = ?, secret_task = ?, college = ?, gender = ?, points = ?, dollars = ?, team_id = ?, phone = ?, phone_key = ?
       WHERE id = ?`,
    )
    .run(task, secretTask, college, gender, points, dollars, teamId, phoneRaw, nextPhoneKey, user.id);

  if (points !== user.points) {
    writeLedger({
      userId: user.id,
      kind: "points",
      delta: points - user.points,
      note: `Points set to ${points}`,
      actorId: admin.id,
    });
  }
  if (dollars !== user.dollars) {
    writeLedger({
      userId: user.id,
      kind: "dollars",
      delta: dollars - user.dollars,
      note: `Sapien Dollars set to ${dollars}`,
      actorId: admin.id,
    });
  }

  touch();
  revalidatePath(`/admin/students/${user.id}`);
  revalidatePath(`/card/${user.slug}`);
  redirect(`/admin/students/${user.id}?notice=saved`);
}

export async function setGender(formData: FormData) {
  await requireAdmin();
  const user = await studentOrRedirect(String(formData.get("userId") || ""));
  const genderRaw = String(formData.get("gender") || "");
  const gender = genderLabel(genderRaw);
  if (genderRaw.trim() && !gender) redirect(safeReturn(formData.get("returnTo"), `/admin/students/${user.id}?error=invalid`));
  getDb().prepare("UPDATE users SET gender = ? WHERE id = ? AND role = 'user'").run(gender, user.id);
  touch();
  revalidatePath(`/admin/students/${user.id}`);
  revalidatePath(`/card/${user.slug}`);
  redirect(safeReturn(formData.get("returnTo"), `/admin/students/${user.id}`));
}

export async function removeFromTeam(userId: string, _formData: FormData) {
  const admin = await requireAdmin();
  const user = await studentOrRedirect(userId);
  getDb().prepare("UPDATE users SET team_id = NULL WHERE id = ? AND role = 'user'").run(user.id);
  writeLedger({
    userId: user.id,
    kind: "team",
    delta: 0,
    note: "Removed from team",
    actorId: admin.id,
  });
  touch();
  redirect("/admin/teams?notice=removed");
}

export async function assignTeam(formData: FormData) {
  const admin = await requireAdmin();
  const user = await studentOrRedirect(String(formData.get("userId") || ""));
  const teamValue = String(formData.get("teamId") || "");
  const teamId = teamValue || null;
  if (teamId) {
    const team = getDb().prepare("SELECT id, name FROM teams WHERE id = ?").get(teamId) as
      | { id: string; name: string }
      | undefined;
    if (!team) redirect(safeReturn(formData.get("returnTo"), "/admin/students"));
    getDb().prepare("UPDATE users SET team_id = ? WHERE id = ?").run(team.id, user.id);
    writeLedger({
      userId: user.id,
      teamId: team.id,
      kind: "team",
      delta: 0,
      note: `Moved to ${team.name}`,
      actorId: admin.id,
    });
  } else {
    getDb().prepare("UPDATE users SET team_id = NULL WHERE id = ?").run(user.id);
    writeLedger({
      userId: user.id,
      kind: "team",
      delta: 0,
      note: "Removed from team",
      actorId: admin.id,
    });
  }
  touch();
  redirect(safeReturn(formData.get("returnTo"), "/admin/students"));
}

export async function bulkApply(formData: FormData) {
  const admin = await requireAdmin();
  const scope = String(formData.get("scope") || "all");
  const kind = String(formData.get("kind") || "");
  const overwrite = formData.get("overwrite") === "on";
  const text = String(formData.get("text") || "").trim().slice(0, 500);
  const amount = integer(formData.get("amount"));

  let where = "role = 'user'";
  const params: Array<string | number> = [];
  if (scope === "unassigned") where += " AND team_id IS NULL";
  else if (scope !== "all") {
    where += " AND team_id = ?";
    params.push(scope);
  }

  const db = getDb();
  if (kind === "task" || kind === "secret") {
    if (!text) redirect("/admin/students?error=invalid");
    const column = kind === "task" ? "task" : "secret_task";
    const empty = overwrite ? "" : ` AND ${column} = ''`;
    db.prepare(`UPDATE users SET ${column} = ? WHERE ${where}${empty}`).run(text, ...params);
    writeLedger({
      kind,
      delta: 0,
      note: overwrite ? `Overwrote ${kind} for a group` : `Filled empty ${kind} for a group`,
      actorId: admin.id,
    });
  } else if (kind === "points" || kind === "dollars") {
    if (amount === 0 || Math.abs(amount) > 100000) redirect("/admin/students?error=invalid");
    const column = kind === "points" ? "points" : "dollars";
    db.prepare(`UPDATE users SET ${column} = MAX(0, ${column} + ?) WHERE ${where}`).run(amount, ...params);
    writeLedger({
      kind,
      delta: amount,
      note: `Bulk ${amount > 0 ? "added" : "removed"} ${Math.abs(amount)} ${kind}`,
      actorId: admin.id,
    });
  } else {
    redirect("/admin/students?error=invalid");
  }

  touch();
  redirect("/admin/students?notice=applied");
}

export async function createWalkIn(formData: FormData) {
  await requireAdmin();
  const name = cleanName(String(formData.get("name") || ""));
  const phone = String(formData.get("phone") || "");
  const college = clampText(String(formData.get("college") || ""), 120);
  const key = phoneKey(phone);
  if (name.length < 2 || !/^\d{10}$/.test(key)) redirect("/admin/students?error=invalid");

  const existing = getDb().prepare("SELECT id FROM users WHERE phone_key = ?").get(key);
  if (existing) redirect("/admin/students?error=duplicate");

  const id = `walk-${randomUUID().slice(0, 8)}`;
  getDb()
    .prepare(
      `INSERT INTO users (
        id, guest_id, name, name_key, email, phone, phone_key, college, year, occupation,
        role, points, dollars, team_id, task, secret_task, linkedin, instagram, github,
        portfolio, bio, slug, approval_status, heard_from, signals, created_at
      ) VALUES (?, NULL, ?, ?, '', ?, ?, ?, '', 'Student', 'user', 0, 0, NULL, '', '', '', '', '', '', '', ?, 'walk-in', '', '[]', ?)`,
    )
    .run(id, name, normName(name), phone.trim(), key, college, id, new Date().toISOString());

  touch();
  redirect(`/admin/students/${id}?notice=walkin`);
}

export async function addPeopleToTeam(formData: FormData) {
  const admin = await requireAdmin();
  const teamId = String(formData.get("teamId") || "");
  const ids = [...new Set(formData.getAll("userId").map((value) => String(value)).filter(Boolean))].slice(0, 500);
  const team = getDb().prepare("SELECT id, name FROM teams WHERE id = ?").get(teamId) as
    | { id: string; name: string }
    | undefined;
  if (!team || ids.length === 0) redirect("/admin/teams?error=roster");

  const update = getDb().prepare("UPDATE users SET team_id = ? WHERE id = ? AND role = 'user'");
  let added = 0;
  const db = getDb();
  db.exec("BEGIN");
  try {
    for (const id of ids) {
      const result = update.run(team.id, id);
      if (!result.changes) continue;
      added += 1;
      writeLedger({
        userId: id,
        teamId: team.id,
        kind: "team",
        delta: 0,
        note: `Moved to ${team.name}`,
        actorId: admin.id,
      });
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  touch();
  redirect(`/admin/teams?notice=roster&added=${added}&skipped=${ids.length - added}`);
}

function csvColumn(row: Record<string, string>, parts: string[], avoid: string[] = []): string {
  const keys = Object.keys(row).filter((key) => !avoid.some((word) => key.toLowerCase().includes(word)));
  const exact = keys.find((key) => parts.includes(key.trim().toLowerCase()));
  const fuzzy = keys.find((key) => parts.some((part) => key.toLowerCase().includes(part)));
  const key = exact ?? fuzzy;
  return key ? row[key].trim() : "";
}

export async function assignTeamsFromCsv(formData: FormData) {
  const admin = await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0 || file.size > 1_000_000) redirect("/admin/teams?error=roster");
  const records = parseCsv(await file.text()).slice(0, 2000);
  const headers = Object.keys(records[0] ?? {});
  const hasName = headers.some((key) => key.toLowerCase().includes("name") && !key.toLowerCase().includes("team"));
  const hasTeam = headers.some((key) => key.toLowerCase().includes("team"));
  if (!records.length || !hasName || !hasTeam) redirect("/admin/teams?error=roster");

  const db = getDb();
  const teams = db.prepare("SELECT id, name FROM teams").all() as { id: string; name: string }[];
  const teamByName = new Map(teams.map((team) => [normName(team.name), team]));
  const update = db.prepare("UPDATE users SET team_id = ? WHERE id = ? AND role = 'user'");
  let added = 0;
  let skipped = 0;

  db.exec("BEGIN");
  try {
    for (const record of records) {
      const teamName = csvColumn(record, ["team"]);
      const team = teamByName.get(normName(teamName));
      const personId = team ? matchRosterPerson(db, record) : null;
      if (!team || !personId) {
        skipped += 1;
        continue;
      }
      const result = update.run(team.id, personId);
      if (!result.changes) {
        skipped += 1;
        continue;
      }
      const gender = genderLabel(csvColumn(record, ["gender"], ["team"]));
      if (gender) db.prepare("UPDATE users SET gender = ? WHERE id = ?").run(gender, personId);
      added += 1;
      writeLedger({
        userId: personId,
        teamId: team.id,
        kind: "team",
        delta: 0,
        note: `Moved to ${team.name}`,
        actorId: admin.id,
      });
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  touch();
  redirect(`/admin/teams?notice=roster&added=${added}&skipped=${skipped}`);
}

function matchRosterPerson(db: ReturnType<typeof getDb>, record: Record<string, string>): string | null {
  const guestId = csvColumn(record, ["guest_id", "guest id", "guest"]);
  if (guestId) {
    const row = db
      .prepare("SELECT id FROM users WHERE role = 'user' AND (guest_id = ? OR id = ?)")
      .get(guestId, guestId) as { id: string } | undefined;
    return row?.id ?? null;
  }

  const phone = csvColumn(record, ["phone"]);
  if (phone) {
    const key = phoneKey(phone);
    const rows = db.prepare("SELECT id FROM users WHERE role = 'user' AND phone_key = ?").all(key) as { id: string }[];
    return rows.length === 1 ? rows[0].id : null;
  }

  const typed = normName(csvColumn(record, ["name"], ["team"]));
  if (typed.length < 2) return null;
  const rows = db.prepare("SELECT id FROM users WHERE role = 'user' AND name_key = ?").all(typed) as { id: string }[];
  return rows.length === 1 ? rows[0].id : null;
}

export async function saveTeam(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("teamId") || "");
  const name = clampText(String(formData.get("name") || ""), 40);
  const motto = clampText(String(formData.get("motto") || ""), 120);
  const color = String(formData.get("color") || "butter");
  const bonus = formData.has("bonus")
    ? Math.max(-1_000_000, Math.min(1_000_000, integer(formData.get("bonus"))))
    : 0;
  if (!name) redirect("/admin/teams?error=invalid");

  if (!id) {
    const teamId = randomUUID();
    getDb()
      .prepare(
        "INSERT INTO teams (id, name, motto, color, bonus_points, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .run(teamId, name, motto, color, bonus, new Date().toISOString());
  } else {
    const current = getDb().prepare("SELECT id FROM teams WHERE id = ?").get(id);
    if (!current) redirect("/admin/teams?error=missing");
    getDb().prepare("UPDATE teams SET name = ?, motto = ?, color = ? WHERE id = ?").run(name, motto, color, id);
  }

  touch();
  redirect("/admin/teams?notice=team");
}

export async function adjustTeamPoints(teamId: string, delta: number, _formData: FormData) {
  const admin = await requireAdmin();
  if (!teamId || delta === 0 || Math.abs(delta) > 100000) redirect("/admin/teams?error=invalid");

  const team = getDb().prepare("SELECT id, name, bonus_points FROM teams WHERE id = ?").get(teamId) as
    | { id: string; name: string; bonus_points: number }
    | undefined;
  if (!team) redirect("/admin/teams?error=missing");

  const next = Math.max(-1_000_000, Math.min(1_000_000, team.bonus_points + delta));
  getDb().prepare("UPDATE teams SET bonus_points = ? WHERE id = ?").run(next, team.id);
  writeLedger({
    teamId: team.id,
    kind: "team-bonus",
    delta: next - team.bonus_points,
    note: `${team.name} ${delta > 0 ? "gained" : "lost"} ${Math.abs(next - team.bonus_points)} team points`,
    actorId: admin.id,
  });
  touch();
  redirect("/admin/teams?notice=points");
}

export async function saveSecretTask(formData: FormData) {
  const admin = await requireAdmin();
  const user = await studentOrRedirect(String(formData.get("userId") || ""));
  const secret = String(formData.get("secretTask") || "").trim().slice(0, 500);
  getDb().prepare("UPDATE users SET secret_task = ? WHERE id = ?").run(secret, user.id);
  writeLedger({
    userId: user.id,
    kind: "secret",
    delta: 0,
    note: secret ? "Secret task assigned" : "Secret task cleared",
    actorId: admin.id,
  });
  touch();
  revalidatePath(`/admin/students/${user.id}`);
  redirect(safeReturn(formData.get("returnTo"), `/admin/students/${user.id}`));
}

export async function deleteTeam(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("teamId") || "");
  getDb().prepare("DELETE FROM teams WHERE id = ?").run(id);
  touch();
  redirect("/admin/teams?notice=team");
}

export async function saveGoodie(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("goodieId") || "");
  const name = clampText(String(formData.get("name") || ""), 60);
  const description = clampText(String(formData.get("description") || ""), 180);
  const cost = Math.max(0, Math.min(1_000_000, integer(formData.get("cost"))));
  const stock = Math.max(0, Math.min(1_000_000, integer(formData.get("stock"))));
  const active = formData.get("active") === "on" ? 1 : 0;
  if (!name) redirect("/admin/goodies?error=invalid");

  if (!id) {
    getDb()
      .prepare("INSERT INTO goodies (id, name, description, cost, stock, active) VALUES (?, ?, ?, ?, ?, ?)")
      .run(randomUUID(), name, description, cost, stock, active);
  } else {
    getDb()
      .prepare("UPDATE goodies SET name = ?, description = ?, cost = ?, stock = ?, active = ? WHERE id = ?")
      .run(name, description, cost, stock, active, id);
  }
  touch();
  redirect("/admin/goodies?notice=goodie");
}

export async function connectWithUser(formData: FormData) {
  const user = await requireUser();
  const targetId = String(formData.get("targetId") || "");
  const returnTo = safeReturn(formData.get("returnTo"), "/");
  if (user.role !== "user" || !targetId || targetId === user.id) redirect(returnTo);
  const target = getUserById(targetId);
  if (!target || target.role !== "user") redirect(returnTo);
  recordConnection(user.id, targetId);
  revalidatePath(returnTo);
  revalidatePath("/dashboard");
  redirect(returnTo);
}
