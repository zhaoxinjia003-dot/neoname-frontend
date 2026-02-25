# 新生儿起名小程序（uni-app + FastAPI）执行清单（细化版）

## TL;DR

> **Quick Summary**: 将原计划拆解为可执行的细粒度步骤清单，覆盖后端基础、数据层、授权、起名逻辑、支付解锁、前端联调与文档，并确保 Mock 模式下可全链路验收。
>
> **Deliverables**:
> - `frontend/` uni-app 小程序（输入 → 授权 → 生成 → 付费解锁 → 详细原因）
> - `backend/` FastAPI 服务（授权、起名、支付、数据存储、Mock 切换）
> - `backend/migrations/`（Postgres: `neoname`）
> - `docs/`（部署指南、本地启动、微信配置清单）
>
> **Estimated Effort**: Large
> **Parallel Execution**: YES – 3 waves
> **Critical Path**: 后端脚手架 → 数据库 → 授权 → 起名 → 支付解锁 → 前端联调 → 文档

---

## Context

### Original Request
使用 uni-app 设计新生儿起名小程序，流程：用户输入信息后弹窗授权微信→授权完成后生成名字→使用 Minimax 逻辑（前期可先 OpenAI）→名字基于生辰八字，读起来顺口；每次返回 5 个名字，并给一个“吸引付费的简短初衷”，详细原因需要支付 0.5 元查看。UI 要大气、稳重、成熟。后端用 Python，前后端统一放在 `frontend/` 和 `backend/`。提供服务器部署文档与本地启动步骤。数据库用用户提供的地址，建库 `neoname`。

### Interview Summary
**Key Discussions**:
- 微信授权必须完成，需昵称/头像/手机号；unionid 其次可选。
- 新生儿信息：姓氏必填；性别必填；阳历；出生日期到“天”，小时可选；名为单字/双字用户选择；偏好/忌用字可填多个。
- 起名：基于生辰八字；若无出生小时，用“年+日”逻辑。
- 每次生成 5 个名字。
- 付费：第 1 次免费；第 2/3 次生成需要 0.5 元解锁当次详细原因；总共最多 3 次生成。
- LLM：统一封装 `llmClient`，OpenAI + Minimax；默认 OpenAI，后续切换。
- 运行环境：Python 3.11，conda 环境 `cname`（已存在）。
- 部署：Ubuntu；域名 https://zhitu.com；企业微信未注册，需列出配置清单。

**Defaults Applied (can override)**:
- 支付提供方：微信支付（含 mock），无 sandbox 账号也可验收。
- Mock 模式：单一 env 开关禁用所有外部网络调用（微信/支付/LLM/万年历）。
- 目标平台：仅 WeChat 小程序（uni-app 构建 mp-weixin）。
- 起名生成：LLM + 规则约束（忌用字过滤、字数约束），非静态词库。

### Metis Review (Applied)
**Guardrails Applied**:
- 必须实现 mock 模式以保证无账号也可跑通 QA（微信登录/手机号/支付/LLM/万年历）。
- 数据与支付必须可追溯、幂等（订单号、回调验签、重复通知处理）。
- 禁止依赖“运行时 MCP 搜索”作为生产硬依赖；采用可切换 AlmanacProvider + 缓存策略。
- 明确最大生成次数与付费边界：1 次免费 + 2 次付费。
- 需提供隐私与合规提示（手机号/生日数据）。
- 严格锁定范围：不新增后台、分享、推送、分析等功能。

---

## Work Objectives

### Core Objective
构建一个从零到可用的“新生儿起名”小程序与后端服务，涵盖授权、起名、付费解锁、数据存储与部署文档，并保证可在无真实微信支付/认证条件下通过 mock 进行全链路验收。

### Concrete Deliverables
- `frontend/`：uni-app 小程序 UI（录入、授权、结果、支付解锁、历史/次数提示）
- `backend/`：FastAPI API（授权、起名、支付、数据存储）
- `backend/migrations/`：数据库建表与演进
- `docs/`：部署指南、微信配置清单、本地启动步骤

