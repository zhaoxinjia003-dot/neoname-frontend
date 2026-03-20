# 用户授权和每日限流功能实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在生成名字前检查用户授权，未授权则弹窗授权；授权后每个用户每天限制3次生成，超过限制显示提示

**Architecture:** 后端新增 generation_quotas 表和用户状态接口，修改生成接口添加限流；前端新增授权弹窗组件，修改首页添加状态检查逻辑

**Tech Stack:** Vue 3 (uni-app) + FastAPI + MySQL + Alembic

---

## 任务总览

| 任务 | 描述 | 文件 |
|------|------|------|
| Task 1 | 创建数据库迁移文件 | migrations/versions/003_add_generation_quotas.py |
| Task 2 | 添加 GenerationQuota 模型 | app/models.py |
| Task 3 | 创建用户路由文件 | app/routers/user.py |
| Task 4 | 实现 check-status 接口 | app/routers/user.py |
| Task 5 | 实现 authorize 接口 | app/routers/user.py |
| Task 6 | 注册用户路由 | app/main.py |
| Task 7 | 修改生成接口添加限流 | app/routers/generate.py |
| Task 8 | 执行数据库迁移 | 命令行 |
| Task 9 | 创建授权弹窗组件 | src/components/AuthModal.vue |
| Task 10 | 修改首页添加授权检查 | src/pages/index/index.vue |
| Task 11 | 本地测试验证 | 浏览器/微信开发者工具 |

---

## Task 1: 创建数据库迁移文件

**Files:**
- Create: `/Users/jiazhaoxin/zhitu/Home/weixin/neoname/neoname/migrations/versions/003_add_generation_quotas.py`

**Step 1: 创建迁移文件**

创建文件 `migrations/versions/003_add_generation_quotas.py`，内容如下：

```python
"""add generation quotas table

Revision ID: 003
Revises: 002
Create Date: 2026-03-16

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "generation_quotas",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("used_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "date", name="unique_user_date"),
    )
    op.create_index("idx_user_date", "generation_quotas", ["user_id", "date"])


def downgrade() -> None:
    op.drop_index("idx_user_date", table_name="generation_quotas")
    op.drop_table("generation_quotas")
```

**Step 2: 验证迁移文件语法**

```bash
cd /Users/jiazhaoxin/zhitu/Home/weixin/neoname/neoname
python -m py_compile migrations/versions/003_add_generation_quotas.py
```

预期：无输出表示语法正确

---

## Task 2: 添加 GenerationQuota 模型

**Files:**
- Modify: `/Users/jiazhaoxin/zhitu/Home/weixin/neoname/neoname/app/models.py:77`

**Step 1: 在 models.py 末尾添加 GenerationQuota 模型**

在 `Payment` 类定义后面（第77行之后）添加：

```python


class GenerationQuota(Base):
    __tablename__ = "generation_quotas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)
    used_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
```

**Step 2: 确保导入了 Date 类型**

检查文件顶部的导入语句（第2行），确保包含 `Date`：

```python
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Date, ForeignKey, Text, Numeric
```

如果没有 `Date`，需要添加。

**Step 3: 验证语法**

```bash
cd /Users/jiazhaoxin/zhitu/Home/weixin/neoname/neoname
python -c "from app.models import GenerationQuota; print('模型导入成功')"
```

预期输出：`模型导入成功`

---

## Task 3: 创建用户路由文件

**Files:**
- Create: `/Users/jiazhaoxin/zhitu/Home/weixin/neoname/neoname/app/routers/user.py`

**Step 1: 创建基础路由文件**

创建文件 `app/routers/user.py`，内容如下：

```python
from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User, GenerationQuota
from app.auth import require_user

router = APIRouter(prefix="/api/user", tags=["user"])


class UserInfo(BaseModel):
    nickname: str
    avatar_url: str


class CheckStatusResponse(BaseModel):
    authorized: bool
    remaining_quota: int
    user_info: Optional[UserInfo] = None


class AuthorizeRequest(BaseModel):
    nickname: str
    avatar_url: str


class AuthorizeResponse(BaseModel):
    success: bool
    message: str


# 接口将在后续任务中添加
```

