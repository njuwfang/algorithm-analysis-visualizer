import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(root, "dist");
const copyEntries = [
  "index.html",
  ".nojekyll",
  "assets",
  "src",
  "docs",
  "AGENTS.md",
  "README.md",
  "LICENSE"
];

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const entry of copyEntries) {
  await cp(resolve(root, entry), resolve(dist, entry), { recursive: true });
}

console.log(`Built static site at ${dist}`);
