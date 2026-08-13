import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const input = process.argv[2];

if (!input) {
  console.error("用法：npm run import:notion -- /path/to/notion-export.md");
  process.exit(1);
}

const sourcePath = path.resolve(input);
if (!existsSync(sourcePath) || !sourcePath.endsWith(".md")) {
  console.error("请传入一个 Notion 导出的 Markdown 文件");
  process.exit(1);
}

const root = process.cwd();
const contentDirectory = path.join(root, "content", "weeklies");
const existingIssues = readdirSync(contentDirectory)
  .filter((file) => /^\d+.*\.md$/.test(file))
  .map((file) => Number(file.match(/^\d+/)?.[0] || 0));
const issue = Math.max(0, ...existingIssues) + 1;
const slug = String(issue).padStart(3, "0");
const uploadDirectory = path.join(root, "public", "uploads", slug);
mkdirSync(uploadDirectory, { recursive: true });

let body = readFileSync(sourcePath, "utf8").trim();
const heading = body.match(/^#\s+(.+)$/m);
const title = heading?.[1].trim() || path.basename(sourcePath, ".md");
if (heading) body = body.replace(heading[0], "").trim();

const copiedImages = [];
body = body.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (full, alt, target) => {
  if (/^(https?:|data:|\/)/.test(target)) return full;

  const decodedTarget = decodeURIComponent(target.split("#")[0]);
  const imagePath = path.resolve(path.dirname(sourcePath), decodedTarget);
  if (!existsSync(imagePath)) return full;

  const fileName = path.basename(imagePath).replace(/\s+/g, "-");
  copyFileSync(imagePath, path.join(uploadDirectory, fileName));
  const publicPath = `/uploads/${slug}/${fileName}`;
  copiedImages.push(publicPath);
  return `![${alt}](${publicPath})`;
});

const plainParagraph = body
  .split(/\n\s*\n/)
  .map((part) => part.replace(/[#>*_`\-\[\]()!]/g, "").trim())
  .find(Boolean);
const summary = (plainParagraph || title).slice(0, 90);
const date = new Date().toISOString().slice(0, 10);
const cover = copiedImages[0] || "/notebook.jpg";

const escapedTitle = title.replaceAll('"', '\\"');
const escapedSummary = summary.replaceAll('"', '\\"');
const frontmatter = `---
issue: ${issue}
title: "${escapedTitle}"
date: ${date}
summary: "${escapedSummary}"
cover: ${cover}
coverAlt: "${escapedTitle}"
---

`;

const outputPath = path.join(contentDirectory, `${slug}.md`);
writeFileSync(outputPath, `${frontmatter}${body}\n`);
console.log(`已导入：${outputPath}`);
