# 用户授权和每日限流功能设计

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:writing-plans to implement this plan.

**Goal:** 在生成名字前检查用户授权，未授权则弹窗授权；授权后每个用户每天限制3次生成，超过限制显示提示。

**Architecture:** 前端添加授权弹窗组件，点击生成时先调用状态检查接口；后端新增用户状态接口和授权接口，修改生成接口添加限流检查，使用新表 `generation_quotas` 记录每日使用次数。

**Tech Stack:** Vue 3 (uni-app) + FastAPI + MySQL

---

## 需求概述

### 用户故事

1. **授权检查** - 用户点击"生成好名字"时，前端先检查是否已授权微信用户信息
2. **授权弹窗** - 未授权时弹出从下往上滑入的授权弹窗，使用微信原生授权组件
3. **信息保存** - 用户授权后，将昵称和头像保存到数据库
4. **每日限流** - 每个用户每天限制3次生成（按自然日0点重置）
5. **限流提示** - 超过限制时显示"今日生成次数已用完，明天再来吧"

### 非功能需求

- 限流计数在点击生成时增加（无论成功失败）
- 授权状态和剩余次数一次请求获取，减少网络开销
- 所有限流逻辑在后端实现，防止绕过

---

## 数据库设计

### 新增表：generation_quotas

用于记录每个用户每天的生成次数。

```sql
CREATE TABLE generation_quotas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    date DATE NOT NULL COMMENT '日期（YYYY-MM-DD）',
    used_count INT DEFAULT 0 COMMENT '已使用次数',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_date (user_id, date),
    INDEX idx_user_date (user_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户每日生成次数配额';
```

**字段说明：**
- `user_id` - 用户ID（外键关联 users 表）
- `date` - 日期（DATE类型，YYYY-MM-DD格式）
- `used_count` - 已使用次数（默认0）
- `unique_user_date` - 唯一索引，确保每个用户每天只有一条记录

**查询优化：**
- 复合索引 `(user_id, date)` 加速查询

---

## 后端设计

### 1. 数据库迁移

**文件：** `migrations/versions/003_add_generation_quotas.py`

**内容：**
- upgrade: 创建 `generation_quotas` 表
- downgrade: 删除 `generation_quotas` 表

### 2. 模型层

**文件：** `app/models.py`

新增模型类：
```python
class GenerationQuota(Base):
    __tablename__ = "generation_quotas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)
    used_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
```

### 3. 新增路由

**文件：** `app/routers/user.py`

#### 接口1：GET /api/user/check-status

检查用户授权状态和今日剩余次数。

**请求：**
- Headers: `Authorization: Bearer <token>`

**响应：**
```json
{
  "authorized": true,
  "remaining_quota": 2,
  "user_info": {
    "nickname": "张三",
    "avatar_url": "https://..."
  }
}
```

**字段说明：**
- `authorized` - 是否已授权（nickname 和 avatar_url 都不为空）
- `remaining_quota` - 今日剩余次数（0-3）
- `user_info` - 用户信息（仅当 authorized=true 时返回）

**业务逻辑：**
```python
1. 检查 user.nickname 和 user.avatar_url 是否都不为空
   - 都不为空 → authorized = true
   - 任一为空 → authorized = false

2. 查询今日配额记录：
   today = datetime.now().date()
   quota = db.query(GenerationQuota).filter(
       GenerationQuota.user_id == current_user.id,
       GenerationQuota.date == today
   ).first()

3. 计算剩余次数：
   if not quota:
       remaining = 3
   else:
       remaining = max(0, 3 - quota.used_count)

4. 返回结果
```

#### 接口2：POST /api/user/authorize

保存用户授权信息（昵称、头像）。

**请求：**
- Headers: `Authorization: Bearer <token>`
- Body:
```json
{
  "nickname": "张三",
  "avatar_url": "https://thirdwx.qlogo.cn/..."
}
```

**响应：**
```json
{
  "success": true,
  "message": "授权成功"
}
```

**业务逻辑：**
```python
1. 验证 nickname 和 avatar_url 不为空
2. 更新 users 表：
   UPDATE users
   SET nickname = ?, avatar_url = ?, updated_at = NOW()
   WHERE id = current_user.id
3. 返回成功
```

### 4. 修改现有路由

**文件：** `app/routers/generate.py`

在 `POST /api/generate` 接口开头添加限流检查。

**修改位置：** 第 65 行 `def generate(...)` 函数开头

