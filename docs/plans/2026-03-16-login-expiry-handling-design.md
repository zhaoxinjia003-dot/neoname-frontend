# 登录过期处理设计文档

> **创建日期**: 2026-03-16
> **状态**: 已批准

## 目标

修复前端登录过期处理逻辑，实现"一次授权，永久登录"的用户体验。

## 问题描述

当前问题：
1. 用户本地有 token 但已过期时，`check-status` 返回 401 错误
2. 前端只显示错误提示，没有自动重新登录
3. 用户需要手动清除缓存才能重新使用

期望体验：
- **首次用户**：需要微信授权（getUserProfile），保存用户信息到数据库
- **已授权用户**：token 过期时自动静默重新登录，无需再次授权

## 核心设计原则

**一次授权，永久登录**
- getUserProfile 授权只需要一次
- 后续 token 过期只需要静默调用 `uni.login()` 重新登录
- 后端根据 openid 识别已授权用户，直接返回新 token

## 架构设计

### 流程重构

将 `onSubmit()` 函数拆分为 4 个独立步骤：

```
onSubmit()
  ↓
1. validateForm() - 表单验证
  ↓
2. ensureLogin() - 确保有效 token
  ↓
3. ensureAuthorization() - 确保用户授权
  ↓
4. generateNames() - 生成名字
```

### 详细流程

#### 1. validateForm()
验证表单字段（姓氏、出生日期）

#### 2. ensureLogin()
**目标**：确保本地有有效的 token

**逻辑**：
- 检查本地 storage 是否有 token
- 如果有 → 直接返回（假设有效，后续 API 会验证）
- 如果无 → 调用微信登录流程：
  ```javascript
  uni.login({ provider: 'weixin' })
    → 获取微信 code
    → 调用 /api/auth/wechat/login
    → 保存 token 到本地
  ```

#### 3. ensureAuthorization()
**目标**：确保用户已授权且有配额

**逻辑**：
```
调用 /api/user/check-status
  ↓
如果返回 401（token 过期）
  ↓
  清除本地 token
  ↓
  重新调用 ensureLogin()
  ↓
  重新调用 check-status（最多重试一次）
  ↓
如果 authorized=false（未授权）
  ↓
  显示授权弹窗 AuthModal
  ↓
  等待用户授权（getUserProfile）
  ↓
  调用 /api/user/authorize 保存用户信息
  ↓
如果 authorized=true 且 remaining_quota=0（配额用完）
  ↓
  显示提示，返回 false
  ↓
如果 authorized=true 且有配额
  ↓
  返回 true，继续流程
```

#### 4. generateNames()
调用生成接口并跳转到结果页（现有逻辑保持不变）

## 数据流

### 首次用户
```
用户点击"生成好名字"
  → ensureLogin()
    → uni.login() 获取 code
    → /api/auth/wechat/login (创建用户，只有 openid)
    → 保存 token
  → ensureAuthorization()
    → /api/user/check-status (authorized=false)
    → 显示 AuthModal
    → 用户点击授权 → getUserProfile
    → /api/user/authorize 保存 nickname/avatar_url
  → generateNames()
```

### 已授权用户（token 有效）
```
用户点击"生成好名字"
  → ensureLogin() (本地有 token，直接返回)
  → ensureAuthorization()
    → /api/user/check-status (authorized=true, remaining_quota>0)
  → generateNames()
```

### 已授权用户（token 过期）
```
用户点击"生成好名字"
  → ensureLogin() (本地有 token，直接返回)
  → ensureAuthorization()
    → /api/user/check-status (返回 401)
    → 清除本地 token
    → 重新调用 ensureLogin()
      → uni.login() 获取 code
      → /api/auth/wechat/login (匹配到已有用户，返回新 token)
    → 重新调用 check-status (authorized=true, 因为数据库中已有用户信息)
  → generateNames()
```

## 错误处理

### 1. 微信登录失败
```javascript
try {
  const loginResult = await uni.login({ provider: 'weixin' })
} catch (e) {
  uni.showToast({ title: '微信登录失败，请重试', icon: 'none' })
  return
}
```

### 2. check-status 重试后仍然 401
```javascript
// 最多重试一次，如果仍然失败，显示错误
if (retryCount >= 1) {
  uni.showToast({ title: '登录失败，请稍后重试', icon: 'none' })
  return false
}
```

### 3. 用户取消授权
```javascript
// AuthModal 组件中，用户点击"稍后再说"
emit('close')  // 关闭弹窗，不继续流程
```

### 4. 授权接口失败
```javascript
try {
  await request({ url: '/api/user/authorize', ... })
} catch (e) {
  uni.showToast({ title: '授权失败，请重试', icon: 'none' })
  // 不关闭弹窗，允许用户重试
}
```

## 边界情况

| 场景 | 处理方式 |
|------|---------|
| 用户多次点击"生成好名字" | 第一次点击时显示 loading，禁用按钮 |
| 网络断开 | 请求失败，显示错误提示 |
| 微信登录返回错误 code | 捕获异常，提示用户重试 |
| check-status 无限返回 401 | 最多重试一次，避免无限循环 |
| 配额用完 | 显示提示后结束流程，不继续生成 |

## 文件修改

**修改文件：**
- `src/pages/index/index.vue` - 重构 onSubmit 函数，添加 ensureLogin 和 ensureAuthorization 函数

**不修改：**
- `src/utils/request.js` - 保持现有实现，不添加全局 401 拦截
- `src/components/AuthModal.vue` - 保持现有实现
- 后端接口 - 无需修改

## 测试场景

1. **首次用户测试**
   - 清除小程序缓存
   - 点击"生成好名字"
   - 应弹出授权窗口
   - 授权后应成功生成

2. **已授权用户测试**
   - 已授权用户
   - 点击"生成好名字"
   - 不应弹出授权窗口
   - 直接生成名字

3. **Token 过期测试**
   - 已授权用户
   - 手动删除本地 token（或等待 token 过期）
   - 点击"生成好名字"
   - 应自动重新登录（无需授权）
   - 成功生成名字

4. **配额用完测试**
   - 今日已生成 3 次
   - 点击"生成好名字"
   - 应显示"今日次数已用完"

5. **用户取消授权测试**
   - 首次用户
   - 点击"生成好名字"
   - 弹出授权窗口后点击"稍后再说"
   - 应关闭窗口，不继续流程

## 优势

1. **用户体验好**：授权一次，永久登录
2. **改动集中**：只修改一个文件（index.vue）
3. **易于维护**：逻辑清晰，步骤分明
4. **避免递归**：不使用 onSubmit 递归调用
5. **符合 YAGNI**：只在需要的地方处理 token 过期

## 风险与限制

1. **用户清除数据**：如果用户在微信中清除小程序数据，本地 token 会丢失，需要重新登录（但无需重新授权）
2. **openid 变化**：极少数情况下微信 openid 可能变化，会被识别为新用户
3. **数据库用户被删除**：如果后端删除用户数据，用户需要重新授权

## 后续优化

如果未来有更多功能需要登录，可以考虑：
1. 在 `request.js` 中添加全局 401 拦截
2. 封装通用的登录状态管理（Vuex 或 Pinia）
3. 添加 token 刷新机制（refresh token）

但当前阶段，遵循 YAGNI 原则，只实现必要的功能。