**Step 2: 验证语法**

```bash
cd /Users/jiazhaoxin/zhitu/Home/weixin/neoname/neoname
python -m py_compile app/routers/user.py
```

预期：无输出表示语法正确

---

## Task 4: 实现 check-status 接口

**Files:**
- Modify: `/Users/jiazhaoxin/zhitu/Home/weixin/neoname/neoname/app/routers/user.py`

**Step 1: 在 user.py 末尾添加 check-status 接口**

在文件末尾（`# 接口将在后续任务中添加` 处）添加：

```python
@router.get("/check-status", response_model=CheckStatusResponse)
def check_status(
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """
    检查用户授权状态和今日剩余生成次数

    Returns:
        - authorized: 是否已授权（nickname 和 avatar_url 都不为空）
        - remaining_quota: 今日剩余次数（0-3）
        - user_info: 用户信息（仅当 authorized=true 时返回）
    """
    # 1. 检查是否已授权
    authorized = bool(current_user.nickname and current_user.avatar_url)

    # 2. 查询今日配额
    today = date.today()
    quota = db.query(GenerationQuota).filter(
        GenerationQuota.user_id == current_user.id,
        GenerationQuota.date == today
    ).first()

    # 3. 计算剩余次数
    if not quota:
        remaining = 3
    else:
        remaining = max(0, 3 - quota.used_count)

    # 4. 返回结果
    user_info = None
    if authorized:
        user_info = UserInfo(
            nickname=current_user.nickname,
            avatar_url=current_user.avatar_url
        )

    return CheckStatusResponse(
        authorized=authorized,
        remaining_quota=remaining,
        user_info=user_info
    )
```

**Step 2: 验证语法**

```bash
cd /Users/jiazhaoxin/zhitu/Home/weixin/neoname/neoname
python -m py_compile app/routers/user.py
```

预期：无输出表示语法正确

---

## Task 5: 实现 authorize 接口

**Files:**
- Modify: `/Users/jiazhaoxin/zhitu/Home/weixin/neoname/neoname/app/routers/user.py`

**Step 1: 在 check-status 接口后面添加 authorize 接口**

在 `check_status` 函数后面添加：

```python
@router.post("/authorize", response_model=AuthorizeResponse)
def authorize(
    body: AuthorizeRequest,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    """
    保存用户授权信息（昵称、头像）

    Args:
        body: 包含 nickname 和 avatar_url

    Returns:
        - success: 是否成功
        - message: 提示信息
    """
    # 1. 验证参数
    if not body.nickname or not body.nickname.strip():
        raise HTTPException(status_code=400, detail="昵称不能为空")

    if not body.avatar_url or not body.avatar_url.strip():
        raise HTTPException(status_code=400, detail="头像地址不能为空")

    # 2. 更新用户信息
    current_user.nickname = body.nickname.strip()
    current_user.avatar_url = body.avatar_url.strip()
    current_user.updated_at = datetime.utcnow()

    db.commit()

    return AuthorizeResponse(
        success=True,
        message="授权成功"
    )
```

**Step 2: 验证语法**

```bash
cd /Users/jiazhaoxin/zhitu/Home/weixin/neoname/neoname
python -m py_compile app/routers/user.py
```

预期：无输出表示语法正确

---

## Task 6: 注册用户路由

**Files:**
- Modify: `/Users/jiazhaoxin/zhitu/Home/weixin/neoname/neoname/app/main.py`

**Step 1: 查看现有路由注册**

读取 `app/main.py` 文件，查看现有的路由注册方式。

**Step 2: 导入并注册用户路由**

在导入区域添加：

```python
from app.routers import user
```

在路由注册区域添加：

```python
app.include_router(user.router)
```

具体位置参考现有的 `auth.router` 和 `generate.router` 注册位置。

**Step 3: 验证应用启动**

```bash
cd /Users/jiazhaoxin/zhitu/Home/weixin/neoname/neoname
python -c "from app.main import app; print('应用启动成功')"
```

