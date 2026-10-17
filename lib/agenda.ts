export type AgendaMentor = {
  id: string;
  name: string;
  photo: string;
  role: string;
  about: string;
  topics: string[];
  linkedin: string;
};

export type AgendaSession = {
  id: string;
  title: string;
  host: string;
  photo?: string;
  linkedin: string;
  detail: string;
  expect: string;
  start: string;
  end: string;
  mentors?: AgendaMentor[];
};

export const AGENDA: AgendaSession[] = [
  {
    id: "welcome",
    title: "Welcome & Audience Engagement",
    host: "",
    linkedin: "",
    detail: "",
    expect: "The day starts here. You meet the room, hear how Class 101 runs, and get into the first conversation before the sessions begin.",
    start: "2026-10-18T09:00:00+05:30",
    end: "2026-10-18T09:30:00+05:30",
  },
  {
    id: "product",
    title: "Behind the Festive Season Sales",
    host: "Arthi",
    photo: "/speakers/arthi.jpg",
    linkedin: "",
    detail: "The Art of Making You Want It",
    expect: "Arthi's talk on how festive-season sales are built to make you want something. You'll see the offers, the timing, and the feeling that you should buy it now.",
    start: "2026-10-18T09:30:00+05:30",
    end: "2026-10-18T10:00:00+05:30",
  },
  {
    id: "notion",
    title: "Notion Workshop",
    host: "Reshma G V",
    linkedin: "",
    detail: "",
    expect: "Reshma G V runs a hands-on Notion workshop. You'll set up a workspace you can keep using for college, notes, and projects.",
    start: "2026-10-18T10:00:00+05:30",
    end: "2026-10-18T10:45:00+05:30",
  },
  {
    id: "break",
    title: "Refreshment Break",
    host: "",
    linkedin: "",
    detail: "",
    expect: "A short pause. Grab something, talk to the people around you, and be back in your seat for the quiz.",
    start: "2026-10-18T10:45:00+05:30",
    end: "2026-10-18T11:00:00+05:30",
  },
  {
    id: "quiz",
    title: "Team Quiz & Fun Activity",
    host: "",
    linkedin: "",
    detail: "",
    expect: "Stay with your team. You'll play a quiz and a short game together. The point is to know the people on your team, not to sit this one out.",
    start: "2026-10-18T11:00:00+05:30",
    end: "2026-10-18T11:30:00+05:30",
  },
  {
    id: "stalls",
    title: "Domain Mentoring Stalls",
    host: "",
    linkedin: "",
    detail:
      "Explore domain stalls based on your interests, connect with domain mentors, and discover learning paths, career opportunities, and the skills you can start building today.",
    expect:
      "Five mentors run stalls at the same time. You can move between them. Each stall is a different domain, so pick the questions you actually want answered.",
    mentors: [
      {
        id: "pavithran",
        name: "Pavithran M",
        photo: "/mentors/pavithran.jpg",
        role: "SIH '25 Winner · IEEE SIGHT Recipient",
        about:
          "ECE student at Sri Sairam Engineering College, Chennai, graduating in 2027. Secretary of the college IEEE student branch, Chair of its IEEE Industrial Electronics Society chapter, and an IEEE Region 10 ambassador. He won Smart India Hackathon 2025 and represented his chapter in Brazil this August on an IEEE travel grant.",
        topics: ["Hackathons", "IEEE funding"],
        linkedin: "",
      },
      {
        id: "usha",
        name: "Usha Jawaharlal",
        photo: "/mentors/usha.jpg",
        role: "Data Scientist, YaaraLabs.ai",
        about:
          "Data Scientist at YaaraLabs.ai in Chennai, working on generative AI, LLMs, and agentic AI. She did her M.Sc. in Data Science at SASTRA with Distinction and recently spoke at the D3 Meetup.",
        topics: ["Data analytics"],
        linkedin: "",
      },
      {
        id: "yogalakshmi",
        name: "Yogalakshmi Priya S T",
        photo: "/mentors/yogalakshmi.jpg",
        role: "Principal Mobile Architect, Cognizant",
        about:
          "Principal Mobile Architect at Cognizant in Chennai, with about 15 years in Android, React Native, and React. She mentors engineers, leads RFPs as a solution architect, and is looking toward a Director of Engineering role. She stood out in the Naana Neeya AI debate at Google I/O Extended Chennai 2026, arguing for skills first and AI second.",
        topics: ["Mobile engineering"],
        linkedin: "",
      },
      {
        id: "chandrasekar",
        name: "Chandrasekar Jayapalan",
        photo: "/mentors/chandrasekar.jpg",
        role: "Founder, Namma Kuppai · Co-founder, Chennai Marketers & Founders",
        about:
          "Chennai-based marketer and go-to-market operator with about 12 years of experience. Founder of the civic-tech platform Namma Kuppai, co-founder of Chennai Marketers & Founders, and formerly Marketing Lead at Sensiple. His work covers product marketing, demand generation, brand campaigns, and sales enablement across B2B SaaS and consumer brands. He also runs 101 Inspiring People, a passion project with more than 150 interviews.",
        topics: ["AI"],
        linkedin: "",
      },
      {
        id: "musha",
        name: "Musha Ahamed R Y",
        photo: "/mentors/musha.png",
        role: "Indie founder, RedChecker",
        about:
          "Chennai-based indie founder and builder. He created RedChecker (redchecker.io), a Chrome extension that checks a subreddit's rules, tone, and risk before you post, and suggests related communities and trending topics. He launched it in July 2025 with Gowtham Raj and builds in public on X and Indie Hackers. He has been in business since age 15, through dropshipping, e-commerce, and digital marketing for brands.",
        topics: ["Marketing"],
        linkedin: "",
      },
    ],
    start: "2026-10-18T11:30:00+05:30",
    end: "2026-10-18T13:30:00+05:30",
  },
  {
    id: "close",
    title: "Closing Notes & Group Photo",
    host: "",
    linkedin: "",
    detail: "",
    expect: "The day ends with a few closing notes and one photo of everyone. Stay for this. It is the last thing on the agenda.",
    start: "2026-10-18T13:30:00+05:30",
    end: "2026-10-18T14:00:00+05:30",
  },
];

