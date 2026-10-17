import { agendaCursor } from "@/lib/db";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ cursor: agendaCursor() });
}
