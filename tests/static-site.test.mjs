import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../docs/", import.meta.url);

test("首页列出全部周报并优先显示最新一期", async () => {
  const html = await readFile(new URL("index.html", root), "utf8");
  assert.match(html, /沿途周刊｜每周留下一点什么/);
  assert.match(html, /雨后·颐和园/);
  assert.match(html, /雨落·立秋/);
  assert.match(html, /昼暮·四季未满/);
  assert.match(html, /北京的海/);
  assert.ok(html.indexOf("北京的海") < html.indexOf("昼暮·四季未满"));
  assert.ok(html.indexOf("昼暮·四季未满") < html.indexOf("雨落·立秋"));
  assert.ok(html.indexOf("雨落·立秋") < html.indexOf("雨后·颐和园"));
  assert.match(html, /href="\/weekly\/001\/"/);
  assert.match(html, /href="\/weekly\/002\/"/);
  assert.match(html, /href="\/weekly\/003\/"/);
  assert.match(html, /href="\/weekly\/004\/"/);
  assert.match(html, /class="latest-card"/);
  assert.match(html, /class="archive-list"/);
});

test("每一期都有独立静态页面和正确的正文", async () => {
  const first = await readFile(new URL("weekly/001/index.html", root), "utf8");
  const second = await readFile(new URL("weekly/002/index.html", root), "utf8");
  const third = await readFile(new URL("weekly/003/index.html", root), "utf8");
  const fourth = await readFile(new URL("weekly/004/index.html", root), "utf8");
  assert.match(first, /生日周：年度复盘/);
  assert.match(second, /主线与优先级：从提问到验证/);
  assert.match(second, /rel="canonical" href="https:\/\/syq777\.github\.io\/weekly\/002\/"/);
  assert.match(second, /class="article-cover"/);
  assert.match(second, /class="article-footer"/);
  assert.match(third, /职业方向的重新校准/);
  assert.match(third, /class="portrait-photo"/);
  assert.match(third, /article-cover article-cover--portrait/);
  assert.match(third, /width="1350" height="1800"/);
  assert.match(third, /rel="canonical" href="https:\/\/syq777\.github\.io\/weekly\/003\/"/);
  assert.match(fourth, /山间的一小片“海”/);
  assert.match(fourth, /width="2400" height="1800"/);
  assert.match(fourth, /rel="canonical" href="https:\/\/syq777\.github\.io\/weekly\/004\/"/);
});

test("发布所需资源完整", async () => {
  await Promise.all([
    access(new URL("styles.css", root)),
    access(new URL("feed.xml", root)),
    access(new URL("sitemap.xml", root)),
    access(new URL("uploads/001/rain-after-summer-palace.jpg", root)),
    access(new URL("uploads/002/rain-at-the-start-of-autumn.jpg", root)),
    access(new URL("uploads/003/beijing-at-dusk.jpg", root)),
    access(new URL("uploads/003/beijing-in-daylight.jpg", root)),
    access(new URL("uploads/004/beijing-sea.jpg", root)),
    access(new URL("uploads/004/miyun-reservoir-between-mountains.jpg", root)),
  ]);
});

test("周报图片保持自身比例，不受 HTML 尺寸属性拉伸", async () => {
  const css = await readFile(new URL("styles.css", root), "utf8");
  assert.match(css, /\.latest-image img,[\s\S]*?height: 100%;[\s\S]*?object-fit: cover;/);
  assert.match(css, /\.latest-image \{ aspect-ratio: 8 \/ 5; \}/);
  assert.match(css, /\.archive-image \{ aspect-ratio: 8 \/ 5; \}/);
  assert.match(css, /\.article-cover \{[\s\S]*?width: 100%;[\s\S]*?height: auto;/);
  assert.match(css, /\.article-cover--portrait \{[\s\S]*?width: min\(100%, 480px\);/);
});
