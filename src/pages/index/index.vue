<template>
  <view class="page">
    <!-- 顶部留白 -->
    <view class="top-spacer" />

    <!-- Header -->
    <view class="header">
      <image
        class="header-bg"
        src="/static/images/hero-baby.png"
        mode="widthFix"
      />
    </view>

    <!-- 为何选择我们：参考 ai-trust-section -->
    <view class="trust-section">
      <view class="trust-title-wrap">
        <view class="trust-title-bar" />
        <text class="trust-title">为何选择我们</text>
      </view>
      <view class="trust-grid">
        <view v-for="item in trustItems" :key="item.title" class="trust-card">
          <view class="trust-card-icon-wrap">
            <text class="trust-card-icon">{{ item.icon }}</text>
          </view>
          <text class="trust-card-title">{{ item.title }}</text>
          <text class="trust-card-desc">{{ item.desc }}</text>
        </view>
      </view>
    </view>

    <!-- 宝宝信息表单：参考 naming-form -->
    <view class="form-card">
      <view class="form-head">
        <text class="form-head-title">宝宝信息</text>
        <text class="form-head-desc">填写信息后即可生成契合八字的佳名</text>
      </view>
      <view class="form-body">
        <view class="form-row border-b">
          <text class="form-label">姓氏</text>
          <input v-model="form.surname" class="form-input" placeholder="请输入姓氏" />
        </view>
        <view class="form-row border-b">
          <text class="form-label">性别</text>
          <view class="form-options">
            <view
              :class="['form-option', form.gender === 'male' && 'form-option--active']"
              @click="form.gender = 'male'"
            >
              <text>男宝宝</text>
            </view>
            <view
              :class="['form-option', form.gender === 'female' && 'form-option--active']"
              @click="form.gender = 'female'"
            >
              <text>女宝宝</text>
            </view>
          </view>
        </view>
        <view class="form-row border-b">
          <text class="form-label">出生日期</text>
          <view class="form-picker" @click="openDatePicker('birth_date')" :class="[!form.birth_date && 'form-picker--placeholder']">
            {{ form.birth_date || '请选择出生日期' }}
          </view>
        </view>
        <view class="form-row border-b">
          <text class="form-label">名字字数</text>
          <view class="form-options">
            <view
              :class="['form-option', form.name_length === 'single' && 'form-option--active']"
              @click="form.name_length = 'single'"
            >
              <text>单字</text>
            </view>
            <view
              :class="['form-option', form.name_length === 'double' && 'form-option--active']"
              @click="form.name_length = 'double'"
            >
              <text>双字</text>
            </view>
          </view>
        </view>
        <view class="form-row">
          <text class="form-label">忌用字 <text class="form-label-optional">（可选）</text></text>
          <input v-model="form.avoided_chars" class="form-input" placeholder="多个字用逗号分隔" />
        </view>
      </view>

      <!-- 父母信息（可选） -->
      <view class="parent-toggle" @click="showParents = !showParents">
        <text class="parent-toggle-text">父母信息（可选）</text>
        <text class="parent-toggle-icon">{{ showParents ? '▲' : '▼' }}</text>
      </view>
      <view v-if="showParents" class="form-body">
        <view class="form-row border-b">
          <text class="form-label">父亲生日 <text class="form-label-optional">（可选）</text></text>
          <view class="form-picker-wrap">
            <view class="form-picker" @click="openDatePicker('father_birth_date')" :class="[!form.father_birth_date && 'form-picker--placeholder']">
              {{ form.father_birth_date || '请选择父亲生日' }}
            </view>
            <text class="form-picker-clear" v-if="form.father_birth_date" @click.stop="form.father_birth_date = ''">×</text>
          </view>
        </view>
        <view class="form-row">
          <text class="form-label">母亲生日 <text class="form-label-optional">（可选）</text></text>
          <view class="form-picker-wrap">
            <view class="form-picker" @click="openDatePicker('mother_birth_date')" :class="[!form.mother_birth_date && 'form-picker--placeholder']">
              {{ form.mother_birth_date || '请选择母亲生日' }}
            </view>
            <text class="form-picker-clear" v-if="form.mother_birth_date" @click.stop="form.mother_birth_date = ''">×</text>
          </view>
        </view>
      </view>
      <view class="form-footer">
        <button class="btn-submit" @click="onSubmit">
          <text class="btn-submit-text">生成好名字</text>
        </button>
      </view>
    </view>

    <view class="page-note">
      由顶尖 AI 大模型深度分析，结合各地区民俗传统与命理精髓，为宝宝量身定制吉祥好名
    </view>

    <!-- 自定义加载动画 -->
    <view class="loading-overlay" v-if="loading">
      <view class="loading-modal">
        <view class="loading-icon-wrap">
          <text class="loading-icon">{{ loadingStages[loadingStage].icon }}</text>
        </view>
        <text class="loading-text">{{ loadingStages[loadingStage].text }}</text>
        <view class="loading-progress">
          <view
            v-for="(stage, index) in loadingStages"
            :key="index"
            :class="['progress-dot', { active: index <= loadingStage, current: index === loadingStage }]"
          />
        </view>
      </view>
    </view>

    <!-- 自定义日期选择器弹窗 -->
    <view class="picker-mask" v-if="showDatePicker" @click="closeDatePicker">
      <view class="picker-modal" @click.stop>
        <view class="picker-header">
          <text class="picker-cancel" @click="closeDatePicker">取消</text>
          <text class="picker-title">选择日期</text>
          <text class="picker-confirm" @click="closeDatePicker">确定</text>
        </view>
        <picker-view class="picker-view" :value="datePickerValue" @change="onDatePickerChange">
          <picker-view-column>
            <view class="picker-item" v-for="y in years" :key="y">{{ y }}年</view>
          </picker-view-column>
          <picker-view-column>
            <view class="picker-item" v-for="m in months" :key="m">{{ m }}</view>
          </picker-view-column>
          <picker-view-column>
            <view class="picker-item" v-for="d in days" :key="d">{{ d }}日</view>
          </picker-view-column>
        </picker-view>
      </view>
    </view>

    <!-- 授权弹窗 -->
    <AuthModal
      :visible="showAuthModal"
      @close="showAuthModal = false"
      @success="onAuthSuccess"
    />
  </view>