预期输出：`应用启动成功`

---

## Task 7: 修改生成接口添加限流

**Files:**
- Modify: `/Users/jiazhaoxin/zhitu/Home/weixin/neoname/neoname/app/routers/generate.py:65-70`

**Step 1: 导入必要的模块**

在文件顶部（第1-10行）的导入区域添加：

```python
from datetime import date
from fastapi import HTTPException
from app.models import GenerationQuota
```

注意：检查是否已存在这些导入，避免重复。

**Step 2: 在 generate 函数开头添加限流检查**

在 `def generate(...)` 函数内部，`settings = get_settings()` 后面（约第70行），添加限流逻辑：

```python
    # === 限流检查 ===
    # 1. 查询今日配额
    today = date.today()
    quota = db.query(GenerationQuota).filter(
        GenerationQuota.user_id == current_user.id,
        GenerationQuota.date == today
    ).first()

    # 2. 检查是否超限
    if quota and quota.used_count >= 3:
        raise HTTPException(
            status_code=429,
            detail="今日生成次数已用完，明天再来吧"
        )

    # 3. 增加使用次数
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
    # === 限流检查结束 ===
```

**Step 3: 添加 db 参数（如果缺失）**

检查 `generate` 函数签名，确保包含 `db: Session = Depends(get_db)`。

如果缺失，需要：
1. 在函数参数中添加 `db: Session = Depends(get_db)`
2. 在顶部导入 `from app.db import get_db`

**Step 4: 验证语法**

```bash
cd /Users/jiazhaoxin/zhitu/Home/weixin/neoname/neoname
python -m py_compile app/routers/generate.py
```

预期：无输出表示语法正确

---

## Task 8: 执行数据库迁移

**Files:**
- 数据库表结构

**Step 1: 激活 conda 环境**

```bash
source ~/miniforge3/etc/profile.d/conda.sh
conda activate neoname
```

预期：命令提示符显示 `(neoname)`

**Step 2: 进入项目目录**

```bash
cd /Users/jiazhaoxin/zhitu/Home/weixin/neoname/neoname
```

**Step 3: 查看待执行的迁移**

```bash
alembic current
alembic heads
```

预期：
- `current` 显示当前版本（应该是 002）
- `heads` 显示最新版本（应该是 003）

**Step 4: 执行迁移**

```bash
alembic upgrade head
```

预期输出类似：
```
INFO  [alembic.runtime.migration] Running upgrade 002 -> 003, add generation quotas table
```

**Step 5: 验证表创建成功**

```bash
mysql -h rm-bp1mn9sjp62lr5twwno.mysql.rds.aliyuncs.com -u yuanzhitu1 -p'YZT@zhaoxin2026' neoname -e "SHOW TABLES LIKE 'generation_quotas';"
```

预期输出：
```
+-------------------------------------------+
| Tables_in_neoname (generation_quotas)     |
+-------------------------------------------+
| generation_quotas                         |
+-------------------------------------------+
```

**Step 6: 检查表结构**

```bash
mysql -h rm-bp1mn9sjp62lr5twwno.mysql.rds.aliyuncs.com -u yuanzhitu1 -p'YZT@zhaoxin2026' neoname -e "DESCRIBE generation_quotas;"
```

预期输出：
```
+------------+----------+------+-----+-------------------+
| Field      | Type     | Null | Key | Default           |
+------------+----------+------+-----+-------------------+
| id         | int      | NO   | PRI | NULL              |
| user_id    | int      | NO   | MUL | NULL              |
| date       | date     | NO   |     | NULL              |
| used_count | int      | NO   |     | 0                 |
| created_at | datetime | NO   |     | CURRENT_TIMESTAMP |
+------------+----------+------+-----+-------------------+
```

---

## Task 9: 创建授权弹窗组件

**Files:**
- Create: `/Users/jiazhaoxin/zhitu/Home/weixin/neoname/neoname-frontend/src/components/AuthModal.vue`

**Step 1: 创建 components 目录（如果不存在）**

