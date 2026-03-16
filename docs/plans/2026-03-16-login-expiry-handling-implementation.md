# 登录过期处理实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现"一次授权，永久登录"的用户体验，自动处理 token 过期重新登录

**Architecture:** 重构 onSubmit 函数为 4 个独立步骤（表单验证、确保登录、确保授权、生成名字），在 ensureAuthorization 中检测 401 错误并自动重新登录

**Tech Stack:** Vue 3 Composition API, uni-app, JavaScript

---

## 任务 1: 提取 generateNames 函数

**Files:**
- Modify: `src/pages/index/index.vue:347-399`

**目标:** 将现有的生成名字逻辑提取为独立的 `generateNames()` 函数，便于后续重构调用

**Step 1: 确认现有 generateNames 函数位置**

检查 `src/pages/index/index.vue` 第 347-399 行，确认 `generateNames()` 函数已经存在。

**Step 2: 验证函数独立性**

确认 `generateNames()` 函数：
- 不依赖 onSubmit 的局部变量
- 使用 `form` reactive 对象获取表单数据
- 使用 `loading` 和 `loadingStage` ref 控制加载状态
- 正确处理错误（429 和其他错误）

Expected: 函数已经独立，无需修改

**Step 3: 验证完成**

此任务无需修改代码，现有代码已经将 generateNames 提取为独立函数。

---

## 任务 2: 实现 ensureLogin 函数

**Files:**
- Modify: `src/pages/index/index.vue:273` (在 onSubmit 函数之前插入)

**目标:** 实现确保有效 token 的函数，如果本地无 token 则自动调用微信登录

**Step 1: 在 onSubmit 之前添加 ensureLogin 函数**

在 `src/pages/index/index.vue` 第 273 行之前（`async function onSubmit()` 之前）插入以下代码：

```javascript
// 确保有有效的登录 token
async function ensureLogin() {
  let token = uni.getStorageSync('access_token')

  // 如果已有 token，假设有效（后续 API 会验证）
  if (token) {
    return
  }

  // 无 token，调用微信登录
  try {
    // 获取微信登录凭证
    const loginResult = await new Promise((resolve, reject) => {
      uni.login({
        provider: 'weixin',
        success: resolve,
        fail: reject
      })
    })

    // 使用微信 code 登录后端
    const loginRes = await request({
      url: '/api/auth/wechat/login',
      method: 'POST',
      data: { code: loginResult.code },
    })

    // 保存 token
    token = loginRes.access_token
    setToken(token)
  } catch (e) {
    console.error('微信登录失败:', e)
    throw new Error('微信登录失败，请重试')
  }
}
```

**Step 2: 手动测试 ensureLogin**

测试方法：
1. 在微信开发者工具中打开小程序
2. 清除 Storage 中的 access_token
3. 在控制台手动调用 `ensureLogin()`
4. 检查 Storage 中是否生成了新的 access_token

Expected: 成功获取 token 并保存到 Storage

**Step 3: 提交代码**

