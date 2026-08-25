import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { marked } from "marked";

const root = process.cwd();
const contentDirectory = path.join(root, "content", "weeklies");
const publicDirectory = path.join(root, "public");
const outputDirectory = path.join(root, "docs");
const siteUrl = "https://syq777.github.io";

function parseFrontmatter(source, fileName) {
  const match = source.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);

  if (!match) throw new Error(`${fileName} 缺少 frontmatter`);

  const data = {};
  for (const line of match[1].split("\n")) {
    const separator = line.indexOf(":");
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    const value = line
      .slice(separator + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    data[key] = value;
  }

  return { data, body: match[2].trim() };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function absoluteUrl(value) {
  return new URL(value, siteUrl).href;
}

function formatDate(value) {
  const [year, month, day] = value.split("-");
  return `${year} / ${month} / ${day}`;
}

function pageHead({ title, description, pathName, image, type = "website" }) {
  const canonical = absoluteUrl(pathName);
  const socialImage = absoluteUrl(image || "/og.png");

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${canonical}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="alternate" href="/feed.xml" type="application/atom+xml" title="沿途周刊">
  <link rel="stylesheet" href="/styles.css">
  <meta property="og:type" content="${type}">
  <meta property="og:locale" content="zh_CN">
  <meta property="og:site_name" content="沿途周刊">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${socialImage}">
  <meta name="twitter:card" content="summary_large_image">
</head>`;
}

function siteHeader({ article = false } = {}) {
  return `<a class="skip-link" href="#content">跳到正文</a>
<header class="site-header${article ? " article-header" : ""}">
  <a class="brand" href="/" aria-label="沿途周刊首页">
    <strong>沿途</strong>
    <span aria-hidden="true">/</span>
    <small>周刊</small>
  </a>
  ${
    article
      ? '<a class="header-link" href="/"><span aria-hidden="true">←</span> 返回全部周报</a>'
      : '<a class="header-link" href="/feed.xml">订阅更新 <span aria-hidden="true">↗</span></a>'
  }
</header>`;
}

const weeklies = readdirSync(contentDirectory)
  .filter((file) => file.endsWith(".md") && !file.startsWith("_"))
  .map((file) => {
    const source = readFileSync(path.join(contentDirectory, file), "utf8");
    const { data, body } = parseFrontmatter(source, file);
    const issue = Number(data.issue);

    if (!issue || !data.title || !data.date || !data.summary) {
      throw new Error(`${file} 需要 issue、title、date 和 summary`);
    }

    return {
      slug: file.replace(/\.md$/, ""),
      issue,
      issueLabel: `第 ${String(issue).padStart(3, "0")} 期`,
      title: data.title,
      date: data.date,
      summary: data.summary,
      cover: data.cover || "/notebook.jpg",
      coverAlt: data.coverAlt || data.title,
      coverWidth: Number(data.coverWidth) || 1800,
      coverHeight: Number(data.coverHeight) || 1125,
      coverPosition: data.coverPosition || "center",
      readingMinutes: Math.max(1, Math.ceil(body.replace(/\s/g, "").length / 500)),
      html: marked.parse(body, { gfm: true }),
    };
  })
  .sort((a, b) => b.issue - a.issue);

if (existsSync(outputDirectory)) {
  rmSync(outputDirectory, { recursive: true });
}
mkdirSync(outputDirectory, { recursive: true });
cpSync(publicDirectory, outputDirectory, { recursive: true });
writeFileSync(path.join(outputDirectory, ".nojekyll"), "");

const latestWeekly = weeklies[0];
const archiveWeeklies = weeklies.slice(1);

const latestCard = `<article class="latest-card">
  <a class="latest-image" href="/weekly/${latestWeekly.slug}/">
    <img src="${escapeHtml(latestWeekly.cover)}" alt="${escapeHtml(
      latestWeekly.coverAlt,
    )}" width="${latestWeekly.coverWidth}" height="${latestWeekly.coverHeight}" style="object-position: ${escapeHtml(
      latestWeekly.coverPosition,
    )}" fetchpriority="high">
  </a>
  <div class="latest-copy">
    <div class="issue-meta">
      <span>最新一期 · ${escapeHtml(latestWeekly.issueLabel)}</span>
      <time datetime="${latestWeekly.date}">${formatDate(latestWeekly.date)}</time>
    </div>
    <h2><a href="/weekly/${latestWeekly.slug}/">${escapeHtml(latestWeekly.title)}</a></h2>
    <p>${escapeHtml(latestWeekly.summary)}</p>
    <a class="read-link" href="/weekly/${latestWeekly.slug}/">读这一期 <span aria-hidden="true">→</span></a>
  </div>
</article>`;

const archiveCards = archiveWeeklies
  .map(
    (weekly) => `<article class="archive-card">
  <a class="archive-image" href="/weekly/${weekly.slug}/">
    <img src="${escapeHtml(weekly.cover)}" alt="${escapeHtml(
      weekly.coverAlt,
    )}" width="${weekly.coverWidth}" height="${weekly.coverHeight}" style="object-position: ${escapeHtml(
      weekly.coverPosition,
    )}" loading="lazy">
  </a>
  <div class="archive-copy">
    <div class="issue-meta">
      <span>${escapeHtml(weekly.issueLabel)}</span>
      <time datetime="${weekly.date}">${formatDate(weekly.date)}</time>
    </div>
    <h3><a href="/weekly/${weekly.slug}/">${escapeHtml(weekly.title)}</a></h3>
    <p>${escapeHtml(weekly.summary)}</p>
  </div>
