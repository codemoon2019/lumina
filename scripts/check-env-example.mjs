#!/usr/bin/env node
/**
 * Env hygiene before build:
 * 1. `.env.example` documents canonical keys (parity with README / Vercel).
 * 2. `src/**` — no server-only env leaks via `import.meta.env` / `process.env`,
 *    no Gemini key-shaped literals.
 * 3. `api/*.ts` (except `_ephemeralCredOverride.ts`) — no Gemini-shaped literals (ephemeral debug file is excluded intentionally).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ENV_EXAMPLE = path.join(ROOT, ".env.example");
const SRC = path.join(ROOT, "src");
const API_DIR = path.join(ROOT, "api");
const EPHEMERAL_CRED_FILE = "_ephemeralCredOverride.ts";

/** Uncommented assignments expected in `.env.example` — extend when adding entries there. */
const REQUIRED_ENV_EXAMPLE_KEYS = [
  "GEMINI_API_KEY",
  "GEMINI_API_BASE",
  "GEMINI_MODEL",
  "COACH_API_PORT",
  "ELEVENLABS_API_KEY",
  "ELEVENLABS_VOICE_ID",
  "VITE_LUMINA_USE_ELEVENLABS",
  "VITE_WEATHER_LAT",
  "VITE_WEATHER_LON",
];

const IMPORT_META_DOT = /\bimport\.meta\.env\.([A-Za-z_$][\w$]*)\b/g;
const IMPORT_META_BRACKET = /\bimport\.meta\.env\[\s*(['"])([^'"\r\n]+)\1\s*\]/g;
const PROCESS_ENV_DOT = /\bprocess\.env\.([A-Za-z_$][\w$]*)\b/g;
const PROCESS_ENV_BRACKET = /\bprocess\.env\[\s*(['"])([^'"\r\n]+)\1\s*\]/g;

/** Vite exposes these on `import.meta.env` besides `VITE_*`. */
const ALLOWED_META_ENV = new Set(["MODE", "BASE_URL", "DEV", "PROD", "SSR"]);

/** Google AI Studio-style keys pasted into source — high-signal accidental leak marker (no `/g`: safe for `.test`). */
const GEMINI_KEY_LIKE = /\bAIza[\w-]{20,}\b/;

function parseEnvExampleKeys(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const keys = new Set();
  for (const lineRaw of raw.split(/\r?\n/)) {
    const line = lineRaw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    if (/^[A-Za-z_][\w]*$/.test(key)) keys.add(key);
  }
  return keys;
}

function walkTsFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    if (name === "node_modules" || name === "dist") continue;
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walkTsFiles(full, out);
    else if (/\.(?:tsx?|mts|cts|jsx)$/i.test(name) && !name.endsWith(".d.ts")) out.push(full);
  }
  return out;
}

function checkImportMetaEnvName(name, file, errs) {
  if (ALLOWED_META_ENV.has(name)) return;
  if (name.startsWith("VITE_")) return;
  if (name.startsWith("GEMINI_") || name.startsWith("ELEVENLABS_")) {
    errs.push(`${file}: \`import.meta.env.${name}\` — server secrets must stay in API routes/middleware only (use \`VITE_*\` for client-safe flags).`);
    return;
  }
  errs.push(
    `${file}: \`${name}\` on import.meta.env — only \`VITE_*\` and Vite built-ins (${[...ALLOWED_META_ENV].join(", ")}) are allowed in src; declare new client vars in src/vite-env.d.ts.`,
  );
}

function checkProcessEnv(name, file, errs) {
  errs.push(
    `${file}: \`${name}\` via process.env — not available reliably in browser bundles; use \`import.meta.env.VITE_*\` for client.`,
  );
}

function checkApiSecretsFile(relPath, text, errs) {
  if (GEMINI_KEY_LIKE.test(text)) {
    errs.push(
      `${relPath}: possible hardcoded Gemini \`AIza...\` API key substring — remove and use GEMINI_* in Vercel or \`api/_ephemeralCredOverride.ts\` (temporary only).`,
    );
  }
}

function checkSrcFile(relPath, text, errs) {
  IMPORT_META_DOT.lastIndex = 0;
  for (const m of text.matchAll(IMPORT_META_DOT)) checkImportMetaEnvName(m[1], relPath, errs);

  IMPORT_META_BRACKET.lastIndex = 0;
  for (const m of text.matchAll(IMPORT_META_BRACKET)) checkImportMetaEnvName(m[2], relPath, errs);

  PROCESS_ENV_DOT.lastIndex = 0;
  for (const m of text.matchAll(PROCESS_ENV_DOT)) checkProcessEnv(m[1], relPath, errs);

  PROCESS_ENV_BRACKET.lastIndex = 0;
  for (const m of text.matchAll(PROCESS_ENV_BRACKET)) checkProcessEnv(m[2], relPath, errs);

  if (GEMINI_KEY_LIKE.test(text)) {
    errs.push(`${relPath}: possible hardcoded Gemini \`AIza...\` API key substring — remove and use GEMINI_* in .env / Vercel only.`);
  }
}

function main() {
  const errs = [];

  if (!fs.existsSync(ENV_EXAMPLE)) {
    errs.push(`Missing ${path.relative(ROOT, ENV_EXAMPLE)}`);
  } else {
    const parsed = parseEnvExampleKeys(ENV_EXAMPLE);
    for (const key of REQUIRED_ENV_EXAMPLE_KEYS) {
      if (!parsed.has(key)) {
        errs.push(
          `${path.relative(ROOT, ENV_EXAMPLE)}: missing active assignment line for \`${key}=\` — keep in sync with Vercel/dashboard names.`,
        );
      }
    }
  }

  const files = walkTsFiles(SRC);
  if (files.length === 0) {
    errs.push(`No tracked TS/TSX files under ${path.relative(ROOT, SRC)} (unexpected)`);
  }
  for (const abs of files) {
    checkSrcFile(path.relative(ROOT, abs), fs.readFileSync(abs, "utf8"), errs);
  }

  if (fs.existsSync(API_DIR)) {
    const apiTs = fs
      .readdirSync(API_DIR)
      .filter((n) => /\.tsx?$/i.test(n))
      .map((n) => path.join(API_DIR, n));

    for (const abs of apiTs) {
      const base = path.basename(abs);
      if (base === EPHEMERAL_CRED_FILE) continue;
      checkApiSecretsFile(path.relative(ROOT, abs), fs.readFileSync(abs, "utf8"), errs);
    }
  }

  if (errs.length) {
    console.error("[check-env-example]\n\n" + errs.map((e) => `  ✖ ${e}`).join("\n") + "\n");
    process.exit(1);
  }

  console.log("[check-env-example] OK (.env.example keys + client/src/api hygiene)");
}

main();