```bash
git add src/pages/index/index.vue
git commit -m "feat: 添加 ensureLogin 函数处理自动登录

- 检查本地是否有 token
- 无 token 时自动调用 uni.login 获取微信凭证
- 调用后端登录接口获取 access_token
- 保存 token 到本地 Storage

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## 任务 3: 实现 ensureAuthorization 函数

**Files:**
- Modify: `src/pages/index/index.vue:273` (在 ensureLogin 之后插入)

**目标:** 实现确保用户授权的函数，处理 401 错误自动重新登录，处理未授权弹窗

**Step 1: 在 ensureLogin 之后添加 ensureAuthorization 函数**

在刚才添加的 `ensureLogin` 函数之后插入以下代码：

```javascript
// 确保用户已授权（处理 token 过期、未授权、配额检查）
async function ensureAuthorization() {
  let retryCount = 0
  const MAX_RETRY = 1

  while (retryCount <= MAX_RETRY) {
    try {
      // 调用 check-status 检查授权状态
      const statusRes = await request({
        url: '/api/user/check-status',
        method: 'GET'
      })

      // 检查是否已授权
      if (!statusRes.authorized) {
        // 未授权，显示授权弹窗
        showAuthModal.value = true

        // 等待用户授权完成
        return new Promise((resolve) => {
          // 重新定义 onAuthSuccess 以支持 Promise
          const originalOnAuthSuccess = onAuthSuccess
          window._authSuccessResolve = resolve
        })
      }

      // 检查配额
      if (statusRes.remaining_quota <= 0) {
        uni.showToast({
          title: '今日生成次数已用完，明天再来吧',
          icon: 'none',
          duration: 2000
        })
        return false
      }

      // 显示剩余次数提示（剩余1次时）
      if (statusRes.remaining_quota === 1) {
        uni.showToast({
          title: '今日还剩 1 次机会',
          icon: 'none',
          duration: 1500
        })
      }

      // 授权成功且有配额
      return true

    } catch (e) {
      console.error('检查状态失败:', e)

      // 检测 401 错误（token 过期）
      if (e.statusCode === 401 && retryCount < MAX_RETRY) {
        console.log('Token 过期，重新登录...')

        // 清除本地 token
        uni.removeStorageSync('access_token')

        // 重新登录
        await ensureLogin()

        // 增加重试计数，继续循环
        retryCount++
        continue
      }

      // 其他错误或重试次数用完
      if (retryCount >= MAX_RETRY) {
        uni.showToast({ title: '登录失败，请稍后重试', icon: 'none' })
      } else {
        uni.showToast({ title: e.message || '检查失败', icon: 'none' })
      }
      return false
    }
  }

  return false
}
```

**Step 2: 修改 onAuthSuccess 函数支持 Promise**

找到现有的 `onAuthSuccess` 函数（约第 401-406 行），修改为：

```javascript
// 授权成功回调
async function onAuthSuccess() {
  showAuthModal.value = false

  // 如果有等待的 Promise，resolve 它
  if (window._authSuccessResolve) {
    window._authSuccessResolve(true)
    window._authSuccessResolve = null
  }
}
```

**Step 3: 手动测试 ensureAuthorization - 场景 1（首次用户）**

测试方法：
1. 清除小程序 Storage
2. 调用 `ensureLogin()` 获取 token（但用户未授权）
3. 调用 `ensureAuthorization()`
4. 应该弹出授权窗口

Expected: 显示授权弹窗

**Step 4: 手动测试 ensureAuthorization - 场景 2（token 过期）**

测试方法：
1. 在 Storage 中设置一个过期的 token（或修改后端使 token 失效）
2. 调用 `ensureAuthorization()`
3. 应该自动清除 token，重新登录，再次检查状态

Expected: 自动重新登录，不弹授权窗口（如果用户已授权）

**Step 5: 提交代码**

```bash
git add src/pages/index/index.vue
git commit -m "feat: 添加 ensureAuthorization 函数处理授权检查

- 调用 check-status 检查用户授权状态和配额
- 检测 401 错误自动清除 token 并重新登录
- 最多重试 1 次，避免无限循环
- 未授权时显示授权弹窗
- 配额用完时显示提示
- 修改 onAuthSuccess 支持 Promise 等待

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## 任务 4: 重构 onSubmit 函数

**Files:**
- Modify: `src/pages/index/index.vue:274-344`

**目标:** 简化 onSubmit 函数，调用新的步骤函数，移除重复逻辑

**Step 1: 替换 onSubmit 函数实现**

