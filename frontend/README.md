# 新生儿起名小程序前端

- **框架**：uni-app（DCloud）
- **语法**：Vue 3（Composition API + `<script setup>`）
- **构建**：Vite
- **目标**：微信小程序（mp-weixin）

## 开发

```bash
pnpm install
pnpm dev:mp-weixin   # 微信开发者工具打开 dist/dev/mp-weixin
pnpm build:mp-weixin # 生产构建
```

## 约定

- 页面放在 `pages/`，路由见 `pages.json`
- 请求封装在 `utils/request.js`，需配置后端 baseURL
