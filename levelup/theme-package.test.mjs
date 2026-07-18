import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

test("LevelUpAgent theme source is scoped and the bundle is self-contained", async () => {
  const manifest = JSON.parse(await fs.readFile(path.join(root, "manifest.json"), "utf8"));
  const projectPackage = JSON.parse(await fs.readFile(path.join(root, "..", "package.json"), "utf8"));
  const sourceLayout = JSON.parse(await fs.readFile(path.join(root, manifest.layoutFile), "utf8"));
  const sourceCss = await fs.readFile(path.join(root, "theme.css"), "utf8");
  const scope = `[data-levelup-theme="${manifest.id}"]`;
  for (const header of ruleHeaders(sourceCss)) {
    if (header.startsWith("@")) continue;
    for (const selector of header.split(",")) {
      assert.ok(selector.includes(scope), `Unscoped selector: ${selector.trim()}`);
    }
  }

  const outputDirectory = path.join(root, "dist", manifest.id);
  const bundlePath = path.join(outputDirectory, "levelupagent-qq-2007.levelup-theme");
  const bundleBytes = await fs.readFile(bundlePath);
  const builtLayoutBytes = await fs.readFile(path.join(outputDirectory, manifest.layoutFile));
  const bundle = JSON.parse(bundleBytes.toString("utf8"));
  const builtLayout = JSON.parse(builtLayoutBytes.toString("utf8"));
  assert.equal(bundle.schemaVersion, 2);
  assert.equal(bundle.id, manifest.id);
  assert.equal(bundle.version, projectPackage.version);
  assert.equal(bundle.layoutFile, "layout.json");
  assert.ok(!("layout" in bundle), "schemaVersion 2 must not use the legacy layout field");
  assert.deepEqual(builtLayout, sourceLayout);
  assert.equal(sourceLayout.schemaVersion, 1);
  assert.equal(sourceLayout.window.decorations, false);
  assert.equal(sourceLayout.root.type, "container");
  const nodes = flattenNodes(sourceLayout.root);
  const slots = nodes.filter((node) => node.type === "slot").map((node) => node.slot);
  assert.deepEqual(slots, ["qq2007Titlebar", "qq2007Toolbar", "sidebar", "mediaStudio", "workspace", "qq2007RightPanel", "qq2007Statusbar"]);
  assert.equal(slots.filter((slot) => slot === "workspace").length, 1);
  assert.equal(new Set(slots).size, slots.length);
  assert.ok(!nodes.some((node) => node.type === "script" || "script" in node || "html" in node || "command" in node));
  assert.ok(bundleBytes.length <= 12 * 1024 * 1024, "Theme package exceeds 12 MiB");
  assert.ok(Buffer.byteLength(bundle.css, "utf8") <= 10 * 1024 * 1024, "Theme CSS exceeds 10 MiB");
  assert.ok(builtLayoutBytes.length <= 512 * 1024, "Layout exceeds 512 KiB");
  await assert.rejects(fs.access(path.join(root, "dist", "layout.json")));
  await assert.rejects(fs.access(path.join(root, "dist", "levelupagent-qq-2007.levelup-theme")));
  assert.ok(bundle.css.includes("data:image/jpeg;base64,"));
  assert.ok(bundle.css.includes("data:image/png;base64,"));
  assert.doesNotMatch(bundle.css, /__ASSET_[A-Z_]+__/);
  assert.doesNotMatch(bundle.css, /@import|https?:/i);
});

function flattenNodes(rootNode) {
  const nodes = [];
  const visit = (node) => {
    nodes.push(node);
    for (const child of node.children ?? []) visit(child);
    for (const child of node.empty ?? []) visit(child);
  };
  visit(rootNode);
  return nodes;
}

function ruleHeaders(css) {
  const headers = [];
  const stack = [];
  let start = 0;
  let quote = null;
  let comment = false;
  for (let index = 0; index < css.length; index += 1) {
    const character = css[index];
    const next = css[index + 1];
    if (comment) {
      if (character === "*" && next === "/") {
        comment = false;
        index += 1;
        start = index + 1;
      }
      continue;
    }
    if (!quote && character === "/" && next === "*") {
      comment = true;
      index += 1;
      continue;
    }
    if (quote) {
      if (character === "\\") index += 1;
      else if (character === quote) quote = null;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character === "{") {
      const header = css.slice(start, index).trim();
      const isAtRule = header.startsWith("@");
      if (stack.length === 0 || stack.at(-1) === "at-rule") headers.push(header);
      stack.push(isAtRule ? "at-rule" : "rule");
      start = index + 1;
    } else if (character === "}") {
      stack.pop();
      start = index + 1;
    }
  }
  return headers.filter(Boolean);
}
