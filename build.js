const fs = require("fs");
const path = require("path");

const root = __dirname;
const publicDir = path.join(root, "public");
const srcDir = path.join(root, "src");
const publicSrcDir = path.join(publicDir, "src");

fs.rmSync(publicDir, { recursive: true, force: true });
fs.mkdirSync(publicSrcDir, { recursive: true });

fs.copyFileSync(path.join(root, "index.html"), path.join(publicDir, "index.html"));

for (const file of fs.readdirSync(srcDir)) {
  fs.copyFileSync(path.join(srcDir, file), path.join(publicSrcDir, file));
}

console.log("Built static site to public/");
