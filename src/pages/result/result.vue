<template>
  <view class="page">
    <!-- 顶部装饰 -->
    <view class="header-decor">
      <view class="header-line"></view>
      <text class="header-title">吉名鉴赏</text>
      <view class="header-line"></view>
    </view>

    <!-- 滑动指示器 -->
    <view class="indicator" v-if="names.length">
      <view
        v-for="(_, index) in names"
        :key="index"
        :class="['indicator-dot', currentIndex === index && 'active']"
      />
    </view>

    <!-- 名字卡片轮播 -->
    <swiper
      class="swiper"
      :current="currentIndex"
      :circular="false"
      :display-multiple-items="1"
      v-if="names.length"
    >
      <swiper-item v-for="(item, index) in names" :key="index">
        <view class="card-wrapper">
          <view class="card" :class="cardAnimationClass">
            <!-- 卡片顶部装饰 -->
            <view class="card-header-decor">
              <view class="corner corner-tl"></view>
              <view class="corner corner-tr"></view>
              <view class="corner corner-bl"></view>
              <view class="corner corner-br"></view>
            </view>

            <!-- 名字展示 -->
            <view class="name-section">
              <view class="name-label">姓名</view>
              <view class="name">
                <text class="name-surname">{{ item.name.slice(0, 1) }}</text>
                <text class="name-given">{{ item.name.slice(1) }}</text>
              </view>
              <view class="name-pinyin">{{ getPinyin(item.name) }}</view>
            </view>

            <!-- 万年历信息 -->
            <view class="almanac-section" v-if="almanac">
              <view class="almanac-title">{{ almanacTitle }}</view>
              <view class="almanac-compact">
                <text class="almanac-text" v-if="almanac.ganzhi || almanac.wuxing">
                  {{ almanac.ganzhi }} · {{ almanac.wuxing }}
                </text>
                <text class="almanac-yi" v-if="almanac.yi">宜 {{ formatText(almanac.yi, 15) }}</text>
                <text class="almanac-ji" v-if="almanac.ji">忌 {{ formatText(almanac.ji, 15) }}</text>
              </view>
            </view>

            <!-- 寓意 -->
            <view class="teaser-section" v-if="item.teaser">
              <view class="section-label">寓意</view>
              <view class="teaser">{{ item.teaser }}</view>
            </view>

            <!-- 单字解析 -->
            <view class="detail-section" v-if="item.char_analysis && item.char_analysis.length">
              <view class="section-label">字义解析</view>
              <view class="char-list">
                <view class="char-item" v-for="(c, idx) in item.char_analysis" :key="idx">
                  <text class="char-char">{{ c.char }}</text>
                  <view class="char-info">
                    <text class="char-meaning">{{ c.meaning }}</text>
                    <text class="char-source">「{{ c.source }}」</text>
                    <text class="char-wuxing" :class="'wuxing-' + getWuxingEn(c.wuxing)">{{ c.wuxing }}</text>
                  </view>
                </view>
              </view>
            </view>

            <!-- 八字分析 -->
            <view class="detail-section" v-if="item.bazi_analysis">
              <view class="section-label">八字分析</view>
              <view class="detail-content">{{ item.bazi_analysis }}</view>
            </view>

            <!-- 五行平衡 -->
            <view class="detail-section" v-if="item.wuxing_balance">
              <view class="section-label">五行平衡</view>
              <view class="detail-content">{{ item.wuxing_balance }}</view>
            </view>

            <!-- 今日宜忌 -->
            <view class="detail-section" v-if="item.daily_analysis">
              <view class="section-label">今日宜忌</view>
              <view class="detail-content">{{ item.daily_analysis }}</view>
            </view>

            <!-- 综合评价 -->
            <view class="detail-section summary-section" v-if="item.summary">
              <view class="section-label">综合评价</view>
              <view class="detail-content summary-content">{{ item.summary }}</view>
            </view>

            <!-- 卡片底部 -->
            <view class="card-footer">
              <text class="card-number">{{ index + 1 }} / {{ names.length }}</text>
            </view>
          </view>
        </view>
      </swiper-item>
    </swiper>

    <!-- 空状态 -->
    <view class="empty" v-else-if="!loading">
      <text class="empty-icon">📛</text>
      <text class="empty-text">暂无名字数据</text>
    </view>

    <!-- 加载中 -->
    <view class="loading" v-if="loading">
      <view class="loading-spinner"></view>
      <text class="loading-text">正在生成吉名...</text>
    </view>

    <!-- 底部操作 -->
    <view class="bottom-action" v-if="names.length">
      <button
        class="action-btn secondary"
        :class="{ disabled: isTransitioning || isLastName || names.length <= 1 }"
        :disabled="isTransitioning || isLastName || names.length <= 1"
        @click="onNext"
      >
        <text>{{ buttonText }}</text>
      </button>
      <button class="action-btn primary" open-type="share">
        <text>📤 分享好友</text>
      </button>
    </view>

    <!-- 返回按钮 -->
    <view class="back-btn" @click="onBack">
      <text>← 返回</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const names = ref([])
