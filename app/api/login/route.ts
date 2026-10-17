import { NextResponse } from "next/server";
import { sessionCookie } from "@/lib/auth";
import { canLogin, findLogin } from "@/lib/db";
import { safeReturn } from "@/lib/format";
import { clientIp, loginBlocked, recordLoginFailure, recordLoginSuccess } from "@/lib/login-limit";

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

  const name = String(form.get("name") || "");
  const phone = String(form.get("phone") || "");
  const ip = clientIp((header) => request.headers.get(header));

  try {
    if (loginBlocked(ip, name)) {
      backSearch.set("error", "slowdown");
      return NextResponse.redirect(publicUrl(request, "/login", backSearch.toString()), 303);
    }

    const user = findLogin(name, phone);
    if (!user || !canLogin(user)) {
      recordLoginFailure(ip, name);
      backSearch.set("error", loginBlocked(ip, name) ? "slowdown" : user ? "unapproved" : "mismatch");
      return NextResponse.redirect(publicUrl(request, "/login", backSearch.toString()), 303);
    }

    recordLoginSuccess(ip, name);
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
