#!/usr/bin/env node

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const args = new Set(process.argv.slice(2));
const full = args.has("--full");
const build = args.has("--build");
const e2e = args.has("--e2e");

if ([...args].some((arg) => !["--full", "--build", "--e2e"].includes(arg))) {
  process.stderr.write("Usage: pnpm verify:affected [--full] [--build] [--e2e]\n");
  process.exit(2);
}

function git(parameters) {
  try {
    return execFileSync("git", parameters, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })
      .trim()
      .split("\n")
      .filter(Boolean);
  } catch {
    return [];
  }
}

const baseRef = git(["rev-parse", "--verify", "main"]).length
  ? "main"
  : git(["rev-parse", "--verify", "origin/main"]).length ? "origin/main" : null;

if (!full && !baseRef) {
  process.stderr.write("Cannot determine changes: no main/origin/main ref. Use --full.\n");
  process.exit(2);
}

const changed = new Set([
  ...(baseRef ? git(["diff", "--name-only", "--diff-filter=ACMR", `${baseRef}...HEAD`]) : []),
  ...git(["diff", "--name-only", "--diff-filter=ACMR"]),
  ...git(["diff", "--cached", "--name-only", "--diff-filter=ACMR"]),
  ...git(["ls-files", "--others", "--exclude-standard"]),
]);

const rootFiles = new Set(["package.json", "pnpm-workspace.yaml", "pnpm-lock.yaml", "turbo.json", "tsconfig.json", ".prettierrc.js", "commitlint.config.cjs"]);
const repoWide = full || [...changed].some((file) =>
  rootFiles.has(file) || file.startsWith("packages/eslint-config/") || file.startsWith("packages/typescript-config/") || file.startsWith("packages/vitest-config/"),
);

const packages = new Set();
for (const file of changed) {
  const match = /^(apps|packages)\/([^/]+)\//.exec(file);
  if (!match) continue;
  const manifest = resolve(root, match[1], match[2], "package.json");
  if (!existsSync(manifest)) continue;
  try {
    const { name } = JSON.parse(readFileSync(manifest, "utf8"));
    if (name) packages.add(name);
  } catch {
    process.stderr.write(`Invalid package manifest: ${manifest}\n`);
    process.exit(2);
  }
}

if (!repoWide && packages.size === 0) {
  process.stdout.write("No changed app/package detected; scoped checks skipped.\n");
  process.exit(0);
}

const tasks = ["lint", "test", "typecheck"];
if (build) tasks.push("build");
if (e2e) tasks.push("test:e2e");

const filters = repoWide ? [] : [...packages].flatMap((name) => ["--filter", `...${name}`]);
const command = ["exec", "turbo", "run", ...tasks, ...filters, "--continue"];
process.stdout.write(`Changed files: ${changed.size}; workspaces: ${repoWide ? "all" : [...packages].join(", ")}\n`);
process.stdout.write(`Running: pnpm ${command.join(" ")}\n`);
const run = spawnSync("pnpm", command, { cwd: root, stdio: "inherit" });
if (run.error) {
  process.stderr.write(`Could not run pnpm: ${run.error.message}\n`);
  process.exit(1);
}
process.exit(run.status ?? 1);