</article>`,
  )
  .join("\n");

const home = `${pageHead({
  title: "沿途周刊｜每周留下一点什么",
  description: "记录这一周看到的、想到的，以及不想忘记的事。",
  pathName: "/",
})}
<body>
${siteHeader()}
<main id="content" class="home">
  <section class="intro" aria-labelledby="intro-title">
    <p class="eyebrow">WEEKLY NOTES · 2026</p>
    <h1 id="intro-title">写下这一周，<br>也留住这一周。</h1>
    <p>关于生活、工作和一些还没有答案的思考。</p>
  </section>
  <section class="latest" aria-labelledby="latest-title">
    <h2 class="section-title" id="latest-title">本周</h2>
    ${latestCard}
  </section>
  ${archiveWeeklies.length ? `<section class="archive" aria-labelledby="archive-title">
    <div class="section-heading">
      <h2 class="section-title" id="archive-title">往期</h2>
      <p>共 ${weeklies.length} 期</p>
    </div>
    <div class="archive-list">${archiveCards}</div>
  </section>` : ""}
</main>
<footer class="site-footer">
  <span>© 2026 沿途周刊</span>
  <p>每周，给生活留一个坐标。</p>
  <a href="#content">回到顶部 <span aria-hidden="true">↑</span></a>
</footer>
</body>
</html>`;
writeFileSync(path.join(outputDirectory, "index.html"), home);

weeklies.forEach((weekly, index) => {
  const newer = weeklies[index - 1];
  const older = weeklies[index + 1];
  const navigation = [
    older
      ? `<a href="/weekly/${older.slug}/"><span>上一篇</span>${escapeHtml(older.title)}</a>`
      : "<span></span>",
    newer
      ? `<a class="next" href="/weekly/${newer.slug}/"><span>下一篇</span>${escapeHtml(newer.title)}</a>`
      : '<a class="next" href="/"><span>已经读完</span>查看全部周报</a>',
  ].join("");

  const article = `${pageHead({
    title: `${weekly.issueLabel} · ${weekly.title}｜沿途周刊`,
    description: weekly.summary,
    pathName: `/weekly/${weekly.slug}/`,
    image: weekly.cover,
    type: "article",
  })}
<body>
${siteHeader({ article: true })}
<main id="content">
  <article class="article">
    <header class="article-lead">
      <div class="article-meta">
        <span>${escapeHtml(weekly.issueLabel)}</span>
        <time datetime="${weekly.date}">${formatDate(weekly.date)}</time>
        <span>阅读约 ${weekly.readingMinutes} 分钟</span>
      </div>
      <h1>${escapeHtml(weekly.title)}</h1>
      <p>${escapeHtml(weekly.summary)}</p>
    </header>
    <img class="article-cover${weekly.coverHeight > weekly.coverWidth ? " article-cover--portrait" : ""}" src="${escapeHtml(weekly.cover)}" alt="${escapeHtml(
      weekly.coverAlt,
    )}" width="${weekly.coverWidth}" height="${weekly.coverHeight}" fetchpriority="high">
    <div class="markdown">${weekly.html}</div>
    <nav class="article-navigation" aria-label="周报翻页">${navigation}</nav>
  </article>
</main>
<footer class="article-footer">
  <a href="/">沿途周刊</a>
  <p>每周，给生活留一个坐标。</p>
</footer>
</body>
</html>`;

  const articleDirectory = path.join(outputDirectory, "weekly", weekly.slug);
  mkdirSync(articleDirectory, { recursive: true });
  writeFileSync(path.join(articleDirectory, "index.html"), article);
});

const feedEntries = weeklies
  .map(
    (weekly) => `  <entry>
    <title>${escapeHtml(weekly.title)}</title>
    <id>${absoluteUrl(`/weekly/${weekly.slug}/`)}</id>
    <link href="${absoluteUrl(`/weekly/${weekly.slug}/`)}"/>
    <updated>${weekly.date}T00:00:00+08:00</updated>
    <summary>${escapeHtml(weekly.summary)}</summary>
  </entry>`,
  )
  .join("\n");

writeFileSync(
  path.join(outputDirectory, "feed.xml"),
  `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>沿途周刊</title>
  <id>${siteUrl}/</id>
  <link href="${siteUrl}/"/>
  <link href="${siteUrl}/feed.xml" rel="self"/>
  <updated>${weeklies[0].date}T00:00:00+08:00</updated>
${feedEntries}
</feed>`,
);

writeFileSync(
  path.join(outputDirectory, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${siteUrl}/</loc></url>
${weeklies.map((weekly) => `  <url><loc>${absoluteUrl(`/weekly/${weekly.slug}/`)}</loc></url>`).join("\n")}
</urlset>`,
);

writeFileSync(
  path.join(outputDirectory, "robots.txt"),
  `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`,
);

writeFileSync(
  path.join(outputDirectory, "404.html"),
  `${pageHead({
    title: "没有找到这一页｜沿途周刊",
    description: "这一页可能还没有写好。",
    pathName: "/404.html",
  })}
<body>
${siteHeader()}
<main id="content" class="not-found">
  <p class="eyebrow">404 · NOT FOUND</p>
  <h1>这一页还没有写好。</h1>
  <a class="text-link" href="/">返回全部周报 →</a>
</main>
</body>
</html>`,
);

console.log(`已生成 ${weeklies.length} 期周报 → docs/`);