```bash
mkdir -p /Users/jiazhaoxin/zhitu/Home/weixin/neoname/neoname-frontend/src/components
```

**Step 2: 创建 AuthModal.vue 文件**

创建文件 `src/components/AuthModal.vue`，内容如下：

```vue
<template>
  <!-- 遮罩层 -->
  <view class="modal-mask" v-if="visible" @click="onClose">
    <!-- 授权卡片 -->
    <view class="modal-card" @click.stop :class="{ show: visible }">
      <!-- 图标 -->
      <view class="modal-icon">🎭</view>

      <!-- 标题 -->
      <view class="modal-title">需要您的授权</view>

      <!-- 说明文字 -->
      <view class="modal-desc">
        <text>为了提供个性化服务，需要获取您的：</text>
        <text class="modal-desc-item">• 头像和昵称</text>
        <text class="modal-desc-note">您的信息将被安全保存，仅用于本小程序。</text>
      </view>

      <!-- 授权按钮 -->
      <button
        class="modal-btn primary"
        open-type="getUserProfile"
        @getuserprofile="onGetUserProfile"
      >
        微信授权
      </button>

      <!-- 取消按钮 -->
      <view class="modal-cancel" @click="onClose">
        稍后再说
      </view>
    </view>
  </view>
</template>

<script setup>
import { request } from '../utils/request.js'

const props = defineProps({
  visible: Boolean
})

const emit = defineEmits(['close', 'success'])

function onClose() {
  emit('close')
}

async function onGetUserProfile(e) {
  const { userInfo } = e.detail

  if (!userInfo) {
    uni.showToast({ title: '授权取消', icon: 'none' })
    return
  }

  try {
    // 调用后端保存用户信息
    await request({
      url: '/api/user/authorize',
      method: 'POST',
      data: {
        nickname: userInfo.nickName,
        avatar_url: userInfo.avatarUrl
      }
    })

    uni.showToast({ title: '授权成功', icon: 'success' })
    emit('success')
  } catch (e) {
    console.error('授权失败:', e)
    uni.showToast({ title: e.message || '授权失败，请重试', icon: 'none' })
  }
}
</script>

<style lang="scss" scoped>
$primary: #c85a28;
$foreground: #2d2620;
$muted: #7a726b;
$card: #fdf9f2;

.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: flex-end;
}

.modal-card {
  width: 100%;
  background: $card;
  border-radius: 32rpx 32rpx 0 0;
  padding: 48rpx 40rpx;
  padding-bottom: calc(48rpx + env(safe-area-inset-bottom));
  transform: translateY(100%);
  transition: transform 0.3s ease;

  &.show {
    transform: translateY(0);
  }
}

.modal-icon {
  font-size: 80rpx;
  text-align: center;
  margin-bottom: 24rpx;
}

.modal-title {
  font-size: 36rpx;
  font-weight: 600;
  color: $foreground;
  text-align: center;
  margin-bottom: 24rpx;
}

.modal-desc {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  font-size: 26rpx;
  color: $muted;
  line-height: 1.6;
  margin-bottom: 40rpx;
}

.modal-desc-item {
  padding-left: 16rpx;
  color: $foreground;
}

.modal-desc-note {
  font-size: 22rpx;
  opacity: 0.8;
  margin-top: 8rpx;
}

.modal-btn {
  width: 100%;
  height: 96rpx;
  border-radius: 24rpx;
  font-size: 30rpx;
  font-weight: 600;
  border: none;
  margin-bottom: 16rpx;

  &.primary {
    background: linear-gradient(135deg, $primary 0%, darken($primary, 10%) 100%);
    color: #fff;
    box-shadow: 0 8rpx 24rpx rgba($primary, 0.3);
  }
}

.modal-cancel {
  text-align: center;
  font-size: 26rpx;
  color: $muted;
  padding: 16rpx;
}
</style>
```

**Step 3: 验证文件创建**

```bash
ls -la /Users/jiazhaoxin/zhitu/Home/weixin/neoname/neoname-frontend/src/components/AuthModal.vue
```

预期：显示文件信息