### Definition of Done
- [x] 本地可启动后端与前端，完成“录入→授权→生成→支付解锁”的完整链路（使用 mock）。
- [x] 每次返回 5 个名字，含简短“诱导付费”的初衷；付费后展示详细原因。
- [x] 限制 1 次免费 + 2 次付费生成；超过提示不可继续。
- [x] 文档包含部署步骤、环境变量清单、微信配置清单。

### Must Have
- 微信授权不可跳过，手机号必需。
- 起名逻辑含生辰八字与万年历数据（若无小时，按年+日）。
- LLM 统一封装，默认 OpenAI，可切换 Minimax。
- 支付解锁流程 + 订单状态与回调校验。

### Must NOT Have (Guardrails)
- 不新增未要求功能（社交分享、运营后台、推送、复杂推荐算法）。
- 不在代码中写入任何密钥或数据库密码。
- 不依赖“运行时 MCP”作为唯一生产数据源。

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> 所有验收均由 agent 直接执行（CLI/HTTP/构建命令），不依赖人工点击。

### Test Decision
- **Infrastructure exists**: NO
- **Automated tests**: None（用户要求）
- **Framework**: None

### Agent-Executed QA Scenarios (All tasks must include)
每个任务包含至少 1 个“可执行 QA 场景”，使用 Bash/interactive_bash/Playwright 等工具。由于真实微信环境不可用，必须提供 mock 模式进行全链路验证。

---

## Execution Strategy

### Parallel Execution Waves

Wave 1:
- Task 1: 后端基础脚手架 + /health
- Task 2: 前端基础脚手架（uni-app 最小结构）
- Task 3: 数据库 schema + migrations

Wave 2 (after Wave 1):
- Task 4: Mock/配置总开关 + 外部依赖适配层
- Task 5: 微信授权 + 手机号绑定（含 mock）
- Task 6: 新生儿档案 API + 校验

Wave 3 (after Wave 2):
- Task 7: 起名核心逻辑 + AlmanacProvider + 过滤规则
- Task 8: LLM Client + 结构化输出协议（OpenAI/Minimax）
- Task 9: 生成次数/批次逻辑 + 结果持久化

Wave 4 (after Wave 3):
- Task 10: 支付解锁 + 订单状态机（含 mock）
- Task 11: 前端流程联调（页面、授权、生成、解锁）
- Task 12: 文档（部署/本地/微信配置）

Critical Path: Task 1 → 3 → 5 → 7 → 9 → 10 → 11

---

## TODOs

> Implementation + QA = ONE task. Each includes references and verification.

- [x] 1. 后端基础脚手架 + /health

  **What to do**:
  - 创建 `backend/` 目录结构（`app/`, `app/main.py`, `app/config.py`）。
  - 实现 `/health` 返回 `{ "status": "ok" }`。
  - 准备 `backend/.env.example`（DB 连接、Mock 开关、OpenAI/Minimax 占位）。

  **Must NOT do**:
  - 不写入真实密钥/密码。

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 基础结构影响全局。
  - **Skills**: []

  **Parallelization**:
  - Can Run In Parallel: YES (Wave 1)
  - Blocks: Task 4,5,6,7,8,9,10,11

  **References**:
  - FastAPI docs: https://fastapi.tiangolo.com/

  **Acceptance Criteria**:
- [x] `backend/app/main.py` 存在并可启动 FastAPI。
- [x] `curl -s http://localhost:8000/health` 返回 `{"status":"ok"}`。
- [x] `backend/.env.example` 含 `DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME` 及 `MOCK_*` 开关。

  **Agent-Executed QA Scenarios**:
  Scenario: Backend health check
    Tool: Bash (curl)
    Preconditions: FastAPI dev server running on localhost:8000
    Steps:
      1. curl -s http://localhost:8000/health
      2. Assert: response JSON contains status == "ok"
    Expected Result: health endpoint returns ok
    Evidence: Terminal output

