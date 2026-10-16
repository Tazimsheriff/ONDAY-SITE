import { headers } from "next/headers";

export async function requestOrigin(): Promise<string> {
  const configured = process.env.APP_ORIGIN;
  if (configured) {
    try {
      const url = new URL(configured);
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
    } catch (error) {
      if (error instanceof Error && error.message.includes("APP_ORIGIN")) {
        throw error;
      }
      throw new Error(`Invalid APP_ORIGIN: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("APP_ORIGIN must be configured in production. Set the APP_ORIGIN environment variable.");
  }
  return "http://localhost:3000";
}