---

## Task 10: 修改首页添加授权检查

**Files:**
- Modify: `/Users/jiazhaoxin/zhitu/Home/weixin/neoname/neoname-frontend/src/pages/index/index.vue`

**Step 1: 在 script setup 中导入 AuthModal 组件**

在 `<script setup>` 的导入区域（约第167行）添加：

```javascript
import AuthModal from '../../components/AuthModal.vue'
```

**Step 2: 添加授权弹窗状态**

在状态变量区域（约第234行，`const form = reactive({...})` 附近）添加：

```javascript
const showAuthModal = ref(false)  // 是否显示授权弹窗
```

**Step 3: 重构 onSubmit 函数**

将原有的 `onSubmit` 函数（约第264-326行）替换为：

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
    let token = uni.getStorageSync('access_token')
    if (!token) {
      const loginRes = await request({
        url: '/api/auth/wechat/login',
        method: 'POST',
        data: { code: 'mock-code' },
      })
      token = loginRes.access_token
      setToken(token)
    }

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

    // 5. 显示剩余次数提示（剩余1次时）
    if (statusRes.remaining_quota === 1) {
      uni.showToast({
        title: '今日还剩 1 次机会',
        icon: 'none',
        duration: 1500
      })
    }

    // 6. 继续生成名字
    await generateNames()
  } catch (e) {
    console.error('检查状态失败:', e)
    uni.showToast({ title: e.message || '检查失败', icon: 'none' })
  }
}

// 提取原有生成逻辑为独立函数
async function generateNames() {
  // 启动自定义加载动画
  loading.value = true
  loadingStage.value = 0

  // 非阻塞动画阶段控制
  setTimeout(() => {
    if (loading.value) loadingStage.value = 1
  }, 5000)

  setTimeout(() => {
    if (loading.value) loadingStage.value = 2
  }, 12000)

  try {
    // 直接调用生成名字接口 (与动画并行执行)
    const genRes = await request({
      url: '/api/generate',
      method: 'POST',
      data: {
        surname: form.surname.trim(),
        gender: form.gender,
        birth_date: form.birth_date,
        name_length: form.name_length,
        avoided_chars: form.avoided_chars || undefined,
        father_birth_date: form.father_birth_date || undefined,
        mother_birth_date: form.mother_birth_date || undefined,
      },
    })

    // 停止动画并跳转
    loading.value = false

    // 将结果存储到全局，供结果页使用
    uni.setStorageSync('lastGenerateResult', genRes)
    uni.navigateTo({
      url: `/pages/result/result`,
    })
  } catch (e) {
    loading.value = false

    // 特殊处理 429 错误
    if (e.statusCode === 429 || e.message.includes('已用完')) {
      uni.showToast({
        title: '今日生成次数已用完，明天再来吧',
        icon: 'none',
        duration: 2000
      })
    } else {
      uni.showToast({ title: e.message || '生成失败', icon: 'none' })
    }
  }
}

// 授权成功回调
async function onAuthSuccess() {
  showAuthModal.value = false
  // 重新提交生成
  await onSubmit()
}
```

**Step 4: 在模板中添加 AuthModal 组件**

在 `</view>` 结束标签前（约第163行，自定义日期选择器之后）添加：

```vue
    <!-- 授权弹窗 -->
    <AuthModal
      :visible="showAuthModal"
      @close="showAuthModal = false"
      @success="onAuthSuccess"
    />
```

**Step 5: 构建验证**

```bash
cd /Users/jiazhaoxin/zhitu/Home/weixin/neoname/neoname-frontend
pnpm build:mp-weixin
```

预期：构建成功，无错误

---

## Task 11: 本地测试验证

**Step 1: 启动后端服务**

```bash
cd /Users/jiazhaoxin/zhitu/Home/weixin/neoname/neoname
source ~/miniforge3/etc/profile.d/conda.sh
conda activate neoname
uvicorn app.main:app --host 0.0.0.0 --port 20261 --reload
```

预期：服务启动，监听 20261 端口

**Step 2: 测试 check-status 接口**

```bash
# 先登录获取 token
curl -X POST http://localhost:20261/api/auth/wechat/login \
  -H "Content-Type: application/json" \
  -d '{"code": "mock-code"}'

