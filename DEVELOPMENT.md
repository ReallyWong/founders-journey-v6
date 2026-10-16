# 办公室版本开发与发布

保留 v2.2 发布包为校验基线，构建脚本合并经营修复与办公室界面到 `dist/`。最新版完整 TSX 工程尚未找到；维护 根目录的 `office-scene.js`、`office-theme.css` 与 `.cjs` 构建模块，不要直接修改构建后的脚本。

## 运行

```sh
npm ci --ignore-scripts
npm run build
npm test
npm run preview
```

无第三方 Node 依赖。构建检查原始脚本 SHA-256，基线变化时拒绝套用补丁。

## Vercel 与统计

沿用原仓库及 Vercel 项目。配置使用 `npm run build && npm test`，输出目录 `dist`。非生产环境禁用结局统计及比拼写入；`VERCEL_ENV=production` 启用原有 Supabase、ntfy 上报，版本为 `v2.3-office.1`。`node build.cjs --production` 可用于检查生产产物，不应用于日常试玩。

## 发布顺序

1. 再次核对远端 main，在当前版本创建 `v2.2-pre-office` 标签。
2. 在 `feat/office-experience` 分支提交 PR。
3. 检查 Vercel 预览的建角、访谈、场景行动、下一月、存档和手机布局，确认 `release-manifest.json` 为 `analytics=false`。
4. 合并后核对原网址的资源、生产 manifest、统计、board/ops 页面。保留上个 Vercel 部署以便回退。

已观察到 main 提交 `74270cdfb3bf0f521453476926e2e423621e23a8`，尚未创建标签；提交前须重新核对。

## 验证范围

12 项经营回归通过。发布测试检查资源引用、配置加载顺序、预览零写入和生产上报模拟调用，没有向正式服务发送测试数据。浏览器流程已走通至 MVP 和月度推进，检查了 1440/390 宽度；全行业、剧本及真实手机硬件尚未全量回归。
