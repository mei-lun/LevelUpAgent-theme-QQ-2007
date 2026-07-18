# LevelUpAgent QQ 2007 主题源码

本目录包含 QQ 2007 主题面向 LevelUpAgent 的全部运行时源码和构建产物。

主题启用时加载独立 `layout.json`，由 LevelUpAgent 的声明式布局运行时提供：

- QQ 2007 风格一体化标题栏与真实窗口控制。
- 主工具栏、项目树、中央会话和输入区。
- 环境信息、好友列表和 QQ 秀面板。
- 底部连接状态与权限状态栏。

停用或卸载后，LevelUpAgent 会恢复默认布局、默认 CSS 和系统标题栏。

## 文件说明

| 路径 | 用途 |
| --- | --- |
| `assets/` | 构建时内嵌的图片资源 |
| `manifest.json` | schemaVersion 2 主题信息和 companion 布局文件声明 |
| `layout.json` | QQ2007 结构、窗口装饰和功能 slots |
| `theme.css` | 严格限定在主题 ID 下的全部视觉样式 |
| `build-theme.mjs` | 读取素材、CSS 和布局，生成主题包与 companion 布局 |
| `theme-package.test.mjs` | 验证作用域、素材内嵌和安全限制 |
| `dist/` | 可直接安装的 `.levelup-theme` 文件 |

## 构建

请在仓库根目录运行：

```bash
npm run build
```

产物位于：

```text
levelup/dist/qq-2007/levelupagent-qq-2007.levelup-theme
levelup/dist/qq-2007/layout.json
```

产物文件名为 `levelupagent-qq-2007.levelup-theme`，主题 ID、布局 ID 和发布目录统一使用 `qq-2007`。

## 测试

```bash
npm test
```

测试内容：

- 所有普通 CSS 规则必须包含 `html[data-levelup-theme="qq-2007"]`。
- 构建产物必须包含 JPEG 和 PNG 内嵌资源。
- 构建产物不能残留 `__ASSET_*__` 占位符。
- CSS 不能包含 `@import` 或远程 URL。
- manifest 和构建产物必须使用 LevelUpAgent schema v2。
- 源布局与构建布局必须一致，并通过 workspace、slot 唯一性和窗口控制校验。

## 安装

1. 打开 LevelUpAgent 的“模型连接 → 主题”。
2. 点击“安装主题包”。
3. 选择 `dist/qq-2007/levelupagent-qq-2007.levelup-theme`。
4. 安装后主题会立即启用。

在同一页面可以切换或卸载主题。卸载当前主题时，LevelUpAgent 会自动切回默认主题。

## 修改规范

- 图片只放在 `assets/` 中，并通过构建器内嵌。
- 布局结构只在 `layout.json` 中定义，不在主题中加入 JavaScript。
- 每个 CSS 选择器都必须包含主题作用域。
- 不使用远程资源、远程字体、`@import` 或可执行 JavaScript。
- 不隐藏 LevelUpAgent 的审批、权限、安全提示或停止生成能力。
- 不在主题包中实现 Provider、Agent、数据库或文件系统逻辑。
- 修改后必须运行 `npm test` 并在真实 LevelUpAgent 中完成安装、切换和卸载验证。