**新增逻辑：**
```python
# 1. 检查今日剩余次数
today = datetime.now().date()
quota = db.query(GenerationQuota).filter(
    GenerationQuota.user_id == current_user.id,
    GenerationQuota.date == today
).first()

if quota and quota.used_count >= 3:
    raise HTTPException(
        status_code=429,
        detail="今日生成次数已用完，明天再来吧"
    )

# 2. 增加使用次数
if not quota:
    quota = GenerationQuota(
        user_id=current_user.id,
        date=today,
        used_count=1
    )
    db.add(quota)
else:
    quota.used_count += 1

db.commit()

# 3. 原有生成逻辑...
```

---

## 前端设计

### 1. 新增授权弹窗组件

**文件：** `src/components/AuthModal.vue`

**功能：**
- 从底部向上滑入动画（与微信小程序风格一致）
- 显示授权说明文案
- 微信授权按钮（使用 `<button open-type="getUserProfile">`）
- 获取用户信息后调用 `POST /api/user/authorize` 保存
- 授权成功后关闭弹窗，触发父组件回调

**Props：**
```typescript
{
  visible: boolean,  // 是否显示弹窗
  onSuccess: () => void  // 授权成功回调
}
```

**事件：**
- `@close` - 关闭弹窗
- `@success` - 授权成功

**UI设计：**
```
遮罩层（半透明黑色）
  ↓
卡片（白色，圆角顶部，从底部滑入）
  - 图标：🎭
  - 标题："需要您的授权"
  - 说明文字：
    "为了提供个性化服务，需要获取您的：
     • 头像和昵称

     您的信息将被安全保存，仅用于本小程序。"
  - 授权按钮（微信原生样式）
  - 取消按钮（文字链接）
```

**注意事项：**
- 微信小程序获取用户信息的API已更新：
  - 旧API：`getUserInfo`（已废弃）
  - 新API：`getUserProfile`（需要用户主动点击按钮触发）
- 按钮使用 `<button open-type="getUserProfile">` 触发授权

### 2. 修改首页

**文件：** `src/pages/index/index.vue`

**新增状态：**
```javascript
const showAuthModal = ref(false)  // 是否显示授权弹窗
```

**修改 onSubmit 函数：**

**原流程：**
```
点击生成 → 表单验证 → 调用 /api/generate → 跳转结果页
```

**新流程：**
```
点击生成
  ↓
表单验证
  ↓
调用 GET /api/user/check-status
  ↓
判断 authorized
  ├─ false → 显示授权弹窗 → 等待授权 → 重新检查状态
  └─ true → 判断 remaining_quota
              ├─ > 0 → 调用 /api/generate → 跳转结果页
              └─ = 0 → 显示 Toast "今日生成次数已用完，明天再来吧"
```

**代码结构：**
```javascript
async function onSubmit() {
  // 1. 表单验证
  if (!form.surname.trim()) {
    uni.showToast({ title: '请填写姓氏', icon: 'none' })
    return
  }
  if (!form.birth_date) {
    uni.showToast({ title: '请选择出生日期', icon: 'none' })
    return
  }

  // 2. 检查用户状态
  try {
    const statusRes = await request({
      url: '/api/user/check-status',
      method: 'GET'
    })

    // 3. 未授权，显示授权弹窗
    if (!statusRes.authorized) {
      showAuthModal.value = true
      return
    }

    // 4. 次数用完，显示提示
    if (statusRes.remaining_quota <= 0) {
      uni.showToast({
        title: '今日生成次数已用完，明天再来吧',
        icon: 'none',
        duration: 2000
      })
      return
    }

    // 5. 显示剩余次数提示（可选）
    if (statusRes.remaining_quota <= 1) {
      uni.showToast({
        title: `今日还剩 ${statusRes.remaining_quota} 次机会`,
        icon: 'none',
        duration: 1500
      })
    }

    // 6. 继续原有生成逻辑
    await generateNames()
  } catch (e) {
    uni.showToast({ title: e.message || '检查失败', icon: 'none' })
  }
}

// 授权成功回调
async function onAuthSuccess() {
  showAuthModal.value = false
  // 重新提交生成
  await onSubmit()
}
```

---

## 用户交互流程

### 场景1：首次使用，未授权

```
用户填写表单 → 点击"生成好名字"
  ↓
前端调用 GET /api/user/check-status
  ↓
后端返回：{ authorized: false, remaining_quota: 3 }
  ↓
前端显示授权弹窗（从底部滑入）
  ↓
用户点击"微信授权"按钮
  ↓
微信弹出授权确认
  ↓
用户确认授权
  ↓
前端获取 nickname, avatar_url
  ↓
前端调用 POST /api/user/authorize 保存
  ↓
后端更新 users 表，返回成功
  ↓
前端关闭授权弹窗，重新调用 onSubmit
  ↓
前端调用 GET /api/user/check-status
  ↓
后端返回：{ authorized: true, remaining_quota: 3 }
  ↓
前端调用 POST /api/generate
  ↓
后端增加配额计数，生成名字
  ↓
前端跳转到结果页
```