- [x] 2. 前端基础脚手架（uni-app 最小结构）

  **What to do**:
  - 创建 `frontend/`，包含 `pages.json`, `App.vue`, `main.js`, `manifest.json`。
  - 配置最小页面（如 `pages/index/index`）。

  **Must NOT do**:
  - 不添加额外 UI 与业务逻辑。

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `frontend-ui-ux`

  **Parallelization**:
  - Can Run In Parallel: YES (Wave 1)
  - Blocks: Task 11

  **References**:
  - uni-app tutorial: https://uniapp.dcloud.net.cn/tutorial/

  **Acceptance Criteria**:
- [x] `frontend/` 目录存在，包含最小 uni-app 文件结构。

  **Agent-Executed QA Scenarios**:
  Scenario: Frontend build skeleton
    Tool: Bash
    Preconditions: frontend dependencies installed
    Steps:
      1. Run `pnpm build:mp-weixin` (or equivalent configured script)
      2. Assert: dist/build/mp-weixin exists
    Expected Result: build output generated
    Evidence: Terminal output

- [x] 3. 数据库 schema + migrations

  **What to do**:
  - 设计并创建表：`users`, `auth_sessions`, `newborn_profiles`, `name_batches`, `names`, `payments`。
  - 引入 Alembic，生成初始 migration。

  **Must NOT do**:
  - 不将敏感字段明文记录日志。

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - Can Run In Parallel: YES (Wave 1)
  - Blocks: Task 5,6,7,8,9,10

  **References**:
  - Alembic docs: https://alembic.sqlalchemy.org/

  **Acceptance Criteria**:
- [x] 迁移执行成功并生成表。
- [x] 表结构覆盖用户、起名结果、支付状态、解锁记录。

  **Agent-Executed QA Scenarios**:
  Scenario: Apply migrations
    Tool: Bash
    Preconditions: Postgres `neoname` reachable; env set
    Steps:
      1. Run `alembic upgrade head`
      2. Assert: exit code 0
    Expected Result: migrations applied
    Evidence: Terminal output

- [x] 4. Mock/配置总开关 + 外部依赖适配层

  **What to do**:
  - 新增统一配置开关：`MOCK_WECHAT`, `MOCK_LLM`, `MOCK_PAY`, `MOCK_ALMANAC`。
  - 为微信、支付、LLM、万年历提供 provider 接口；mock 模式返回固定可预期数据。

  **Must NOT do**:
  - 不在 mock 模式下访问外部网络。

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - Can Run In Parallel: YES (Wave 2)
  - Blocked By: Task 1
  - Blocks: Task 5,7,8,10

  **Acceptance Criteria**:
- [x] Mock 开关在配置中可读。
- [x] mock 模式下调用各 provider 返回固定结构。

  **Agent-Executed QA Scenarios**:
  Scenario: Mock providers return fixed data
    Tool: Bash (curl)
    Preconditions: `MOCK_WECHAT=true`, `MOCK_LLM=true`, `MOCK_PAY=true`, `MOCK_ALMANAC=true`
    Steps:
      1. Call a mock endpoint (e.g., /api/mock/ping or provider-invoked endpoint)
      2. Assert: response fields present with expected fixed values
    Expected Result: mock mode active with deterministic responses
    Evidence: Terminal output

- [x] 5. 微信授权 + 手机号绑定（含 mock）

  **What to do**:
  - 实现 `/api/auth/wechat/login`（接受 `code`，调用 `code2session` 或 mock）。
  - 实现 `/api/auth/wechat/phone`（处理 `getPhoneNumber` 加密数据或 mock）。
  - 存储用户资料（昵称/头像/手机号/unionid 可选）。
  - 生成并返回 access token。

  **Must NOT do**:
  - 不允许未授权继续流程。

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - Can Run In Parallel: YES (Wave 2)
  - Blocked By: Task 1,3,4
  - Blocks: Task 6,7,9,10,11

  **References**:
  - WeChat framework: https://developers.weixin.qq.com/miniprogram/dev/framework/

  **Acceptance Criteria**:
- [x] 登录接口返回 access token。
- [x] 手机号绑定成功并写入 user 表。

  **Agent-Executed QA Scenarios**:
  Scenario: Mock WeChat login
    Tool: Bash (curl)
    Preconditions: `MOCK_WECHAT=true`
    Steps:
      1. POST /api/auth/wechat/login {"code":"mock-code"}
      2. Assert: access_token non-empty
    Expected Result: token issued
    Evidence: Terminal output

