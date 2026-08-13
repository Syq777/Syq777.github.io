import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../docs/", import.meta.url);

test("首页列出全部周报并优先显示最新一期", async () => {
  const html = await readFile(new URL("index.html", root), "utf8");
  assert.match(html, /沿途周刊｜每周留下一点什么/);
  assert.match(html, /雨后·颐和园/);
  assert.match(html, /雨落·立秋/);
  assert.ok(html.indexOf("雨落·立秋") < html.indexOf("雨后·颐和园"));
  assert.match(html, /href="\/weekly\/001\/"/);
  assert.match(html, /href="\/weekly\/002\/"/);
});

test("每一期都有独立静态页面和正确的正文", async () => {
  const first = await readFile(new URL("weekly/001/index.html", root), "utf8");
  const second = await readFile(new URL("weekly/002/index.html", root), "utf8");
  assert.match(first, /生日周：年度复盘/);
  assert.match(second, /主线与优先级：从提问到验证/);
  assert.match(second, /rel="canonical" href="https:\/\/syq777\.github\.io\/weekly\/002\/"/);
});

test("发布所需资源完整", async () => {
  await Promise.all([
    access(new URL("styles.css", root)),
    access(new URL("feed.xml", root)),
    access(new URL("sitemap.xml", root)),
    access(new URL("uploads/001/rain-after-summer-palace.jpg", root)),
    access(new URL("uploads/002/rain-at-the-start-of-autumn.jpg", root)),
  ]);
});
