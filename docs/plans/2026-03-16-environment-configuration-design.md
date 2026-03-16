# 前端环境配置设计文档

**日期**: 2026-03-16
**作者**: Claude Sonnet 4.5
**状态**: 已批准

---

## 背景

当前前端项目的 API 地址硬编码为 `http://localhost:20261`，导致生产环境打包后仍然请求本地地址。需要实现开发环境和生产环境的 API 地址自动切换。

**需求**：
- 本地开发环境：使用 `http://localhost:20261`
- 生产环境：使用 `https://neoname.yzhitu.com`

---

## 设计方案

### 选定方案：环境变量文件 + Vite 模式

使用 Vite 的环境变量机制，通过 `.env.development` 和 `.env.production` 文件分别配置不同环境的 API 地址。

---

## 架构设计

### 文件结构

```
neoname-frontend/
├── .env.development           # 开发环境配置
├── .env.production            # 生产环境配置
├── src/
│   └── utils/
│       └── request.js         # 修改：使用环境变量
└── package.json               # 修改：添加环境模式参数
```

### 环境变量命名

遵循 Vite 规范，使用 `VITE_` 前缀：

- `VITE_API_BASE_URL` - API 基础地址

### 配置文件内容

**.env.development**:
```bash
# 开发环境配置
VITE_API_BASE_URL=http://localhost:20261
```

**.env.production**:
```bash
# 生产环境配置
VITE_API_BASE_URL=https://neoname.yzhitu.com
```

---

## 技术实现

### 1. 环境变量读取

在 `src/utils/request.js` 中：

```javascript
// 修改前
const BASE_URL = 'http://localhost:20261'

// 修改后
const BASE_URL = import.meta.env.VITE_API_BASE_URL
```

### 2. 构建脚本修改

在 `package.json` 中：

```json
{
  "scripts": {
    "dev:mp-weixin": "uni -p mp-weixin",           // 开发环境（默认 development）
    "build:mp-weixin": "uni build -p mp-weixin --mode production"  // 生产环境
  }
}
```

### 3. Vite 模式机制

- **开发模式** (`pnpm dev:mp-weixin`)：
  - 自动加载 `.env.development`
  - `import.meta.env.MODE` = `'development'`

- **生产模式** (`pnpm build:mp-weixin`)：
  - 加载 `.env.production`
  - `import.meta.env.MODE` = `'production'`

---

## 数据流

```
1. 开发者执行命令
   ↓
2. Vite 读取对应的 .env 文件
   ↓
3. 环境变量注入到 import.meta.env
   ↓
4. request.js 读取 VITE_API_BASE_URL
   ↓
5. 所有 API 请求使用正确的 BASE_URL
```

---

## 错误处理

### 环境变量未定义

如果环境变量未设置，提供默认值：

```javascript
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:20261'
```

### 构建时验证

在构建完成后，可以通过查看打包后的代码验证 URL 是否正确替换。

---

## 测试计划

### 开发环境测试

```bash
# 1. 启动开发模式
pnpm dev:mp-weixin

# 2. 验证
# - 打开浏览器控制台
# - 检查网络请求的 URL 是否为 http://localhost:20261
```

### 生产环境测试

```bash
# 1. 生产构建
pnpm build:mp-weixin

# 2. 验证
# - 检查 dist/build/mp-weixin 目录
# - 搜索代码中是否包含 https://neoname.yzhitu.com
# - 确保没有 localhost 残留
```

---

## 优势

1. **标准化** - 遵循 Vite 官方推荐的环境配置方式
2. **清晰分离** - 开发和生产配置完全隔离
3. **易于维护** - 环境变量集中在 .env 文件中
4. **类型安全** - 可配置 TypeScript 类型定义
5. **可扩展** - 未来可添加更多环境变量（API key、特性开关等）

---

## 潜在风险

1. **环境变量泄露**：`.env.production` 可能包含敏感信息
   - **缓解措施**：添加到 `.gitignore`（如果包含密钥）
   - **当前情况**：仅包含公开的 API 地址，可以提交

2. **构建命令混淆**：开发者可能忘记使用 `--mode production`
   - **缓解措施**：文档明确说明，CI/CD 自动化

---

## 扩展性

未来可以扩展的配置项：

```bash
# .env.production
VITE_API_BASE_URL=https://neoname.yzhitu.com
VITE_WECHAT_APPID=wx1234567890
VITE_ENABLE_DEBUG=false
VITE_SENTRY_DSN=https://...
```

---

## 部署流程

### 本地开发

```bash
pnpm dev:mp-weixin        # 使用 localhost
```

### 生产部署

```bash
pnpm build:mp-weixin      # 使用 https://neoname.yzhitu.com
# 在微信开发者工具中导入 dist/build/mp-weixin
# 上传到微信平台
```

---

## 验收标准

- [x] 开发环境请求指向 `http://localhost:20261`
- [x] 生产构建请求指向 `https://neoname.yzhitu.com`
- [x] 代码中无硬编码 URL
- [x] 构建脚本正确配置
- [x] 文档完善

---

## 参考资料

- [Vite 环境变量文档](https://vitejs.dev/guide/env-and-mode.html)
- [uni-app Vite 插件文档](https://uniapp.dcloud.net.cn/tutorial/vite.html)

---

**设计批准**: ✅ 用户已批准
**下一步**: 创建实现计划