- [x] 6. 新生儿档案 API + 校验

  **What to do**:
  - 新增 `/api/newborns` 创建档案（姓氏、性别、阳历日期、可选小时、单/双字、偏好/忌用字）。
  - 输入校验：姓氏/性别必填；小时可空。

  **Must NOT do**:
  - 不允许缺失必填字段。

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - Can Run In Parallel: YES (Wave 2)
  - Blocked By: Task 3,5
  - Blocks: Task 7,9,11

  **Acceptance Criteria**:
- [x] POST /api/newborns 返回 newborn_id。
- [x] 缺失姓氏/性别返回 400。

  **Agent-Executed QA Scenarios**:
  Scenario: Create newborn profile (valid)
    Tool: Bash (curl)
    Preconditions: user token exists
    Steps:
      1. POST /api/newborns with required fields
      2. Assert: response.newborn_id exists
    Expected Result: newborn profile created
    Evidence: Terminal output

  Scenario: Create newborn profile (missing surname)
    Tool: Bash (curl)
    Preconditions: user token exists
    Steps:
      1. POST /api/newborns missing surname
      2. Assert: HTTP 400 with error message
    Expected Result: validation error
    Evidence: Terminal output

- [x] 7. 起名核心逻辑 + AlmanacProvider + 过滤规则

  **What to do**:
  - 实现八字计算（无小时 → 年+日规则）。
  - 实现 AlmanacProvider（mock + 可替换外部 API），本地缓存。
  - 过滤忌用字，限制单/双字。

  **Must NOT do**:
  - 不允许输出超过 5 个名字。
  - 不允许包含忌用字。

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - Can Run In Parallel: YES (Wave 3)
  - Blocked By: Task 3,4,6
  - Blocks: Task 8,9

  **Acceptance Criteria**:
- [x] 无小时输入时仍能生成八字参数。
- [x] 忌用字过滤生效。

  **Agent-Executed QA Scenarios**:
  Scenario: Generate with no birth hour
    Tool: Bash (curl)
    Preconditions: `MOCK_ALMANAC=true`, newborn_id exists
    Steps:
      1. POST /api/names/generate with birth_hour null
      2. Assert: response.names length == 5
    Expected Result: names generated
    Evidence: Terminal output

- [x] 8. LLM Client + 结构化输出协议

  **What to do**:
  - 实现 `llmClient`（OpenAI 默认，可切换 Minimax）。
  - 统一输出 schema：names[5], teasers[5], reasons[5]。
  - mock 模式返回固定结构。

  **Must NOT do**:
  - 不允许非结构化输出。

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - Can Run In Parallel: YES (Wave 3)
  - Blocked By: Task 4,7
  - Blocks: Task 9

  **Acceptance Criteria**:
- [x] LLM 输出满足结构化 schema。
- [x] mock 模式返回固定结构。

  **Agent-Executed QA Scenarios**:
  Scenario: Mock LLM output
    Tool: Bash (curl)
    Preconditions: `MOCK_LLM=true`
    Steps:
      1. POST /api/names/generate
      2. Assert: names/teasers/reasons length == 5
    Expected Result: structured output
    Evidence: Terminal output

- [x] 9. 生成次数/批次逻辑 + 结果持久化

  **What to do**:
  - 限制 1 次免费 + 2 次付费（总 3 次）。
  - 每次生成创建 name_batch + names 记录。
  - 返回 `batch_id`, `remaining_count`, `is_unlocked`。

  **Must NOT do**:
  - 不允许超过次数继续生成。

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - Can Run In Parallel: YES (Wave 3)
  - Blocked By: Task 3,6,7,8
  - Blocks: Task 10,11

  **Acceptance Criteria**:
