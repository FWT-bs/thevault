import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const loadedSymbol = Symbol.for("thevault.api.localEnvLoaded");

function parseEnvFile(filePath: string): Record<string, string> {
  if (!existsSync(filePath)) return {};

  return readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .reduce<Record<string, string>>((env, rawLine) => {
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

export function loadLocalEnv(): void {
  const globalState = globalThis as typeof globalThis & { [loadedSymbol]?: boolean };
  if (globalState[loadedSymbol]) return;

  // Pass .href so we hand fileURLToPath a string — the DOM URL ctor's return
  // is structurally incompatible with node:url's URL type under the bundled
  // @types/node.
  const apiRoot = resolve(fileURLToPath(new URL("../..", import.meta.url).href));
  const workspaceRoot = resolve(apiRoot, "../..");
  const envFiles = [
    resolve(workspaceRoot, ".env"),
    resolve(workspaceRoot, ".env.local"),
    resolve(apiRoot, ".env"),
    resolve(apiRoot, ".env.local"),
  ];

  for (const file of envFiles) {
    const values = parseEnvFile(file);
    for (const [key, value] of Object.entries(values)) {
      process.env[key] ??= value;
    }
  }

  globalState[loadedSymbol] = true;
}
