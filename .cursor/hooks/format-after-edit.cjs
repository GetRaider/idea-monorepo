#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "../..");
const supported = new Set([".ts", ".tsx", ".js", ".jsx", ".cjs", ".mjs", ".json", ".md", ".yaml", ".yml", ".css", ".scss"]);

let data = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => { data += chunk; });
process.stdin.on("end", () => {
  try {
    const payload = JSON.parse(data);
    const filePath = payload.tool_input?.file_path ?? payload.file_path;
    if (typeof filePath !== "string" || !path.isAbsolute(filePath)) return;
    const relative = path.relative(root, filePath);
    if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) return;
    if (!supported.has(path.extname(relative)) || !fs.existsSync(filePath)) return;
    if (!fs.statSync(filePath).isFile()) return;
    if (relative.split(path.sep).some((part) => part === "node_modules" || part === ".git")) return;

    const result = spawnSync("pnpm", ["exec", "prettier", "--write", "--ignore-unknown", "--", relative], {
      cwd: root,
      encoding: "utf8",
      timeout: 12000,
      stdio: ["ignore", "pipe", "pipe"],
    });
    if (result.error || result.status !== 0) {
      process.stderr.write(`Cursor formatter: ${result.error?.message ?? result.stderr?.trim() ?? "unknown failure"}\n`);
    }
  } catch (error) {
    process.stderr.write(`Cursor formatter: ${error.message}\n`);
  }
});
