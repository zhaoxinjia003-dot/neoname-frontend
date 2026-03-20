# 吉名鉴赏页面交互优化实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将「收藏此名」改为「查看下一个」，移除滑动切换，添加 5 秒渐隐渐显动画

**Architecture:** 保持现有页面结构不变，修改底部按钮功能和swiper组件，添加动画状态控制

**Tech Stack:** Vue 3 (uni-app)

---

## 任务总览

| 任务 | 描述 |
|------|------|
| Task 1 | 添加状态变量 (isTransitioning, isLastName, cardAnimationClass) |
| Task 2 | 修改按钮模板，更换为「查看下一个」 |
| Task 3 | 实现渐隐渐显动画逻辑 |
| Task 4 | 移除swiper的滑动切换功能 |
| Task 5 | 添加动画CSS样式 |
| Task 6 | 构建验证 |

---

## Task 1: 添加状态变量

**Files:**
- Modify: `src/pages/result/result.vue:147-156`

**Step 1: 添加新的响应式状态变量**

在 `script setup` 中找到现有的状态变量声明，在 `const collected = ref(false)` 后面添加：

```javascript
// 新增状态 - 控制动画和按钮
const isTransitioning = ref(false)     // 是否正在过渡动画中
const isLastName = ref(false)          // 是否已浏览到最后一个
const cardAnimationClass = ref('')     // 卡片动画类名 ('', 'fading-out', 'fading-in')
```

**Step 2: 添加计算属性 - 按钮文字**

在状态变量后面添加：

```javascript
// 计算属性 - 按钮文字
const buttonText = computed(() => {
  if (names.value.length <= 1) {
    return '仅此一个'
  }
  if (isLastName.value) {
    return '已浏览全部'
  }
  if (isTransitioning.value) {
    return '正在准备...'
  }
  return '查看下一个 →'
})
```

**Step 3: 导入 computed**

找到现有的 `import { ref, onMounted } from 'vue'`，修改为：

```javascript
import { ref, computed, onMounted } from 'vue'
```

---

## Task 2: 修改按钮模板

**Files:**
- Modify: `src/pages/result/result.vue:127-138`

**Step 1: 替换按钮区域**

找到当前的底部操作按钮区域：

```html
<!-- 原始代码 -->
<button class="action-btn secondary" @click="onCollect" v-if="!collected">
  <text>❤️ 收藏此名</text>
</button>
<button class="action-btn secondary collected" v-else>
  <text>✅ 已收藏</text>
</button>
```

替换为：

```html
<!-- 修改后 -->
<button
  class="action-btn secondary"
  :class="{ disabled: isTransitioning || isLastName || names.length <= 1 }"
  :disabled="isTransitioning || isLastName || names.length <= 1"
  @click="onNext"
>
  <text>{{ buttonText }}</text>
</button>
```

**Step 2: 保留分享按钮**

分享按钮保持不变：

```html
<button class="action-btn primary" open-type="share">
  <text>📤 分享好友</text>
</button>
```

---

## Task 3: 实现渐隐渐显动画逻辑

**Files:**
- Modify: `src/pages/result/result.vue:203-210`

**Step 1: 添加 onNext 函数**

找到 `onCollect` 函数附近，在它后面添加 `onNext` 函数：

```javascript
// 点击查看下一个
function onNext() {
  // 防止重复点击
  if (isTransitioning.value || isLastName.value || names.value.length <= 1) {
    return
  }

  // 开始过渡动画
  isTransitioning.value = true
  cardAnimationClass.value = 'fading-out'

  // 2秒后开始渐显新卡片
  setTimeout(() => {
    // 切换到下一个名字
    if (currentIndex.value < names.value.length - 1) {
      currentIndex.value++
    } else {
      isLastName.value = true
    }

    // 开始渐显动画
    cardAnimationClass.value = 'fading-in'

    // 再过2秒后动画结束
    setTimeout(() => {
      cardAnimationClass.value = ''
      isTransitioning.value = false
    }, 2000)
  }, 2000)
}
```

**Step 2: 可选 - 移除不再需要的 onCollect 函数**

如果不再需要收藏功能，可以删除 `onCollect` 函数。

---

## Task 4: 移除swiper的滑动切换功能

**Files:**
- Modify: `src/pages/result/result.vue:20-27`

**Step 1: 移除 swiper 的 @change 事件**

找到 swiper 组件：

```html
<!-- 原始代码 -->
<swiper
  class="swiper"
  :current="currentIndex"
  @change="onSwiperChange"
  :circular="false"
  :display-multiple-items="1"
  v-if="names.length"
>
```

修改为（移除 @change="onSwiperChange"）：

```html
<!-- 修改后 -->
<swiper
  class="swiper"
  :current="currentIndex"
  :circular="false"
  :display-multiple-items="1"
  v-if="names.length"
>
```

**Step 2: 移除 onSwiperChange 函数（可选）**

找到 `onSwiperChange` 函数（约在 line 197-199）：

```javascript
function onSwiperChange(e) {
  currentIndex.value = e.detail.current
}
```

可以删除这个函数，因为它不再被使用。

---

## Task 5: 添加动画CSS样式

**Files:**
- Modify: `src/pages/result/result.vue:713-718`

**Step 1: 添加卡片动画样式**

在 `.back-btn text` 样式后面添加：

```css
// 卡片渐隐渐显动画
.card {
  transition: opacity 2s ease-in-out, transform 2s ease-in-out;
}

.card.fading-out {
  opacity: 0;
  transform: translateY(-20rpx);
}

.card.fading-in {
  opacity: 1;
  transform: translateY(0);
}
```

**Step 2: 添加按钮禁用样式**

在 `.action-btn.primary` 样式后面添加：

```css
.action-btn.disabled {
  background: #e0e0e0;
  color: #999;
  box-shadow: none;
}
```

---

## Task 6: 构建验证

**Step 1: 运行构建命令**

```bash
cd /Users/jiazhaoxin/zhitu/Home/weixin/neoname/neoname-frontend

# 微信小程序构建
pnpm build:mp-weixin
```

**Step 2: 预期结果**

构建成功，无错误输出

**Step 3: 验证文件生成**

检查 `dist/build/mp-weixin/pages/result/result.js` 是否包含新的状态变量和函数

---

## 实施顺序

1. 先完成 Task 1（添加状态变量和计算属性）
2. 完成 Task 2（修改按钮模板）
3. 完成 Task 3（实现动画逻辑）
4. 完成 Task 4（移除滑动功能）
5. 完成 Task 5（添加CSS样式）
6. 执行 Task 6（构建验证）

---

## 注意事项

- 由于是 uni-app 小程序项目，没有单元测试，直接进行功能验证
- 动画时间：渐隐 2s + 停顿 1s + 渐显 2s = 总计 5s
- 小程序中 CSS transition 可能有兼容性问题，如遇问题可调整为使用动画 API
- 完成后需要实际在微信开发者工具中测试动画效果
