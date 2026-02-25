# 本地运行

## 环境

- Python 3.11，Conda 环境 `neoname`：`conda activate neoname`
- Node 18+，pnpm

## 后端

```bash
cd backend
conda activate neoname   # 必须使用 neoname 环境
cp .env.example .env
# 编辑 .env：填写 DB_*、MOCK_* 等（本地验收可设 MOCK_WECHAT=true, MOCK_LLM=true, MOCK_PAY=true, MOCK_ALMANAC=true）
pip install -r requirements.txt
alembic upgrade head     # 需先有可用的 Postgres 与 neoname 库
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

健康检查：`curl -s http://localhost:8000/health` 返回 `{"status":"ok"}`

## 前端（小程序）

```bash
cd frontend
pnpm install
pnpm run build:mp-weixin
```

产物在 `dist/build/mp-weixin`，用微信开发者工具打开该目录。

开发时：`pnpm run dev:mp-weixin`，再在微信开发者工具中打开对应目录。

## Mock 验收

1. 后端 `.env` 设置：`MOCK_WECHAT=true`、`MOCK_LLM=true`、`MOCK_PAY=true`、`MOCK_ALMANAC=true`
2. 登录：`POST /api/auth/wechat/login` body `{"code":"mock-code"}`，拿到 `access_token`
3. 创建档案：`POST /api/newborns` 带 token，body 含 `surname`、`gender`、`birth_date` 等，拿到 `newborn_id`
4. 生成：`POST /api/names/generate` body `{"newborn_id": 1}`，第 1 次返回 `is_unlocked: true`，第 2/3 次 `is_unlocked: false`
5. Mock 支付：`POST /api/payments/mock/pay` body `{"batch_id": 2}`，再 `GET /api/names/batches/2/reasons` 可得详细原因
