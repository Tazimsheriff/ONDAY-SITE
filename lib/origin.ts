import { headers } from "next/headers";

export async function requestOrigin(): Promise<string> {
  const configured = process.env.APP_ORIGIN;
  if (configured) {
    let url: URL;
    try {
      url = new URL(configured);
    } catch (error) {
      throw new Error(`Invalid APP_ORIGIN: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("APP_ORIGIN must use http or https protocol");
    }
    if (url.username || url.password) {
      throw new Error("APP_ORIGIN must not include credentials");
    }
    if (url.pathname.replace(/\/$/, "") !== "" || url.search || url.hash) {
      throw new Error("APP_ORIGIN must be a bare origin without path, query, or hash");
    }
    if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
      throw new Error("APP_ORIGIN must use https in production");
    }
    return url.origin;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("APP_ORIGIN must be configured in production. Set the APP_ORIGIN environment variable.");
  }
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";
  const forwarded = headerList.get("x-forwarded-proto");
  const proto = forwarded ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}
