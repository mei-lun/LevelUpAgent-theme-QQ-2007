# Repository Guidelines

- `levelup/` is the product root; keep this repository specific to the LevelUpAgent theme package.
- Run `npm test` after changing CSS, metadata, assets, or the build script.
- Keep every CSS selector scoped to `html[data-levelup-theme="qq-2007"]`.
- Theme packages must remain self-contained and must not use remote CSS, remote assets, `@import`, or executable JavaScript.
- Keep image assets in `levelup/assets/` and embed them through `levelup/build-theme.mjs`.
- Use two-space indentation and ESM for Node.js files.
- Do not commit credentials, private screenshots, local application state, or unrelated platform runtimes.