const almanac = ref(null)
const birthDate = ref('')  // 用户输入的出生日期 YYYY-MM-DD
const loading = ref(true)
const currentIndex = ref(0)
const collected = ref(false)

// 新增状态 - 控制动画和按钮
const isTransitioning = ref(false)     // 是否正在过渡动画中
const isLastName = ref(false)          // 是否已浏览到最后一个
const cardAnimationClass = ref('')     // 卡片动画类名 ('', 'fading-out', 'fading-in')

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

// 获取名字的拼音
function getPinyin(name) {
  if (!name) return ''
  const pinyinMap = {
    '浩': 'hào', '然': 'rán', '俊': 'jùn', '毅': 'yì', '哲': 'zhé',
    '信': 'xìn', '阳': 'yáng', '伟': 'wěi', '卓': 'zhuó'
  }
  return name.split('').map(c => pinyinMap[c] || '').join(' ')
}

// 格式化文本，截断过长内容
function formatText(text, maxLen) {
  if (!text) return ''
  if (text.length <= maxLen) return text
  return text.substring(0, maxLen) + '...'
}

// 五行中文转英文（用于 CSS 类名）
function getWuxingEn(wuxing) {
  const map = {
    '金': 'jin',
    '木': 'mu',
    '水': 'shui',
    '火': 'huo',
    '土': 'tu'
  }
  return map[wuxing] || wuxing
}

// 出生日吉凶标题：如 "3月19日吉凶" 或 "出生日吉凶"
const almanacTitle = computed(() => {
  if (!birthDate.value) return '出生日吉凶'
  const parts = birthDate.value.split('-')
  if (parts.length >= 3) {
    const m = parseInt(parts[1], 10)
    const d = parseInt(parts[2], 10)
    return `${m}月${d}日吉凶`
  }
  return '出生日吉凶'
})

onMounted(() => {
  const result = uni.getStorageSync('lastGenerateResult')
  if (result) {
    names.value = result.names || []
    almanac.value = result.almanac || null
    birthDate.value = result.birth_date || ''
  }
  loading.value = false
})

function onSwiperChange(e) {
  currentIndex.value = e.detail.current
}

// 已解锁，无需支付功能

function onCollect() {
  collected.value = true
  uni.showToast({ title: '已收藏', icon: 'none' })
}

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

function onBack() {
  uni.navigateBack()
}
</script>

<style lang="scss" scoped>
// 东方美学色板
$bg-primary: #faf6f1;
$bg-card: #ffffff;
$text-primary: #2d2620;
$text-secondary: #7a726b;
$text-muted: #a39a92;
$accent: #c85a28;
$accent-light: #e8d5c4;
$gold: #b8956c;
$gold-light: #d4c4a8;
$border: #ebe5dc;
$shadow-soft: 0 8rpx 40rpx rgba(45, 38, 32, 0.08);
$shadow-card: 0 4rpx 24rpx rgba(45, 38, 32, 0.06);

.page {
  min-height: 100vh;
  background: $bg-primary;
  padding-bottom: 200rpx;
  box-sizing: border-box;
}

// 顶部装饰
.header-decor {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx 40rpx 24rpx;
  gap: 24rpx;
}

.header-line {
  width: 60rpx;
  height: 2rpx;
  background: linear-gradient(90deg, transparent, $gold-light, transparent);
}

