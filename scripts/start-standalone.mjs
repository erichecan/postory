import { existsSync } from "node:fs";
import { config } from "dotenv";

// Standalone Next.js reads process environment directly. Load the local file for
// developer starts; deployed containers receive configuration from the platform.
if (existsSync(".env.local")) config({ path: ".env.local" });

await import("../.next/standalone/server.js");
