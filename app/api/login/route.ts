import { NextResponse } from "next/server";
import { sessionCookie } from "@/lib/auth";
import { canLogin, findLogin } from "@/lib/db";
import { safeReturn } from "@/lib/format";

function publicUrl(request: Request, pathname: string, search = ""): URL {
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host") || new URL(request.url).host;
  const proto = (request.headers.get("x-forwarded-proto") || new URL(request.url).protocol.replace(":", ""))
    .split(",")[0]
    .trim();
  const url = new URL(`${proto}://${host}${pathname}`);
  if (search) url.search = search;
  return url;
}

export async function POST(request: Request) {
  const form = await request.formData();
  const next = safeReturn(form.get("next"), "");
  const backSearch = new URLSearchParams();
  if (next) backSearch.set("next", next);

  try {
    const user = findLogin(String(form.get("name") || ""), String(form.get("phone") || ""));
    if (!user) {
      backSearch.set("error", "mismatch");
      return NextResponse.redirect(publicUrl(request, "/login", backSearch.toString()), 303);
    }
    if (!canLogin(user)) {
      backSearch.set("error", "unapproved");
      return NextResponse.redirect(publicUrl(request, "/login", backSearch.toString()), 303);
    }

    const response = NextResponse.redirect(
      publicUrl(request, user.role === "admin" ? "/admin" : next || "/dashboard"),
      303,
    );
    const cookie = sessionCookie(user.id);
    response.cookies.set(cookie.name, cookie.value, cookie.options);
    return response;
  } catch (error) {
    console.error("Login failed", error);
    backSearch.set("error", "unavailable");
    return NextResponse.redirect(publicUrl(request, "/login", backSearch.toString()), 303);
  }
}
