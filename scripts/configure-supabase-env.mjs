import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const root = resolve(import.meta.dirname, "..");
const defaults = {
  apiBaseUrl: "http://localhost:3000/api",
  supabaseUrl: "https://tswdzhymcanjpkglwxei.supabase.co",
  publishableKey: "sb_publishable_uJfgdnG9u7mhWytz12OrAQ_vcVgN0e7",
  projectId: "tswdzhymcanjpkglwxei",
};

const rl = createInterface({ input, output });

async function ask(label, fallback) {
  const suffix = fallback ? ` [${fallback}]` : "";
  const value = await rl.question(`${label}${suffix}: `);
  return value.trim() || fallback;
}

try {
  console.log("Configure Supabase environment");
  console.log("Leave a prompt blank to use the value shown in brackets.");
  console.log("");

  const apiBaseUrl = await ask("API base URL", defaults.apiBaseUrl);
  const supabaseUrl = await ask("Supabase URL", defaults.supabaseUrl);
  const publishableKey = await ask("Supabase publishable key", defaults.publishableKey);
  const projectId = await ask("Supabase project ID", defaults.projectId);
  const secretKey = await ask("Supabase secret key or legacy service_role key", "");

  if (!secretKey) {
    console.error("");
    console.error("Missing server key. Add the secret key before running the API against Supabase.");
    process.exit(1);
  }

  const clientEnv = [
    `EXPO_PUBLIC_API_BASE_URL=${apiBaseUrl}`,
    `EXPO_PUBLIC_SUPABASE_URL=${supabaseUrl}`,
    `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${publishableKey}`,
    "",
  ].join("\n");

  const serverKeyName = secretKey.startsWith("sb_secret_")
    ? "SUPABASE_SECRET_KEY"
    : "SUPABASE_SERVICE_ROLE_KEY";
  const serverEnv = [
    `SUPABASE_URL=${supabaseUrl}`,
    `${serverKeyName}=${secretKey}`,
    `SUPABASE_PROJECT_ID=${projectId}`,
    "",
  ].join("\n");

  const clientPath = resolve(root, ".env.local");
  const serverPath = resolve(root, "apps/api/.env.local");

  mkdirSync(dirname(serverPath), { recursive: true });
  writeFileSync(clientPath, clientEnv);
  writeFileSync(serverPath, serverEnv);

  console.log("");
  console.log(`Wrote ${clientPath}`);
  console.log(`Wrote ${serverPath}`);
  console.log("");
  console.log("Next: npm run supabase:env");
} finally {
  rl.close();
}
