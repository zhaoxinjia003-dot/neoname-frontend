---
description: 
alwaysApply: true
---

# Agent 指南

本仓库的 AI Agent 协作约定。

## 环境

- **Conda 环境 `neoname`**：所有与 Python 服务相关的命令、脚本、依赖、运行/调试，请在此环境下进行。
  - 示例：`conda activate neoname` 后再执行 Python 或相关工具。

## 数据库

- **一律通过 MCP 操作**：不写本地数据库连接脚本或直接连库命令。
- 使用已配置的 DMS MCP（如 `aliyun-dms-mcp-server`）进行：
  - 实例/库/表查询
  - SQL 执行（`executeScript`）
  - 数据变更工单（如需要）
  - 元数据查看、NL2SQL 等

**连接信息（DMS / getDatabase 用）**：
- Host: `rm-cn-9cw4nhhrl0001u5o.rwlb.rds.aliyuncs.com`
- Port: `5432`
- Schema/DB: `neoname`
- 账号/密码：见 `backend/.env` 或 DMS 配置，勿写入仓库。

查询、执行、表结构等需求请直接调用对应 MCP 工具。

## 前端（uni-app）

- **页面路径以 `src` 为根**：`pages.json` 中的页面路径（如 `pages/index/index`）由 Vite/uni-app 从 **`frontend/src/`** 解析，因此页面文件必须放在 `frontend/src/pages/` 下（例如 `src/pages/index/index.vue`），不要放在项目根下的 `frontend/pages/`，否则会出现 “Failed to resolve import” 等找不到页面的错误。
- 新增或移动页面时，以 `src/pages/` 为唯一起点。
