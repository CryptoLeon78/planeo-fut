import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

const root = process.cwd();
const vendor = ["lov", "able"].join("");
const forbidden = new RegExp(`${vendor}|${vendor}\\.dev|${vendor}\\.app`, "i");
const ignored = new Set(["node_modules", ".git", "dist", ".output", ".vinxi"]);
const historicalPlan = join(root, "docs", "PLAN_MAESTRO_PLANEOfut.md").toLowerCase();
const extensions = new Set([".ts", ".tsx", ".js", ".mjs", ".json", ".toml", ".md", ".sh", ".yml", ".yaml"]);
const violations = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(path);
      continue;
    }
    if (path.toLowerCase() === historicalPlan) continue;
    if (!extensions.has(path.slice(path.lastIndexOf(".")))) continue;
    const content = await readFile(path, "utf8");
    if (forbidden.test(content)) violations.push(relative(root, path));
  }
}

await walk(root);
if (violations.length) {
  console.error(`${vendor} references found in executable/documentation files:`);
  for (const file of violations) console.error(`- ${file}`);
  process.exit(1);
}
console.log(`No ${vendor} references found outside the historical plan.`);
