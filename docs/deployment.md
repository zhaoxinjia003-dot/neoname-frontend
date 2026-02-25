# 部署指南

## 目标环境

- Ubuntu 服务器
- 域名：https://zhitu.com
- 后端：FastAPI（uvicorn）
- 数据库：PostgreSQL（库名 `neoname`）

## 步骤概要

1. 服务器安装 Python 3.11、PostgreSQL 客户端、Nginx
2. 克隆代码，创建 conda 环境 `neoname`，安装依赖，配置 `.env`（不写入仓库）
3. 执行 `alembic upgrade head` 完成迁移
4. 使用 systemd 或 supervisor 运行 uvicorn（如监听 127.0.0.1:8000）
5. Nginx 反向代理到后端，配置 HTTPS（证书用 Let’s Encrypt 或已有证书）
6. 小程序前端构建：`pnpm build:mp-weixin`，将产物上传微信小程序后台

## 环境变量清单

- `DB_HOST`、`DB_PORT`、`DB_USER`、`DB_PASSWORD`、`DB_NAME`：数据库连接
- `MOCK_WECHAT`、`MOCK_LLM`、`MOCK_PAY`、`MOCK_ALMANAC`：生产建议 false
- `OPENAI_API_KEY` 或 `MINIMAX_API_KEY`：LLM 调用
- 微信：小程序 AppID、AppSecret（用于 code2session 等，勿写入仓库）
- 支付：微信支付商户号、API 密钥等（勿写入仓库）

## Nginx 示例

```nginx
server {
    listen 443 ssl;
    server_name zhitu.com;
    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 微信配置清单

见 `docs/wechat-config.md`。
