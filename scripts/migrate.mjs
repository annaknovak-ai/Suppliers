// Runs Supabase migrations before the build. Skips silently when no database URL is configured.
import { spawnSync } from "node:child_process";

try {
  process.loadEnvFile(".env");
} catch {
  // No local .env file (e.g. on Vercel); rely on the process environment.
}

const dbUrl = process.env.SUPABASE_DB_URL;

if (!dbUrl) {
  console.log("Skipping migrations: SUPABASE_DB_URL not set");
  process.exit(0);
}

const result = spawnSync("npx", ["supabase", "db", "push", "--db-url", dbUrl], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
