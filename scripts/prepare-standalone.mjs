import { cp, mkdir } from "node:fs/promises";

// Next.js standalone output intentionally excludes public/ and .next/static.
// The standalone Node server needs both directories beside its server.js.
const standalone = ".next/standalone";
await mkdir(`${standalone}/.next`, { recursive: true });
await cp(".next/static", `${standalone}/.next/static`, { recursive: true, force: true });
await cp("public", `${standalone}/public`, { recursive: true, force: true });
