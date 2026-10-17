import { headers } from "next/headers";

function configuredOrigin(): string | null {
  const configured = process.env.APP_ORIGIN;
  if (!configured) return null;
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

function originFromRequest(hostHeader: string | null, protoHeader: string | null): string | null {
  const host = (hostHeader ?? "").split(",")[0].trim();
  const hostname = host.split(":")[0].toLowerCase();
  if (!hostname || !hostname.includes(".") || hostname === "localhost" || hostname.endsWith(".localhost")) return null;
  if (hostname === "0.0.0.0" || hostname.startsWith("127.")) return null;
  const forwarded = (protoHeader ?? "").split(",")[0].trim();
  const proto = process.env.NODE_ENV === "production" ? "https" : forwarded === "http" ? "http" : "https";
  return `${proto}://${host}`;
}

export async function requestOrigin(): Promise<string> {
  const headerList = await headers();
  const fromRequest = originFromRequest(
    headerList.get("x-forwarded-host") ?? headerList.get("host"),
    headerList.get("x-forwarded-proto"),
  );
  if (fromRequest) return fromRequest;

  const configured = configuredOrigin();
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") {
    throw new Error("APP_ORIGIN must be configured in production. Set the APP_ORIGIN environment variable.");
  }
  return "http://localhost:3000";
}
