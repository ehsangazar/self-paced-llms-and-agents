/**
 * Check your setup before Module 1, so a missing key is not a mystery later.
 *
 * Run this first. It tells you what is ready, what is missing, and exactly what
 * to do about each one. It never prints your key.
 *
 * Run it:  npm run lab modules/00-start-here/02-sh-2-how-to-use/check-setup.ts
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const checks: { name: string; ok: boolean; detail: string; fix?: string }[] = [];

// 1 · Node. tsx and the labs assume modern Node; 20 is the floor.
const major = Number(process.versions.node.split(".")[0] ?? 0);
checks.push({
  name: "Node version",
  ok: major >= 20,
  detail: `v${process.versions.node}`,
  fix: "Install Node 20 or newer (nvm install 20).",
});

// 2 · Dependencies.
checks.push({
  name: "Dependencies",
  ok: existsSync(join(root, "node_modules")),
  detail: existsSync(join(root, "node_modules")) ? "installed" : "not installed",
  fix: "npm install",
});

// 3 · The env file. Its absence is fine for the tests, not for the companions.
const envExists = existsSync(join(root, ".env"));
checks.push({
  name: ".env file",
  ok: envExists,
  detail: envExists ? "present" : "missing",
  fix: "cp .env.example .env, then add your OPENROUTER_API_KEY",
});

// 4 · The key itself. Length only, never the value.
const key = process.env.OPENROUTER_API_KEY ?? "";
checks.push({
  name: "OPENROUTER_API_KEY",
  ok: key.length > 20,
  detail: key ? `set (${key.length} chars)` : "not set",
  fix: "Add OPENROUTER_API_KEY to .env. Get one at openrouter.ai/keys.",
});

// 5 · The model, so a typo surfaces now rather than mid-lesson.
const model = process.env.LLM_MODEL ?? "openai/gpt-4o-mini (default)";
checks.push({ name: "Model", ok: true, detail: model });

let failures = 0;
console.log("Setup check\n");
for (const c of checks) {
  if (!c.ok) failures++;
  console.log(`  ${c.ok ? "ok  " : "MISS"}  ${c.name.padEnd(20)} ${c.detail}`);
  if (!c.ok && c.fix) console.log(`        ${"".padEnd(20)} -> ${c.fix}`);
}

console.log("");
if (failures === 0) {
  console.log("Everything is ready. Start with:");
  console.log("  npm test                                   the lab tests, which should fail");
  console.log("  npm run lab modules/01-workflows-and-agents/01-s01-why-demos-die/hook/naive.ts");
} else {
  console.log(`${failures} thing(s) to fix above.`);
  console.log(
    "Only the last two block the lessons that call a model. The lab tests need no\n" +
      "key at all, so you can start on those now: npm test",
  );
}