将现有的 `onSubmit` 函数（第 274-344 行）替换为：

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

  try {
    // 2. 确保登录（获取有效 token）
    await ensureLogin()

    // 3. 确保授权（检查授权状态和配额）
    const canProceed = await ensureAuthorization()
    if (!canProceed) {
      return  // 用户取消授权或配额用完
    }

    // 4. 生成名字
    await generateNames()
  } catch (e) {
    console.error('提交失败:', e)
    uni.showToast({ title: e.message || '操作失败，请重试', icon: 'none' })
  }
}
```

**Step 2: 移除 onSubmit 中的旧逻辑**

确认以下逻辑已被移除（因为已迁移到 ensureLogin 和 ensureAuthorization）：
- ✅ 检查 token 并登录的逻辑（移到 ensureLogin）
- ✅ 调用 check-status 的逻辑（移到 ensureAuthorization）
- ✅ 显示授权弹窗的逻辑（移到 ensureAuthorization）
- ✅ 配额检查的逻辑（移到 ensureAuthorization）

保留的逻辑：
- ✅ 表单验证
- ✅ 调用 generateNames()
- ✅ 错误处理

**Step 3: 验证代码完整性**

检查点：
- [ ] ensureLogin 函数存在且正确
- [ ] ensureAuthorization 函数存在且正确
- [ ] generateNames 函数存在（现有代码）
- [ ] onAuthSuccess 函数已修改支持 Promise
- [ ] onSubmit 函数简化为 4 个步骤

**Step 4: 提交代码**

```bash
git add src/pages/index/index.vue
git commit -m "refactor: 重构 onSubmit 函数为清晰的 4 步骤流程

- 步骤1: validateForm - 验证表单
- 步骤2: ensureLogin - 确保有效 token
- 步骤3: ensureAuthorization - 确保授权和配额
- 步骤4: generateNames - 生成名字
- 移除重复的登录和授权检查逻辑

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## 任务 5: 端到端测试验证

**Files:**
- Test: `src/pages/index/index.vue` (手动测试)

**目标:** 验证所有场景下的登录和授权流程

**Step 1: 测试场景 1 - 首次用户**

操作步骤：
1. 在微信开发者工具中清除所有 Storage 数据
2. 刷新小程序
3. 填写表单（姓氏、性别、出生日期等）
4. 点击"生成好名字"

Expected 结果：
- 自动调用微信登录（无感知）
- 弹出授权窗口，显示"需要您的授权"
- 点击"微信授权"，获取用户信息
- 授权成功后，自动开始生成名字
- 显示加载动画，最终跳转到结果页

**Step 2: 测试场景 2 - 已授权用户（token 有效）**

操作步骤：
1. 完成场景 1 的授权
2. 返回首页
3. 重新填写表单
4. 点击"生成好名字"

Expected 结果：
- 不弹出授权窗口
- 直接开始生成名字
- 跳转到结果页

**Step 3: 测试场景 3 - 已授权用户（token 过期）**

操作步骤：
1. 完成场景 1 的授权
2. 在 Storage 中手动删除 `access_token`
3. 填写表单
4. 点击"生成好名字"

Expected 结果：
- 自动静默重新登录（无感知）
- 不弹出授权窗口（因为数据库中已有用户信息）
- 直接开始生成名字
- 跳转到结果页

**Step 4: 测试场景 4 - 配额用完**

操作步骤：
1. 已授权用户
2. 在同一天内生成名字 3 次
3. 第 4 次点击"生成好名字"

Expected 结果：
- 不开始生成
- 显示 Toast 提示："今日生成次数已用完，明天再来吧"

**Step 5: 测试场景 5 - 用户取消授权**

操作步骤：
1. 清除 Storage，成为首次用户
2. 填写表单
3. 点击"生成好名字"
4. 授权窗口弹出后，点击"稍后再说"

Expected 结果：
- 授权窗口关闭
- 不继续生成名字
- 停留在首页

**Step 6: 测试场景 6 - 网络错误处理**

操作步骤：
1. 在微信开发者工具中模拟网络断开
2. 点击"生成好名字"

Expected 结果：
- 显示错误提示："操作失败，请重试" 或具体的网络错误信息

**Step 7: 记录测试结果**

创建测试记录文档（可选，用于存档）：

