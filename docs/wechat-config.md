# 微信小程序配置清单

## 小程序基础

- 小程序 AppID、AppSecret：在微信公众平台 → 开发 → 开发管理 中获取
- 服务器域名：request 合法域名配置为 `https://zhitu.com`（或实际 API 域名）
- 业务域名：若 H5 使用同域则配置一致

## 登录与手机号

- 使用 `wx.login` 获取 `code`，后端用 `code2session` 换 openid/session_key
- 手机号：使用 button `open-type="getPhoneNumber"` 获取加密数据，后端用 session_key 解密（或使用 getPhoneNumber 新接口返回的 code 由后端解密）
- 若需 unionid：在微信开放平台绑定小程序，并满足 unionid 获取条件

## 支付

- 商户号：微信支付商户平台
- 小程序支付：在商户平台关联小程序 AppID
- API 密钥（v2）或证书：用于下单与回调验签
- 支付结果回调 URL：`https://zhitu.com/api/payments/notify`（或实际路径），在商户后台配置
- 回调需验签、幂等处理重复通知、更新订单状态并解锁对应 name_batch

## 环境变量（勿写密钥入仓库）

- 后端从环境变量读取：小程序 AppID、AppSecret、支付商户号、API 密钥等
- 部署时在服务器 `.env` 或系统环境中配置