</template>

<script setup>
import { request, setToken } from '../../utils/request.js'
import { reactive, ref } from 'vue'
import AuthModal from '../../components/AuthModal.vue'

const trustItems = [
  { icon: '◆', title: '顶尖 AI 大模型', desc: 'AI 深度分析汉字音形义' },
  { icon: '◇', title: '各地民俗融合', desc: '覆盖30+省市起名习俗' },
  { icon: '◆', title: '国学命理精研', desc: '八字五行+周易卦象' },
  { icon: '◇', title: '智能精准推荐', desc: '亿级语料多维评分' },
]

const showParents = ref(false)

// 自定义日期选择器
const currentYear = new Date().getFullYear()
const years = Array.from({length: currentYear - 1970 + 1}, (_, i) => 1970 + i)
const months = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
const days = Array.from({length: 31}, (_, i) => i + 1)

// 默认值：当前年份，索引为 currentYear - 1970
const datePickerValue = ref([currentYear - 1970, 0, 0])
const showDatePicker = ref(false)
const currentPickerField = ref('')

function openDatePicker(field) {
  currentPickerField.value = field
  const val = form[field]
  if (val && val.includes('-')) {
    const parts = val.split('-')
    const y = parseInt(parts[0])
    const m = parseInt(parts[1])
    const d = parseInt(parts[2])
    const yIdx = years.indexOf(y)
    if (yIdx >= 0 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      datePickerValue.value = [yIdx, m - 1, d - 1]
    } else {
      datePickerValue.value = [currentYear - 1970, 0, 0]
    }
  } else {
    datePickerValue.value = [currentYear - 1970, 0, 0]
  }
  showDatePicker.value = true
}

function onDatePickerChange(e) {
  const [yIdx, mIdx, dIdx] = e.detail.value
  if (yIdx === undefined || mIdx === undefined || dIdx === undefined) return
  const y = years[yIdx]
  if (!y) return
  const m = String(mIdx + 1).padStart(2, '0')
  const d = String(dIdx + 1).padStart(2, '0')
  form[currentPickerField.value] = `${y}-${m}-${d}`
  datePickerValue.value = [yIdx, mIdx, dIdx]
}