export type Stall = { id: string; name: string; topic: string };

export function stallList(): Stall[] {
  const session = AGENDA.find((item) => item.id === "stalls");
  return (session?.mentors ?? []).map((mentor) => ({
    id: mentor.id,
    name: mentor.name,
    topic: mentor.topics[0] || mentor.name,
  }));
}

export function stallLabel(id: string): string {
  const stall = stallList().find((item) => item.id === id);
  return stall ? `${stall.topic} · ${stall.name}` : "";
}

const ZONE = "Asia/Kolkata";

export type SessionState = "done" | "now" | "next" | "later";

export function sessionState(session: AgendaSession, now: number, nextId: string | null): SessionState {
  const start = Date.parse(session.start);
  const end = Date.parse(session.end);
  if (now >= end) return "done";
  if (now >= start && now < end) return "now";
  if (session.id === nextId) return "next";
  return "later";
}

export function nextSessionId(now: number): string | null {
  const upcoming = AGENDA.find((session) => Date.parse(session.start) > now);
  return upcoming?.id ?? null;
}

export function currentSession(now: number): AgendaSession | null {
  return AGENDA.find((session) => now >= Date.parse(session.start) && now < Date.parse(session.end)) ?? null;
}

export function clockTime(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: ZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(Date.parse(iso));
}

export function timeLines(startIso: string, endIso: string): string[] {
  const parts = (iso: string) =>
    new Intl.DateTimeFormat("en-US", {
      timeZone: ZONE,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).formatToParts(Date.parse(iso));
  const bit = (list: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPart["type"]) =>
    list.find((part) => part.type === type)?.value ?? "";
  const start = parts(startIso);
  const end = parts(endIso);
  const startPeriod = bit(start, "dayPeriod").toUpperCase();
  const endPeriod = bit(end, "dayPeriod").toUpperCase();
  const startClock = `${bit(start, "hour")}:${bit(start, "minute")}`;
  const endClock = `${bit(end, "hour")}:${bit(end, "minute")}`;
  if (startPeriod === endPeriod) return [`${startClock} – ${endClock} ${endPeriod}`];
  return [`${startClock} ${startPeriod} –`, `${endClock} ${endPeriod}`];
}

export function minutesLeft(endIso: string, now: number): number {
  return Math.max(0, Math.ceil((Date.parse(endIso) - now) / 60000));
}

export function agendaHeadline(now: number): { label: string; title: string; detail: string } {
  const current = currentSession(now);
  if (current) {
    const left = minutesLeft(current.end, now);
    return {
      label: "Happening now",
      title: current.title,
      detail: left <= 1 ? "Ending now" : `${left} min left · until ${clockTime(current.end)}`,
    };
  }
  const first = AGENDA[0];
  const last = AGENDA[AGENDA.length - 1];
  if (now < Date.parse(first.start)) {
    return {
      label: "Up next",
      title: first.title,
      detail: `Starts ${clockTime(first.start)} · Sunday, 18 October`,
    };
  }
  if (now >= Date.parse(last.end)) {
    return {
      label: "Done",
      title: "That's the day.",
      detail: "Every session on the agenda has finished.",
    };
  }
  const upcoming = AGENDA.find((session) => Date.parse(session.start) > now);
  return {
    label: "Up next",
    title: upcoming?.title ?? "Agenda",
    detail: upcoming ? `Starts ${clockTime(upcoming.start)}` : "",
  };
}

export function msUntilBoundary(now: number): number {
  const marks = AGENDA.flatMap((session) => [Date.parse(session.start), Date.parse(session.end)]);
  const next = marks.filter((mark) => mark > now).sort((a, b) => a - b)[0];
  if (!next) return 30_000;
  return Math.min(Math.max(next - now + 250, 1000), 30_000);
}
