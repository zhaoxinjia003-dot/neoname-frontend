# 吉名鉴赏页面交互优化设计

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:writing-plans to implement this plan.

**Goal:** 优化吉名鉴赏页面的名字切换交互，移除滑动切换，改为按钮点击 + 渐隐渐显动画

**Architecture:** 保持现有页面结构不变，修改底部按钮功能和swiper组件配置

**Tech Stack:** Vue 3 (uni-app)

---

## 需求概述

1. 将「收藏此名」按钮改为「查看下一个」
2. 移除左右滑动切换名字的功能
3. 点击「查看下一个」后等待 5 秒，通过渐隐渐显动画切换到下一个名字
4. 保持微信原生分享功能不变

---

## UI/UX 设计

### 1. 按钮变化

| 状态 | 文字 | 样式 |
|------|------|------|
| 默认 | 查看下一个 → | 右侧带箭头 |
| 禁用/准备中 | 正在准备... | 灰色禁用状态 |
| 已是最后一个 | 已浏览全部 | 禁用状态 |

### 2. 动画流程 (总时长 5 秒)

```
0s     - 用户点击按钮
        - 按钮进入禁用状态，显示 "正在准备..."
        - 当前卡片开始缓慢渐隐 (opacity: 1 → 0)

2s     - 当前卡片完全消失 (opacity: 0)

2-3s   - 短暂停顿

3s     - 索引切换到下一个
        - 新卡片开始渐显 (opacity: 0 → 1)

5s     - 动画结束
        - 按钮恢复可点击状态
```

### 3. 动画细节

- **渐隐动画**: `opacity` 从 1 降到 0，`transform: translateY(-20rpx)` 轻微上移
- **渐显动画**: `opacity` 从 0 升到 1，`transform: translateY(20rpx)` 从下方出现
- **缓动函数**: 使用 `ease-in-out` 实现平滑过渡

### 4. 边界情况

- **最后一个名字**: 点击后显示 "已浏览全部"，按钮禁用
- **只有一个名字**: 按钮显示 "仅此一个" 或类似提示
- **快速点击**: 按钮禁用期间不可重复点击

---

## 技术实现

### 1. 需要修改的文件

- `src/pages/result/result.vue` - 主页面组件

### 2. 状态变量

```javascript
// 新增状态
const isTransitioning = ref(false)      // 是否正在过渡
const isLastName = ref(false)             // 是否已浏览到最后一个

// 修改现有
const currentIndex = ref(0)              // 保留，移除 swiper 的 @change 监听
```

### 3. 函数逻辑

```javascript
// 点击查看下一个
function onNext() {
  if (isTransitioning.value || isLastName.value) return

  isTransitioning.value = true

  // 5秒后切换
  setTimeout(() => {
    if (currentIndex.value < names.value.length - 1) {
      currentIndex.value++
    } else {
      isLastName.value = true
    }
    isTransitioning.value = false
  }, 5000)
}
```

### 4. 模板变化

```html
<!-- 移除 swiper 的 @change 事件 -->
<swiper @change="onSwiperChange" ...>

<!-- 修改按钮 -->
<button
  class="action-btn secondary"
  :disabled="isTransitioning || isLastName"
  @click="onNext"
>
  <text>{{ buttonText }}</text>
</button>
```

### 5. 动画实现

通过 CSS class 控制渐隐渐显：

```css
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

---

## 分享功能

保持现有实现不变：
- 按钮使用 `open-type="share"`
- 微信原生分享面板

---

## 滑动功能

移除滑动切换：
- 保留 swiper 组件用于显示名字
- 移除 `@change` 事件绑定
- 用户只能通过按钮切换名字

---

## 测试要点

1. 点击按钮后，按钮在 5 秒内保持禁用状态
2. 动画平滑过渡，无闪烁或跳跃
3. 浏览到最后一个名字后，按钮显示 "已浏览全部"
4. 分享功能正常工作
5. 指示器正确显示当前浏览位置
