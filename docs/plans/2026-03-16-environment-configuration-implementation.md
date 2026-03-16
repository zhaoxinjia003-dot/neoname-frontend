# 前端环境配置实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现开发和生产环境的 API 地址自动切换，使用 Vite 环境变量机制

**Architecture:** 使用 `.env.development` 和 `.env.production` 文件存储不同环境的配置，通过 `import.meta.env` 读取环境变量，根据构建命令自动选择对应环境

**Tech Stack:** Vite, uni-app, Vue 3

---

## Task 1: 创建开发环境配置文件

**Files:**
- Create: `/Users/jiazhaoxin/zhitu/Home/weixin/neoname/neoname-frontend/.env.development`

**Step 1: 创建 .env.development 文件**

创建文件并添加开发环境配置：

```bash
# 开发环境配置
VITE_API_BASE_URL=http://localhost:20261
```

**Step 2: 验证文件内容**

Run: `cat .env.development`

Expected output:
```
# 开发环境配置
VITE_API_BASE_URL=http://localhost:20261
```

**Step 3: 提交**

```bash
cd /Users/jiazhaoxin/zhitu/Home/weixin/neoname/neoname-frontend
git add .env.development
git commit -m "feat: 添加开发环境配置文件

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: 创建生产环境配置文件

**Files:**
- Create: `/Users/jiazhaoxin/zhitu/Home/weixin/neoname/neoname-frontend/.env.production`

**Step 1: 创建 .env.production 文件**

创建文件并添加生产环境配置：

```bash
# 生产环境配置
VITE_API_BASE_URL=https://neoname.yzhitu.com
```

**Step 2: 验证文件内容**

Run: `cat .env.production`

Expected output:
```
# 生产环境配置
VITE_API_BASE_URL=https://neoname.yzhitu.com
```

**Step 3: 提交**

```bash
git add .env.production
git commit -m "feat: 添加生产环境配置文件

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: 修改 request.js 使用环境变量

**Files:**
- Modify: `/Users/jiazhaoxin/zhitu/Home/weixin/neoname/neoname-frontend/src/utils/request.js:1`

**Step 1: 读取当前文件内容**

Run: `cat src/utils/request.js | head -5`

Expected output:
```javascript
const BASE_URL = 'http://localhost:20261'

function getToken() {
  return uni.getStorageSync('access_token') || ''
}
```

**Step 2: 修改 BASE_URL 使用环境变量**

将第 1 行修改为：

```javascript
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:20261'
```

完整的修改后文件开头应该是：

```javascript
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:20261'

function getToken() {
  return uni.getStorageSync('access_token') || ''
}

export function request(options) {
  const token = getToken()
  return new Promise((resolve, reject) => {
    uni.request({
      url: BASE_URL + options.url,
      // ... rest of the code
```

**Step 3: 验证修改**

Run: `cat src/utils/request.js | head -1`

Expected output:
```javascript
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:20261'
```

**Step 4: 提交**

```bash
git add src/utils/request.js
git commit -m "feat: 修改 API 地址使用环境变量

- 使用 import.meta.env.VITE_API_BASE_URL 读取环境变量
- 添加默认值 localhost:20261 作为后备

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: 更新 package.json 构建脚本

**Files:**
- Modify: `/Users/jiazhaoxin/zhitu/Home/weixin/neoname/neoname-frontend/package.json:10`

**Step 1: 读取当前构建脚本**

Run: `cat package.json | grep -A 1 "build:mp-weixin"`

Expected output:
```json
    "build:mp-weixin": "uni build -p mp-weixin"
```

**Step 2: 修改构建脚本添加 --mode 参数**

将 `build:mp-weixin` 脚本修改为：

```json
{
  "scripts": {
    "dev": "uni -p h5",
    "dev:h5": "uni -p h5",
    "dev:mp-weixin": "uni -p mp-weixin",
    "build:mp-weixin": "uni build -p mp-weixin --mode production"
  }
}
```

**Step 3: 验证修改**

Run: `cat package.json | grep "build:mp-weixin"`

Expected output:
```json
    "build:mp-weixin": "uni build -p mp-weixin --mode production"
```

**Step 4: 提交**

```bash
git add package.json
git commit -m "feat: 更新构建脚本使用生产环境模式

- 添加 --mode production 参数到 build:mp-weixin
- 确保生产构建使用 .env.production 配置

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: 测试开发环境配置

**Files:**
- Test: Development mode API URL

**Step 1: 清理之前的构建产物（如有）**

```bash
rm -rf dist/dev/mp-weixin
```

**Step 2: 启动开发模式**

```bash
pnpm dev:mp-weixin
```

Expected: 构建成功，无错误

**Step 3: 检查开发构建产物中的 URL**

```bash
grep -r "localhost:20261" dist/dev/mp-weixin/utils/request.js
```

Expected: 找到 `localhost:20261`（说明开发环境配置生效）

**Step 4: 停止开发服务器**

Press `Ctrl+C` 停止服务器

---

## Task 6: 测试生产环境构建

**Files:**
- Test: Production build API URL

**Step 1: 执行生产环境构建**

```bash
pnpm build:mp-weixin
```

Expected output (最后几行):
```
DONE  Build complete.
运行方式：打开 微信开发者工具, 导入 dist/build/mp-weixin 运行。
```

**Step 2: 验证生产环境 URL**

```bash
grep -r "neoname.yzhitu.com" dist/build/mp-weixin/utils/request.js
```