function closeDatePicker() {
  showDatePicker.value = false
}

// 加载状态
const loading = ref(false)
const loadingStage = ref(0) // 0: 初始, 1: 万年历, 2: 生成名字, 3: 分析名字
const loadingStages = [
  { text: '正在查找万年历信息', icon: '📅' },
  { text: '正在生成名字', icon: '✍️' },
  { text: '正在分析名字', icon: '🔍' },
]

const form = reactive({
  surname: '',
  gender: 'male',
  birth_date: '',
  name_length: 'double',
  avoided_chars: '',
  father_birth_date: '',
  mother_birth_date: '',
})

const showAuthModal = ref(false)  // 是否显示授权弹窗

function onDateChange(e) {
  form.birth_date = e.detail.value
}

function onFatherDateChange(e) {
  const [yIdx, mIdx, dIdx] = e.detail.value
  const y = years[yIdx]
  const m = String(mIdx + 1).padStart(2, '0')
  const d = String(dIdx + 1).padStart(2, '0')
  form.father_birth_date = `${y}-${m}-${d}`
}

function onMotherDateChange(e) {
  const [yIdx, mIdx, dIdx] = e.detail.value
  const y = years[yIdx]
  const m = String(mIdx + 1).padStart(2, '0')
  const d = String(dIdx + 1).padStart(2, '0')
  form.mother_birth_date = `${y}-${m}-${d}`
}

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
      // 获取微信登录凭证
      const loginResult = await new Promise((resolve, reject) => {
        uni.login({
          provider: 'weixin',
          success: resolve,
          fail: reject
        })
      })

      // 使用真实的微信 code 登录
      const loginRes = await request({
        url: '/api/auth/wechat/login',
        method: 'POST',
        data: { code: loginResult.code },
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
    if (e.statusCode === 429 || (e.message && e.message.includes('已用完'))) {
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
</script>

<style lang="scss" scoped>
/* 参考 generate-baby-names app/globals.css 配色 */
$background: #f7f4f0;
$foreground: #2d2620;
$card: #fdf9f2;
$primary: #c85a28;
$primary-foreground: #fdf9f2;
$secondary: #ebe5dc;
$border: #e0d9cf;
$muted: #7a726b;
$radius: 24rpx;

.page {
  min-height: 100vh;
  background: $background;
  padding-bottom: 64rpx;
  box-sizing: border-box;
}
.top-spacer { height: 16rpx; }

/* Header */
.header {
  margin: 32rpx;
  border-radius: 32rpx;
  overflow: hidden;
}
.header-bg {
  width: 100%;
  display: block;
}

/* 为何选择我们 */
.trust-section {
  margin: 24rpx 32rpx;
  background: $card;
  border: 1rpx solid $border;
  border-radius: 24rpx;
  padding: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}
.trust-title-wrap {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 12rpx;
}
.trust-title-bar {
  width: 6rpx;
  height: 24rpx;
  border-radius: 3rpx;
  background: $primary;
}
.trust-title {
  font-size: 26rpx;
  font-weight: 600;
  color: $foreground;
  letter-spacing: 0.02em;
}
.trust-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12rpx;
}
.trust-card {
  background: rgba($secondary, 0.6);
  border: 1rpx solid rgba($border, 0.6);
  border-radius: 16rpx;
  padding: 12rpx;
}
.trust-card-icon-wrap {
  width: 32rpx;
  height: 32rpx;
  border-radius: 8rpx;
  background: rgba($primary, 0.1);
  align-items: center;
  justify-content: center;
  display: flex;
  margin-bottom: 6rpx;
}
.trust-card-icon {
  font-size: 18rpx;
  color: $primary;
}
.trust-card-title {
  font-size: 22rpx;
  font-weight: 600;
  color: $foreground;
  display: block;
  margin-bottom: 2rpx;
}
.trust-card-desc {
  font-size: 18rpx;
  color: $muted;
  line-height: 1.3;
}

/* 表单卡片 */
.form-card {
  margin: 32rpx;
  background: $card;
  border: 1rpx solid $border;
  border-radius: 32rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  overflow: hidden;
}
.form-head {
  padding: 40rpx 40rpx 24rpx;
}
.form-head-title {
  font-size: 34rpx;
  font-weight: 600;
  color: $foreground;
  letter-spacing: 0.02em;
  display: block;
}
.form-head-desc {
  font-size: 24rpx;
  color: $muted;
  margin-top: 8rpx;
  display: block;
}
.form-body { padding: 0 40rpx; }
.form-row {
  padding: 28rpx 0;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}
.form-row.border-b { border-bottom: 1rpx solid $border; }
.form-label {
  font-size: 24rpx;
  color: $muted;
  font-weight: 500;
}
.form-label-optional { opacity: 0.7; }
.form-input {
  font-size: 30rpx;
  color: $foreground;
  padding: 0;
  background: transparent;
}
.form-input::placeholder { color: rgba($muted, 0.5); }
.form-options {
  display: flex;
  gap: 24rpx;
}
.form-option {
  flex: 1;
  padding: 20rpx;
  border-radius: 24rpx;
  text-align: center;
  font-size: 26rpx;
  font-weight: 500;
  background: $secondary;
  color: $foreground;
}
.form-option--active {
  background: $primary;
  color: $primary-foreground;
  box-shadow: 0 2rpx 8rpx rgba($primary, 0.3);
}
.form-picker {
  font-size: 30rpx;
  color: $foreground;
  flex: 1;
}
.form-picker--placeholder { color: rgba($muted, 0.5); }
.form-picker-wrap {
  display: flex;
  align-items: center;
  flex: 1;
}
.form-picker-clear {
  font-size: 32rpx;
  color: $muted;
  padding: 8rpx 16rpx;
  margin-left: 8rpx;
}
.form-footer {
  padding: 24rpx 40rpx 40rpx;
}
.btn-submit {
  width: 100%;
  padding: 28rpx;
  border-radius: 24rpx;
  background: $primary;
  color: $primary-foreground;
  font-size: 30rpx;
  font-weight: 600;
  box-shadow: 0 4rpx 16rpx rgba($primary, 0.35);
  border: none;
}
.btn-submit-text { color: $primary-foreground; }

/* 父母信息 */
.parent-toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 40rpx;
  border-top: 1rpx solid $border;
  background: rgba($secondary, 0.4);
}
.parent-toggle-text {
  font-size: 26rpx;
  color: $primary;
  font-weight: 500;
}
.parent-toggle-icon {
  font-size: 22rpx;
  color: $primary;
}

.page-note {
  text-align: center;
  font-size: 22rpx;
  color: rgba($muted, 0.85);
  line-height: 1.5;
  margin: 32rpx 48rpx 0;
}

// 自定义加载动画
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-modal {
  background: #fff;
  border-radius: 24rpx;
  padding: 48rpx 64rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 16rpx 64rpx rgba(0, 0, 0, 0.2);
}

.loading-icon-wrap {
  width: 120rpx;
  height: 120rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24rpx;
}

.loading-icon {
  font-size: 64rpx;
  animation: bounce 1s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10rpx); }
}

.loading-text {
  font-size: 28rpx;
  color: $foreground;
  font-weight: 500;
  margin-bottom: 32rpx;
}

.loading-progress {
  display: flex;
  gap: 16rpx;
}

.progress-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 6rpx;
  background: #e0d9cf;
  transition: all 0.3s ease;

  &.active {
    background: $primary;
  }

  &.current {
    animation: pulse 0.8s ease-in-out infinite;
  }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.3); opacity: 0.7; }
}

// 自定义日期选择器
.picker-mask {
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

.picker-modal {
  width: 100%;
  background: #fff;
  border-radius: 32rpx 32rpx 0 0;
  padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1rpx solid #ebe5dc;
}

.picker-cancel {
  font-size: 28rpx;
  color: #7a726b;
}

.picker-title {
  font-size: 30rpx;
  color: #2d2620;
  font-weight: 600;
}

.picker-confirm {
  font-size: 28rpx;
  color: #c85a28;
  font-weight: 600;
}

.picker-view {
  height: 400rpx;
}

.picker-item {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  color: #2d2620;
}
</style>