# 使用返回的 token 测试 check-status
curl -X GET http://localhost:20261/api/user/check-status \
  -H "Authorization: Bearer <token>"
```

预期返回：
```json
{
  "authorized": false,
  "remaining_quota": 3,
  "user_info": null
}
```

**Step 3: 测试 authorize 接口**

```bash
curl -X POST http://localhost:20261/api/user/authorize \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"nickname": "测试用户", "avatar_url": "https://example.com/avatar.jpg"}'
```

预期返回：
```json
{
  "success": true,
  "message": "授权成功"
}
```

**Step 4: 再次测试 check-status，验证授权状态**

```bash
curl -X GET http://localhost:20261/api/user/check-status \
  -H "Authorization: Bearer <token>"
```

预期返回：
```json
{
  "authorized": true,
  "remaining_quota": 3,
  "user_info": {
    "nickname": "测试用户",
    "avatar_url": "https://example.com/avatar.jpg"
  }
}
```

**Step 5: 测试生成接口限流**

```bash
# 第1次生成
curl -X POST http://localhost:20261/api/generate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "surname": "张",
    "gender": "male",
    "birth_date": "2024-01-01",
    "name_length": "double"
  }'
```

预期：成功返回名字列表

再次调用 check-status，验证 remaining_quota 变为 2。

重复3次后，第4次调用应返回 429 错误。

**Step 6: 前端测试**

```bash
cd /Users/jiazhaoxin/zhitu/Home/weixin/neoname/neoname-frontend
pnpm dev:mp-weixin
```

在微信开发者工具中：
1. 导入项目 `dist/build/mp-weixin`
2. 填写表单，点击"生成好名字"
3. 验证授权弹窗弹出
4. 点击授权按钮（如果失败，检查是否需要真实微信环境）
5. 授权成功后，继续生成流程
6. 多次生成，验证限流提示

---

## 实施顺序

按照 Task 1 → Task 11 的顺序依次执行。

关键里程碑：
- Task 1-8: 后端实现和数据库迁移
- Task 9-10: 前端实现
- Task 11: 集成测试

---

## 回滚方案

如果需要回滚数据库迁移：

```bash
cd /Users/jiazhaoxin/zhitu/Home/weixin/neoname/neoname
conda activate neoname
alembic downgrade 002
```

这将删除 `generation_quotas` 表。

---

## 部署到生产环境

### 服务器部署步骤

**Step 1: SSH 连接服务器**

```bash
ssh root@39.106.88.150
```

**Step 2: 进入项目目录**

```bash
cd /root/app/weixin/neoname
```

**Step 3: 拉取最新代码**

```bash
git pull origin main
```

**Step 4: 激活环境并执行迁移**

```bash
source /root/miniforge3/etc/profile.d/conda.sh
conda activate neoname
alembic upgrade head
```

**Step 5: 重启服务**

```bash
pm2 restart neoname
```

**Step 6: 查看日志**

```bash
pm2 logs neoname --lines 50
```

**Step 7: 验证接口**

```bash
curl -X GET https://neoname.yzhitu.com/api/user/check-status \
  -H "Authorization: Bearer <production-token>"
```

---

## 注意事项

1. **微信授权API限制**
   - `getUserProfile` 需要在真实微信环境中测试
   - 模拟器可能无法触发微信授权弹窗

2. **数据库迁移不可逆**
   - 执行 `alembic upgrade` 前确保已备份数据
   - 生产环境迁移建议在低峰期执行

3. **限流逻辑**
   - 每次点击"生成"都会增加计数，即使生成失败
   - 这是设计预期，防止用户频繁重试

4. **时区问题**
   - `date.today()` 使用服务器时区
   - 确保服务器时区设置为中国时区（Asia/Shanghai）

5. **前端缓存**
   - 微信小程序可能缓存旧版本代码
   - 测试时需要清除缓存或重新编译
