export function appUrl() {
  const url = process.env.APP_URL;
  if (url) return url.replace(/\/$/, "");
  if (process.env.NODE_ENV === "production") throw new Error("APP_URL is required in production");
  return "http://localhost:3002";
}
