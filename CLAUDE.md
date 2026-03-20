# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

新生儿起名小程序。基于传统姓名学，结合现代审美，为新生儿提供智能起名服务。

## 技术栈

- **框架**：uni-app (DCloud)
- **语法**：Vue 3 (Composition API + `<script setup>`)
- **构建**：Vite
- **目标**：微信小程序 (mp-weixin)

## 常用命令

```bash
# 安装依赖（使用 pnpm）
pnpm install

# 开发模式 - 微信小程序
pnpm dev:mp-weixin

# 生产构建 - 微信小程序
pnpm build:mp-weixin

# H5 开发
pnpm dev:h5
```

## 项目结构

```
neoname-frontend/
├── pages/              # 页面目录
│   ├── index/          # 首页（起名输入页）
│   └── result/         # 结果页
├── utils/              # 工具函数
│   └── request.js      # 请求封装（含 token 管理）
├── pages.json          # 页面路由配置
├── vite.config.js      # Vite 配置
└── manifest.json       # uni-app 清单配置
```

## 路由

- 首页：`pages/index/index` - 新生儿起名输入
- 结果页：`pages/result/result` - 起名结果展示

## API 请求

- 请求封装在 `utils/request.js`
- 基础 URL：`http://localhost:8000`（开发环境需修改为实际后端地址）
- 使用 `uni.getStorageSync` 存储和获取 token
- 认证头：`Authorization: Bearer <token>`

## 开发注意事项

1. 使用 `uni.` API 进行平台调用（自动兼容微信小程序）
2. 页面放在 `pages/` 目录，路由在 `pages.json` 配置
3. 样式使用 Sass
4. 构建产物输出到 `dist/` 目录

## 本地调试

### 1. 启动后端服务

```bash
cd /Users/jiazhaoxin/zhitu/Home/weixin/neoname/neoname

# 激活 conda 环境
source ~/miniforge3/etc/profile.d/conda.sh
conda activate neoname

# 启动后端服务（端口 20261）
uvicorn app.main:app --host 0.0.0.0 --port 20261
```

后端访问地址: http://localhost:20261

### 2. 修改前端 API 地址

编辑 `src/utils/request.js`，确保 BASE_URL 指向本地后端：

```javascript
const BASE_URL = 'http://localhost:20261'
```

### 3. 启动前端开发

```bash
# 微信小程序开发模式（推荐）
pnpm dev:mp-weixin

# 或 H5 模式
pnpm dev:h5
```

### 4. 在微信开发者工具中测试

1. 构建完成后，在微信开发者工具中导入项目
2. 选择目录：`neoname-frontend/dist/build/mp-weixin`
3. 确保 AppID 已配置（使用测试号或正式号）
4. 修改代码后会自动编译，刷新即可看到效果