### 场景2：已授权，今日第1次生成

```
用户填写表单 → 点击"生成好名字"
  ↓
前端调用 GET /api/user/check-status
  ↓
后端返回：{ authorized: true, remaining_quota: 3 }
  ↓
前端调用 POST /api/generate
  ↓
后端增加配额计数（today_count: 0 → 1）
  ↓
后端生成名字，返回结果
  ↓
前端跳转到结果页
```

### 场景3：已授权，今日第3次生成

```
用户填写表单 → 点击"生成好名字"
  ↓
前端调用 GET /api/user/check-status
  ↓
后端返回：{ authorized: true, remaining_quota: 1 }
  ↓
前端提示："今日还剩 1 次机会"（Toast）
  ↓
前端调用 POST /api/generate
  ↓
后端增加配额计数（today_count: 2 → 3）
  ↓
后端生成名字，返回结果
  ↓
前端跳转到结果页
```

### 场景4：已授权，今日已用完3次

```
用户填写表单 → 点击"生成好名字"
  ↓
前端调用 GET /api/user/check-status
  ↓
后端返回：{ authorized: true, remaining_quota: 0 }
  ↓
前端显示 Toast："今日生成次数已用完，明天再来吧"
  ↓
流程结束（不调用生成接口）
```

---

## 错误处理

### 前端错误处理

1. **网络请求失败**
   - 显示 Toast："网络异常，请稍后重试"

2. **授权取消**
   - 用户点击授权弹窗的"取消"或"×"
   - 关闭弹窗，不执行任何操作

3. **授权失败**
   - 微信授权API返回错误
   - 显示 Toast："授权失败，请重试"

### 后端错误处理

1. **429 Too Many Requests**
   - 今日次数已用完
   - 返回：`{ detail: "今日生成次数已用完，明天再来吧" }`

2. **401 Unauthorized**
   - Token 无效或过期
   - 返回：`{ detail: "登录已过期，请重新登录" }`

3. **400 Bad Request**
   - 授权信息缺失（nickname 或 avatar_url 为空）
   - 返回：`{ detail: "授权信息不完整" }`

---

## 测试要点

### 后端测试

1. **check-status 接口**
   - 未授权用户 → authorized=false
   - 已授权用户 → authorized=true, user_info 正确
   - 今日未生成 → remaining_quota=3
   - 今日已生成1次 → remaining_quota=2
   - 今日已生成3次 → remaining_quota=0

2. **authorize 接口**
   - 保存成功 → users 表更新 nickname, avatar_url
   - 缺少参数 → 返回 400 错误

3. **generate 接口限流**
   - 今日第1次生成 → 成功，quota.used_count=1
   - 今日第3次生成 → 成功，quota.used_count=3
   - 今日第4次生成 → 返回 429 错误

4. **跨天测试**
   - 昨天生成3次，今天 → remaining_quota=3

### 前端测试

1. **授权弹窗**
   - 未授权时点击生成 → 显示弹窗
   - 点击授权按钮 → 调用微信授权API
   - 授权成功 → 关闭弹窗，继续生成

2. **限流提示**
   - 剩余1次 → 显示提示
   - 剩余0次 → 显示"已用完"提示，不调用生成接口

3. **用户体验**
   - 授权弹窗动画流畅（从底部滑入）
   - Toast 提示清晰易懂
   - 网络请求失败有友好提示

---

## 部署注意事项

1. **数据库迁移**
   ```bash
   cd /root/app/weixin/neoname
   conda activate neoname
   alembic upgrade head
   ```

2. **重启服务**
   ```bash
   pm2 restart neoname
   ```

3. **微信小程序配置**
   - 确保小程序已配置 `getUserProfile` 权限
   - 确保服务器域名在小程序后台白名单中

4. **监控**
   - 监控 429 错误频率（如果过高，说明限流参数需要调整）
   - 监控授权成功率

---

## 未来扩展

1. **VIP会员功能**
   - 在 `users` 表添加 `vip_level` 字段
   - VIP用户每日次数提升至10次或不限

2. **配额购买**
   - 允许用户购买额外生成次数
   - 在 `generation_quotas` 表添加 `purchased_count` 字段

3. **历史统计**
   - 基于 `generation_quotas` 表统计用户使用习惯
   - 分析高峰时段，优化服务器资源

4. **动态限流**
   - 根据服务器负载动态调整每日次数
   - 新用户首日赠送额外次数
