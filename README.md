# 沿途周刊

个人周报网站，发布在 [syq777.github.io](https://syq777.github.io/)。

网站以 Markdown 为唯一内容源，不需要数据库或后台。每次发布前生成
`docs/` 静态页面，再推送到 `main` 分支，GitHub Pages 会自动上线。

## 写新一期

1. 复制 `content/weeklies/_template.md`。
2. 按期数命名，例如 `003.md`。
3. 把照片放到 `public/uploads/003/`。
4. 填写标题、日期、摘要、封面路径和 Markdown 正文。
5. 运行 `npm test`，它会检查并更新 `docs/`。
6. 提交 Markdown、照片和 `docs/`，推送后自动发布。

## 从 Notion 导入

在 Notion 中选择「导出」→「Markdown & CSV」，然后运行：

```sh
npm run import:notion -- /path/to/notion-export.md
```

脚本会生成下一期 Markdown，并复制正文里的本地图片。

## 本地预览

```sh
npm install
npm run dev
```

然后打开 <http://localhost:3000>。

## 发布前检查

```sh
npm test
```

构建结果在 `docs/`，它是 GitHub Pages 的发布目录，需要和内容一起提交。
