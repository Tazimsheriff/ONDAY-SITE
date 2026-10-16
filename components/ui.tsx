import { flashText } from "@/lib/format";

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const tones = {
  ink: "bg-ink text-cream",
  paper: "bg-paper text-ink",
  yellow: "bg-yellow text-ink",
  mint: "bg-mintcard text-ink",
  sky: "bg-sky text-ink",
  lilac: "bg-lilac text-ink",
};

export function btn(tone: keyof typeof tones = "ink", className = "") {
  return cn(
    "press inline-flex items-center justify-center border-[1.6px] border-ink px-4 py-2.5 text-sm font-semibold shadow-[4px_4px_0_#0a0a0a]",
    tones[tone],
    className,
  );
}

export function Card({
  children,
  className,
  color = "#fefcf5",
}: {
  children: React.ReactNode;
  className?: string;
  color?: string;
}) {
  return (
    <section
      className={cn("border-[1.6px] border-ink p-5 shadow-[4px_4px_0_#0a0a0a]", className)}
      style={{ background: color }}
    >
      {children}
    </section>
  );
}

export function Eyebrow({
  children,
  color = "#9191ff",
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <span
      className="inline-block border-[1.6px] border-ink px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] shadow-[2px_2px_0_#0a0a0a]"
      style={{ background: color }}
    >
      {children}
    </span>
  );
}

export function Flash({ error, notice }: { error?: string; notice?: string }) {
  const text = flashText(error) || flashText(notice);
  if (!text) return null;
  return (
    <p
      className="border-[1.6px] border-ink px-4 py-3 text-sm font-semibold shadow-[3px_3px_0_#0a0a0a]"
      style={{ background: error ? "#ffc0b6" : "#d2ffb6" }}
    >
      {text}
    </p>
  );
}