- [x] 第 4 次生成返回错误（提示次数用尽）。
- [x] 第 1 次生成返回 `is_unlocked=true`（免费）。
- [x] 第 2/3 次生成返回 `is_unlocked=false`。

  **Agent-Executed QA Scenarios**:
  Scenario: Generation count limit
    Tool: Bash (curl)
    Preconditions: user token, newborn_id exists, `MOCK_LLM=true`
    Steps:
      1. Call /api/names/generate 3 times
      2. Call 4th time
      3. Assert: 4th response is 429/400 with "limit"
    Expected Result: limit enforced
    Evidence: Terminal output

- [x] 10. 支付解锁 + 订单状态机（含 mock）

  **What to do**:
  - 第 2/3 次生成需创建订单（0.5 元）。
  - 实现 `/api/payments/orders` + 回调处理（mock）。
  - 幂等处理重复回调，解锁 reasons。

  **Must NOT do**:
  - 不允许未支付直接查看详细原因。

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - Can Run In Parallel: YES (Wave 4)
  - Blocked By: Task 9
  - Blocks: Task 11

  **Acceptance Criteria**:
- [x] 支付后详细原因可访问。
- [x] mock 支付模式下本地可验收。

  **Agent-Executed QA Scenarios**:
  Scenario: Mock pay unlock
    Tool: Bash (curl)
    Preconditions: `MOCK_PAY=true`, batch_id exists
    Steps:
      1. POST /api/payments/mock/pay {batch_id, amount:0.5}
      2. GET /api/names/batches/{batch_id}/reasons
      3. Assert: reasons length == 5
    Expected Result: reasons unlocked
    Evidence: Terminal output

- [x] 11. 前端流程联调（页面、授权、生成、解锁）

  **What to do**:
  - 页面：输入信息 → 授权弹窗 → 生成结果 → 付费解锁 → 详细原因。
  - 展示剩余次数（最多 3 次）。
  - UI 风格：大气、稳重、成熟。

  **Must NOT do**:
  - 不允许未授权进入生成流程。

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `frontend-ui-ux`

  **Parallelization**:
  - Can Run In Parallel: YES (Wave 4)
  - Blocked By: Task 2,5,9,10

  **Acceptance Criteria**:
- [x] 生成列表展示 5 个名字 + teaser。
- [x] 付费前 reasons 隐藏；付费后显示。

  **Agent-Executed QA Scenarios**:
  Scenario: Build WeChat mini program
    Tool: Bash
    Preconditions: frontend dependencies installed
    Steps:
      1. Run `pnpm build:mp-weixin` (or equivalent)
      2. Assert: dist/build/mp-weixin exists
    Expected Result: build output generated
    Evidence: Terminal output

- [x] 12. 部署文档 + 本地运行文档 + 微信配置清单

  **What to do**:
  - 文档包含：本地启动步骤（frontend+backend）、conda `cname` 使用说明。
  - Ubuntu 部署步骤（含 Nginx/HTTPS、域名 https://zhitu.com）。
  - 微信配置清单：小程序域名、业务域名、支付配置、回调、unionid 绑定说明。
  - 环境变量清单（不含明文密钥）。

  **Must NOT do**:
  - 不写入真实密钥/密码。

  **Recommended Agent Profile**:
  - **Category**: `writing`

  **Parallelization**:
  - Can Run In Parallel: YES (Wave 4)
  - Blocked By: Task 1,5,10

  **Acceptance Criteria**:
- [x] 文档中包含完整部署/本地运行步骤。
- [x] 微信配置清单清晰可操作。

  **Agent-Executed QA Scenarios**:
  Scenario: Docs presence
    Tool: Bash
    Preconditions: docs generated
    Steps:
      1. ls docs
      2. Assert: deployment.md and local-run.md exist
    Expected Result: docs created
    Evidence: Terminal output

---

## Commit Strategy

- No commits unless explicitly requested by user.

---

## Success Criteria

### Verification Commands
```bash
# Backend health
curl -s http://localhost:8000/health | jq '.status'

# Generate names (mock)
curl -s -X POST http://localhost:8000/api/names/generate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"newborn_id":"<id>","birth_hour":null}' | jq '.names | length'
```

### Final Checklist
- [x] 1 次免费 + 2 次付费生成限制生效
- [x] 每次 5 个名字
- [x] 付费后解锁详细原因
- [x] 文档齐全（部署+本地运行+微信配置清单）