```bash
# 在控制台记录测试结果
echo "场景 1 - 首次用户: ✅ 通过"
echo "场景 2 - 已授权用户（token 有效）: ✅ 通过"
echo "场景 3 - 已授权用户（token 过期）: ✅ 通过"
echo "场景 4 - 配额用完: ✅ 通过"
echo "场景 5 - 用户取消授权: ✅ 通过"
echo "场景 6 - 网络错误: ✅ 通过"
```

**Step 8: 提交测试验证记录**

```bash
git commit --allow-empty -m "test: 验证登录过期处理的所有场景

已测试场景：
✅ 首次用户 - 弹出授权窗口
✅ 已授权用户（token 有效）- 直接生成
✅ 已授权用户（token 过期）- 自动重新登录
✅ 配额用完 - 显示提示
✅ 用户取消授权 - 停留首页
✅ 网络错误 - 显示错误提示

所有场景符合预期。

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## 任务 6: 构建生产版本验证

**Files:**
- Build: `dist/build/mp-weixin/`

**目标:** 在生产模式下构建并验证功能正常

**Step 1: 构建生产版本**

```bash
cd /Users/jiazhaoxin/zhitu/Home/weixin/neoname/neoname-frontend
pnpm build:mp-weixin
```

Expected: 构建成功，输出到 `dist/build/mp-weixin/`

**Step 2: 在微信开发者工具中测试生产版本**

操作步骤：
1. 在微信开发者工具中导入 `dist/build/mp-weixin/` 目录
2. 切换到"生产模式"
3. 重复任务 5 的所有测试场景

Expected: 所有场景在生产模式下仍然正常工作

**Step 3: 检查生产版本的 API 地址**

```bash
# 检查构建后的 request.js 是否使用正确的 API 地址
grep -r "neoname.yzhitu.com" dist/build/mp-weixin/
```

Expected: 找到 `https://neoname.yzhitu.com`，确认使用生产环境 API

**Step 4: 提交构建验证记录**

```bash
git commit --allow-empty -m "build: 验证生产版本构建成功

- 生产模式构建成功
- API 地址正确指向 https://neoname.yzhitu.com
- 所有测试场景在生产模式下通过

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## 完成标准

所有任务完成后，应满足以下条件：

✅ **功能完整性**
- ensureLogin 函数正确处理无 token 的情况
- ensureAuthorization 函数正确处理 401 错误和重新登录
- onSubmit 函数简化为清晰的 4 步骤流程
- onAuthSuccess 支持 Promise 等待机制

✅ **用户体验**
- 首次用户需要授权（getUserProfile）
- 已授权用户 token 过期时自动静默重新登录
- 配额用完时显示友好提示
- 用户取消授权时不强制继续

✅ **错误处理**
- 微信登录失败显示错误提示
- 网络错误显示友好提示
- 401 错误最多重试 1 次，避免无限循环

✅ **测试验证**
- 6 个测试场景全部通过
- 开发模式和生产模式都正常工作
- 生产构建使用正确的 API 地址

✅ **代码质量**
- 函数职责单一，逻辑清晰
- 无重复代码
- 符合 YAGNI 原则（只实现必要功能）
- 代码可维护性高

---

## 注意事项

1. **uni.login() 调用频率限制**
   - 微信小程序对 uni.login() 有调用频率限制
   - 本实现通过"假设 token 有效"避免频繁调用
   - 只有在确认 token 无效（401）时才重新登录

2. **授权窗口的用户体验**
   - 首次用户必须授权才能继续
   - 已授权用户永远不会再看到授权窗口
   - 授权窗口设计友好，说明清楚获取的信息

3. **错误重试策略**
   - 401 错误最多重试 1 次
   - 避免无限循环导致用户体验差
   - 重试失败后显示友好错误提示

4. **Promise 等待机制**
   - 使用 window._authSuccessResolve 等待授权完成
   - 这是一个简单的实现，适合单页面场景
   - 如果未来有多个页面需要授权，考虑使用状态管理

5. **生产环境验证**
   - 确保生产构建使用正确的 API 地址
   - 在真实微信环境中测试（不只是开发者工具）
   - 验证 HTTPS 证书正确配置
