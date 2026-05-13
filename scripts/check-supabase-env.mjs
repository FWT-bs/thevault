import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const clientFiles = [".env", ".env.local"].map((file) => resolve(root, file));
const serverFiles = ["apps/api/.env", "apps/api/.env.local"].map((file) => resolve(root, file));

function parseEnvFile(file) {
  if (!existsSync(file)) return {};

  return readFileSync(file, "utf8")
    .split(/\r?\n/)
    .reduce((env, rawLine) => {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) return env;

      const equalsIndex = line.indexOf("=");
      if (equalsIndex === -1) return env;

      const key = line.slice(0, equalsIndex).trim();
      let value = line.slice(equalsIndex + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      env[key] = value;
      return env;
    }, {});
}

function readEnv(files) {
  return files.reduce((env, file) => ({ ...env, ...parseEnvFile(file) }), {});
}

function hasRealValue(env, key) {
  const value = env[key];
  if (!value) return false;

  const normalized = value.toLowerCase();
  return ![
    "your-project-ref",
    "your_supabase_secret_key",
    "your_service_role_secret_key",
    "sb_publishable_your_publishable_key",
    "service-role-key",
    "public-anon-key",
  ].some((placeholder) => normalized.includes(placeholder));
}

function printGroup(title, checks) {
  console.log(title);
  for (const check of checks) {
    console.log(`  ${check.ok ? "ok" : "missing"} ${check.label}`);
  }
}

const clientEnv = readEnv(clientFiles);
const serverEnv = readEnv(serverFiles);

const clientKeys = ["EXPO_PUBLIC_SUPABASE_URL", "EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY"];
const clientChecks = clientKeys.map((key) => ({
  label: key,
  ok: hasRealValue(clientEnv, key),
}));
const serverChecks = [
  {
    label: "SUPABASE_URL",
    ok: hasRealValue(serverEnv, "SUPABASE_URL"),
  },
  {
    label: "SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY",
    ok:
      hasRealValue(serverEnv, "SUPABASE_SECRET_KEY") ||
      hasRealValue(serverEnv, "SUPABASE_SERVICE_ROLE_KEY"),
  },
  {
    label: "SUPABASE_PROJECT_ID",
    ok: hasRealValue(serverEnv, "SUPABASE_PROJECT_ID"),
  },
];

console.log("Supabase environment check");
console.log("");
printGroup("Client env (.env.local)", clientChecks);
console.log("");
printGroup("Server env (apps/api/.env.local)", serverChecks);

const missingClient = clientKeys.filter((key) => !hasRealValue(clientEnv, key));
const missingServer = serverChecks.filter((check) => !check.ok);

if (missingClient.length || missingServer.length) {
  console.log("");
  console.log("Paste missing values into .env.local and apps/api/.env.local.");
  process.exitCode = 1;
}
