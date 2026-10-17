export function normName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function phoneKey(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length >= 10) return digits.slice(-10);
  return value.trim().toLowerCase();
}

export function formatPhone(key: string): string {
  if (/^\d{10}$/.test(key)) return `+91 ${key.slice(0, 5)} ${key.slice(5)}`;
  return key;
}

export function cleanName(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function clampText(value: string, max: number): string {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

export function safeReturn(value: FormDataEntryValue | null, fallback: string): string {
  const to = String(value ?? "");
  if (!to.startsWith("/") || to.startsWith("//") || to.includes("\\")) return fallback;
  return to;
}

export function hrefFor(
  kind: "linkedin" | "instagram" | "github" | "web" | "discord",
  raw: string,
): string | null {
  const value = raw.trim();
  if (!value) return null;
  if (/^javascript:/i.test(value)) return null;

  if (kind === "web") {
    if (/^https?:\/\//i.test(value)) return value;
    return null;
  }

  if (kind === "discord") {
    if (/^https?:\/\//i.test(value)) return value;
    if (/^(www\.)?discord\.(gg|com)\//i.test(value)) return `https://${value.replace(/^www\./i, "")}`;
    const handle = value.replace(/^@/, "").replace(/^\/+/, "");
    if (/^\d{17,20}$/.test(handle)) return `https://discord.com/users/${handle}`;
    return null;
  }

  if (/^https?:\/\//i.test(value)) return value;

  const handle = value.replace(/^@/, "").replace(/^\/+/, "");
  if (!handle || /[\s<>]/.test(handle)) return null;

  if (kind === "instagram") return `https://instagram.com/${encodeURIComponent(handle)}`;
  if (kind === "github") return `https://github.com/${encodeURIComponent(handle.replace(/^github.com\//i, ""))}`;
  if (value.startsWith("linkedin.com") || value.startsWith("www.linkedin.com")) {
    return `https://${value}`;
  }
  return `https://www.linkedin.com/in/${encodeURIComponent(handle)}`;
}

export function discordHandle(raw: string): string {
  return raw.trim().replace(/^@/, "");
}

export function parseSignals(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  } catch {
    return [];
  }
}

export function integer(value: FormDataEntryValue | null, fallback = 0): number {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
}

export const TEAM_COLORS = {
  mint: "#d2ffb6",
  sky: "#b6eaff",
  lilac: "#e3b6ff",
  butter: "#ffd966",
  peach: "#ffc0b6",
  violet: "#9191ff",
} as const;

export type TeamColor = keyof typeof TEAM_COLORS;

export function teamColor(color: string): string {
  if (color in TEAM_COLORS) return TEAM_COLORS[color as TeamColor];
  return TEAM_COLORS.butter;
}

const FLASH: Record<string, string> = {
  mismatch: "That name and phone aren't on the list. Use the ones from your Luma registration.",
  unavailable: "Sign-in didn't go through. Try once more.",
  saved: "Saved.",
  profile: "Profile saved. Your QR is ready.",
  redeemed: "Redeemed. Show this to the organizers when you collect it.",
  broke: "Not enough Sapien Dollars for that.",
  stock: "That goodie is already gone.",
  awarded: "Updated.",
  walkin: "Walk-in added. Their password is the phone number you entered.",
  duplicate: "That phone number is already on the list.",
  invalid: "Need a name and a 10-digit phone number.",
  refunded: "Redemption refunded. Dollars and stock are back.",
  applied: "Applied to the matching Sapiens.",
  missing: "Couldn't find that Sapien.",
  team: "Team saved.",
  points: "Team points updated.",
  secret: "Secret task saved.",
  goodie: "Goodie saved.",
};

export function flashText(code?: string): string | null {
  if (!code) return null;
  return FLASH[code] ?? null;
}