.header-title {
  font-size: 28rpx;
  font-weight: 500;
  color: $text-muted;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

// 指示器
.indicator {
  display: flex;
  justify-content: center;
  gap: 12rpx;
  padding: 16rpx 0;
}

.indicator-dot {
  width: 8rpx;
  height: 8rpx;
  border-radius: 4rpx;
  background: $border;
  transition: all 0.3s ease;
}

.indicator-dot.active {
  width: 24rpx;
  background: $accent;
}

// 轮播卡片
.swiper {
  height: calc(100vh - 400rpx);
}

.card-wrapper {
  padding: 16rpx 32rpx;
  height: 100%;
  box-sizing: border-box;
}

.card {
  background: $bg-card;
  border-radius: 32rpx;
  padding: 48rpx 40rpx;
  height: 100%;
  box-shadow: $shadow-soft;
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
}

// 卡片角落装饰
.card-header-decor {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.corner {
  position: absolute;
  width: 24rpx;
  height: 24rpx;
  border-color: $gold-light;
  border-style: solid;
}

.corner-tl {
  top: 20rpx;
  left: 20rpx;
  border-width: 2rpx 0 0 2rpx;
}

.corner-tr {
  top: 20rpx;
  right: 20rpx;
  border-width: 2rpx 2rpx 0 0;
}

.corner-bl {
  bottom: 20rpx;
  left: 20rpx;
  border-width: 0 0 2rpx 2rpx;
}

.corner-br {
  bottom: 20rpx;
  right: 20rpx;
  border-width: 0 2rpx 2rpx 0;
}

// 名字区域
.name-section {
  text-align: center;
  padding: 32rpx 0;
  border-bottom: 1rpx solid $border;
  margin-bottom: 32rpx;
}

.name-label {
  font-size: 22rpx;
  color: $text-muted;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  margin-bottom: 16rpx;
}

.name {
  font-size: 80rpx;
  font-weight: 700;
  letter-spacing: 0.15em;
  font-family: "PingFang SC", "Helvetica Neue", sans-serif;
  text-shadow: 2rpx 4rpx 8rpx rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: center;
  align-items: baseline;
}

.name-surname {
  color: $text-primary;
}

.name-given {
  color: $accent;
  margin-left: 8rpx;
}

.name-pinyin {
  font-size: 26rpx;
  color: $text-muted;
  margin-top: 12rpx;
  letter-spacing: 0.1em;
}

// 万年历区域
.almanac-section {
  padding: 16rpx 0;
  margin-top: 8rpx;
}

.almanac-title {
  font-size: 20rpx;
  color: $text-muted;
  letter-spacing: 0.15em;
  margin-bottom: 12rpx;
  opacity: 0.7;
}

.almanac-compact {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12rpx;
}

.almanac-text {
  font-size: 24rpx;
  color: $text-secondary;
  background: rgba($gold-light, 0.5);
  padding: 6rpx 16rpx;
  border-radius: 24rpx;
  letter-spacing: 0.05em;
}

.almanac-yi {
  font-size: 22rpx;
  color: #2d8a4e;
  background: rgba(#2d8a4e, 0.1);
  padding: 6rpx 14rpx;
  border-radius: 20rpx;
}

.almanac-ji {
  font-size: 22rpx;
  color: #c85a28;
  background: rgba(#c85a28, 0.1);
  padding: 6rpx 14rpx;
  border-radius: 20rpx;
}

// 寓意区域
.teaser-section {
  padding: 24rpx 0;
  border-bottom: 1rpx solid $border;
}

.section-label {
  font-size: 24rpx;
  color: $text-primary;
  font-weight: 600;
  letter-spacing: 0.15em;
  margin-bottom: 16rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;

  &::before {
    content: '';
    width: 6rpx;
    height: 24rpx;
    background: linear-gradient(180deg, $accent 0%, $gold 100%);
    border-radius: 3rpx;
  }
}

.teaser {
  font-size: 32rpx;
  color: $text-primary;
  line-height: 1.6;
  font-weight: 500;
}

// 详情区域
.detail-section {
  padding: 24rpx 0;
  border-bottom: 1rpx solid $border;
}

.char-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.char-item {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  padding: 16rpx;
  background: rgba($gold-light, 0.3);
  border-radius: 12rpx;
}

.char-char {
  font-size: 48rpx;
  font-weight: 700;
  color: $accent;
  width: 80rpx;
  text-align: center;
  line-height: 1;
}

.char-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.char-meaning {
  font-size: 26rpx;
  color: $text-primary;
  line-height: 1.4;
}

.char-source {
  font-size: 22rpx;
  color: $text-muted;
  font-style: italic;
}

.char-wuxing {
  display: inline-block;
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
  font-weight: 500;
  width: fit-content;

  &.wuxing-jin, &.wuxing-jin {
    background: rgba(255, 215, 0, 0.15);
    color: #b8860b;
  }
  &.wuxing-mu, &.wuxing-mu {
    background: rgba(34, 139, 34, 0.15);
    color: #228b22;
  }
  &.wuxing-shui, &.wuxing-shui {
    background: rgba(30, 144, 255, 0.15);
    color: #1e90ff;
  }
  &.wuxing-huo, &.wuxing-huo {
    background: rgba(255, 69, 0, 0.15);
    color: #ff4500;
  }
  &.wuxing-tu, &.wuxing-tu {
    background: rgba(139, 69, 19, 0.15);
    color: #8b4513;
  }
}

.detail-content {
  font-size: 26rpx;
  color: $text-secondary;
  line-height: 1.8;
  text-align: justify;
}

.summary-section {
  background: linear-gradient(135deg, rgba($gold, 0.08) 0%, rgba($gold-light, 0.15) 100%);
  margin: 0 -40rpx;
  padding: 32rpx 40rpx;
  border-bottom: none;
  border-radius: 0 0 24rpx 24rpx;
}

.summary-content {
  font-size: 28rpx;
  color: $text-primary;
  font-weight: 500;
  background: transparent;
}

// 锁定状态
.lock-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32rpx;
}

.lock-icon {
  font-size: 64rpx;
  margin-bottom: 16rpx;
}

.lock-text {
  font-size: 28rpx;
  color: $text-muted;
  margin-bottom: 32rpx;
}

.unlock-btn {
  background: linear-gradient(135deg, $accent 0%, darken($accent, 10%) 100%);
  color: #fff;
  font-size: 28rpx;
  font-weight: 600;
  padding: 24rpx 64rpx;
  border-radius: 48rpx;
  border: none;
  box-shadow: 0 8rpx 24rpx rgba($accent, 0.3);
}

// 卡片底部
.card-footer {
  padding-top: 24rpx;
  border-top: 1rpx solid $border;
  margin-top: auto;
}

.card-number {
  display: block;
  text-align: center;
  font-size: 24rpx;
  color: $text-muted;
  letter-spacing: 0.1em;
}

// 空状态
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
}

.empty-icon {
  font-size: 96rpx;
  margin-bottom: 24rpx;
}

.empty-text {
  font-size: 28rpx;
  color: $text-muted;
}

// 加载状态
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
}

.loading-spinner {
  width: 64rpx;
  height: 64rpx;
  border: 4rpx solid $border;
  border-top-color: $accent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 26rpx;
  color: $text-muted;
  margin-top: 24rpx;
}

// 底部操作
.bottom-action {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, transparent 0%, $bg-primary 30%);
  display: flex;
  gap: 24rpx;
}

.action-btn {
  flex: 1;
  height: 96rpx;
  border-radius: 48rpx;
  font-size: 28rpx;
  font-weight: 600;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn.secondary {
  background: $bg-card;
  color: $text-primary;
  box-shadow: $shadow-card;
}

.action-btn.secondary.collected {
  background: $accent-light;
  color: $accent;
}

.action-btn.primary {
  background: linear-gradient(135deg, $accent 0%, darken($accent, 10%) 100%);
  color: #fff;
  box-shadow: 0 8rpx 24rpx rgba($accent, 0.3);
}

// 返回按钮
.back-btn {
  position: fixed;
  top: calc(32rpx + env(safe-area-inset-top));
  left: 24rpx;
  padding: 16rpx 24rpx;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 32rpx;
  box-shadow: $shadow-card;
}

.back-btn text {
  font-size: 26rpx;
  color: $text-secondary;
}

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

// 按钮禁用样式
.action-btn.disabled {
  background: #e0e0e0;
  color: #999;
  box-shadow: none;
}
</style>