Expected: 找到 `https://neoname.yzhitu.com`（说明生产环境配置生效）

**Step 3: 确保没有 localhost 残留**

```bash
grep -r "localhost:20261" dist/build/mp-weixin/utils/ || echo "✅ 未发现 localhost"
```

Expected: `✅ 未发现 localhost`

**Step 4: 检查打包后的文件**

```bash
ls -lh dist/build/mp-weixin/utils/request.js
```

Expected: 文件存在且有内容

---

## Task 7: 创建环境配置说明文档

**Files:**
- Create: `/Users/jiazhaoxin/zhitu/Home/weixin/neoname/neoname-frontend/docs/ENVIRONMENT.md`

**Step 1: 创建环境配置说明文档**

```markdown
# 环境配置说明

## 概述

本项目使用 Vite 环境变量机制管理不同环境的配置。

## 环境变量文件

- `.env.development` - 开发环境配置
- `.env.production` - 生产环境配置

## 配置项

### VITE_API_BASE_URL

API 服务器基础地址

- **开发环境**: `http://localhost:20261`
- **生产环境**: `https://neoname.yzhitu.com`

## 使用方法

### 开发模式

```bash
pnpm dev:mp-weixin
```

自动使用 `.env.development` 配置，API 请求指向 `http://localhost:20261`

### 生产构建

```bash
pnpm build:mp-weixin
```

自动使用 `.env.production` 配置，API 请求指向 `https://neoname.yzhitu.com`

## 验证环境配置

### 开发环境验证

```bash
# 构建后检查
grep "localhost" dist/dev/mp-weixin/utils/request.js
```

### 生产环境验证

```bash
# 构建后检查
grep "neoname.yzhitu.com" dist/build/mp-weixin/utils/request.js
```

## 注意事项

1. 环境变量必须以 `VITE_` 前缀开头才能在客户端代码中访问
2. 修改 `.env` 文件后需要重新启动开发服务器
3. 生产构建必须使用 `--mode production` 参数

## 添加新的环境变量

1. 在 `.env.development` 和 `.env.production` 中添加变量
2. 变量名必须以 `VITE_` 开头
3. 在代码中通过 `import.meta.env.VITE_YOUR_VAR` 访问

示例：

```javascript
// .env.production
VITE_WECHAT_APPID=wx1234567890

// 代码中使用
const appId = import.meta.env.VITE_WECHAT_APPID
```

## 参考文档

- [Vite 环境变量文档](https://vitejs.dev/guide/env-and-mode.html)
```

**Step 2: 提交文档**

```bash
git add docs/ENVIRONMENT.md
git commit -m "docs: 添加环境配置说明文档

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 8: 更新 CLAUDE.md 文档

**Files:**
- Modify: `/Users/jiazhaoxin/zhitu/Home/weixin/neoname/neoname-frontend/CLAUDE.md`

**Step 1: 在 CLAUDE.md 中添加环境配置说明**

在"常用命令"章节后添加：

```markdown
## 环境配置

项目使用 Vite 环境变量管理不同环境的 API 地址：

- **开发环境** (`.env.development`): `http://localhost:20261`
- **生产环境** (`.env.production`): `https://neoname.yzhitu.com`

### 环境切换

- 开发模式: `pnpm dev:mp-weixin` - 自动使用开发环境
- 生产构建: `pnpm build:mp-weixin` - 自动使用生产环境

详见: [环境配置说明](docs/ENVIRONMENT.md)
```

**Step 2: 提交**

```bash
git add CLAUDE.md
git commit -m "docs: 更新 CLAUDE.md 添加环境配置说明

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 9: 推送所有更改

**Step 1: 查看所有提交**

```bash
git log --oneline -5
```

Expected: 看到 5-6 个新提交（环境配置相关）

**Step 2: 推送到远程仓库**

```bash
git push origin master
```

Expected: 所有提交成功推送到 GitHub

---

## 验收清单

完成所有任务后，验证以下内容：

- [ ] `.env.development` 文件存在，包含 `VITE_API_BASE_URL=http://localhost:20261`
- [ ] `.env.production` 文件存在，包含 `VITE_API_BASE_URL=https://neoname.yzhitu.com`
- [ ] `src/utils/request.js` 使用 `import.meta.env.VITE_API_BASE_URL`
- [ ] `package.json` 的 `build:mp-weixin` 包含 `--mode production`
- [ ] 开发构建产物包含 `localhost:20261`
- [ ] 生产构建产物包含 `https://neoname.yzhitu.com`
- [ ] 生产构建产物不包含 `localhost`
- [ ] 环境配置文档已创建
- [ ] CLAUDE.md 已更新
- [ ] 所有更改已提交并推送

---

## 测试命令汇总

```bash
# 开发环境测试
pnpm dev:mp-weixin
# 检查: dist/dev/mp-weixin/utils/request.js 应包含 localhost:20261

# 生产环境测试
pnpm build:mp-weixin
# 检查: dist/build/mp-weixin/utils/request.js 应包含 neoname.yzhitu.com
# 检查: 不应包含 localhost:20261
```

---

## 回滚方案

如果需要回滚更改：

```bash
# 查看当前提交
git log --oneline -5

# 回滚到环境配置之前的提交
git reset --hard <commit-hash>

# 强制推送（谨慎使用）
git push -f origin master
```

---

**实现完成后**: 在微信开发者工具中导入 `dist/build/mp-weixin`，验证生产环境下 API 请求正确指向 `https://neoname.yzhitu.com`
