import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const distRoot = path.join(root, "dist");

const assets = {
  "__ASSET_BACKGROUND__": path.join(root, "assets", "background.jpg"),
  "__ASSET_ASSISTANT__": path.join(root, "assets", "assistant.png"),
  "__ASSET_QQ_SHOW__": path.join(root, "assets", "qq-show.png"),
  "__ASSET_ICONS__": path.join(root, "assets", "qq2007-icons.png"),
};

function mimeType(file) {
  if (file.endsWith(".png")) return "image/png";
  if (file.endsWith(".jpg") || file.endsWith(".jpeg")) return "image/jpeg";
  throw new Error(`Unsupported theme asset: ${file}`);
}

const manifest = JSON.parse(await fs.readFile(path.join(root, "manifest.json"), "utf8"));
const outputDirectory = path.join(distRoot, manifest.id);
const output = path.join(outputDirectory, "levelupagent-qq-2007.levelup-theme");
if (manifest.schemaVersion !== 2) throw new Error("Custom-layout themes must use schemaVersion 2");
if (typeof manifest.layoutFile !== "string"
  || path.basename(manifest.layoutFile) !== manifest.layoutFile
  || !(manifest.layoutFile === "layout.json" || manifest.layoutFile.endsWith(".layout.json"))) {
  throw new Error("Theme layoutFile must be a local companion filename");
}
const layoutPath = path.join(root, manifest.layoutFile);
const layout = JSON.parse(await fs.readFile(layoutPath, "utf8"));
validateLayout(layout);
let css = await fs.readFile(path.join(root, "theme.css"), "utf8");
for (const [token, file] of Object.entries(assets)) {
  const bytes = await fs.readFile(file);
  css = css.replaceAll(token, `data:${mimeType(file)};base64,${bytes.toString("base64")}`);
}
if (/__ASSET_[A-Z_]+__/.test(css)) throw new Error("Theme CSS still contains unresolved assets");
if (!css.includes(`[data-levelup-theme="${manifest.id}"]`)) throw new Error("Theme CSS is not scoped to its manifest ID");

await fs.rm(distRoot, { recursive: true, force: true });
await fs.mkdir(outputDirectory, { recursive: true });
await fs.writeFile(output, `${JSON.stringify({ ...manifest, css })}\n`, "utf8");
await fs.writeFile(path.join(outputDirectory, manifest.layoutFile), `${JSON.stringify(layout, null, 2)}\n`, "utf8");
console.log(output);
console.log(path.join(outputDirectory, manifest.layoutFile));

function validateLayout(layout) {
  if (layout?.schemaVersion !== 1) throw new Error("Layout schemaVersion must be 1");
  if (layout?.root?.type !== "container" || !Array.isArray(layout.root.children)) {
    throw new Error("Layout root must be a container with children");
  }
  const slots = [];
  const visit = (node, conditional = false, repeated = false) => {
    if (!node || typeof node !== "object" || Array.isArray(node)) throw new Error("Layout nodes must be objects");
    const nextConditional = conditional || Boolean(node.when);
    if (node.type === "slot") {
      slots.push(node.slot);
      if (node.slot === "workspace" && (nextConditional || repeated)) {
        throw new Error("The workspace slot cannot be conditional or repeated");
      }
    }
    if (Array.isArray(node.children)) {
      for (const child of node.children) visit(child, nextConditional, repeated || node.type === "repeat");
    }
    if (Array.isArray(node.empty)) {
      for (const child of node.empty) visit(child, nextConditional, repeated);
    }
  };
  visit(layout.root);
  if (slots.filter((slot) => slot === "workspace").length !== 1) {
    throw new Error("Layout must expose the workspace slot exactly once");
  }
  if (new Set(slots).size !== slots.length) throw new Error("Layout slots cannot be duplicated");
  if (layout.window?.decorations === false && !slots.includes("qq2007Titlebar")) {
    throw new Error("The undecorated QQ2007 layout must expose its real title-bar controls");
  }
}
