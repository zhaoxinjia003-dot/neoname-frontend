<template>
  <view class="page">
    <!-- 顶部留白 -->
    <view class="top-spacer" />

    <!-- Header：参考 naming-header -->
    <view class="header">
      <view class="header-badge">
        <text class="header-badge-text">AI 大模型驱动</text>
      </view>
      <view class="header-content">
        <text class="header-title">新生儿起名</text>
        <text class="header-desc">顶尖 AI 大模型 + 各地民俗传统</text>
        <view class="header-extra">
          <text class="header-extra-text">智能融合全国各地区起名习俗</text>
        </view>
      </view>
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
          <picker mode="date" :value="form.birth_date" @change="onDateChange">
            <view :class="['form-picker', !form.birth_date && 'form-picker--placeholder']">
              {{ form.birth_date || '请选择出生日期' }}
            </view>
          </picker>
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
      <view class="form-footer">
        <button class="btn-submit" @click="onSubmit">
          <text class="btn-submit-text">生成好名字</text>
        </button>
      </view>
    </view>

    <view class="page-note">
      由顶尖 AI 大模型深度分析，结合各地区民俗传统与命理精髓，为宝宝量身定制吉祥好名
    </view>
  </view>
</template>

<script setup>
import { reactive } from 'vue'

const trustItems = [
  { icon: '◆', title: '顶尖 AI 大模型', desc: '基于先进大语言模型深度分析汉字音、形、义' },
  { icon: '◇', title: '各地民俗融合', desc: '覆盖全国 30+ 省市地区起名传统与习俗讲究' },
  { icon: '◆', title: '国学命理精研', desc: '传统八字五行、周易卦象与现代语言学结合' },
  { icon: '◇', title: '智能精准推荐', desc: '千万级语料训练，每个名字都经多维度评分优选' },
]

const form = reactive({
  surname: '',
  gender: 'male',
  birth_date: '',
  name_length: 'double',
  avoided_chars: '',
})

function onDateChange(e) {
  form.birth_date = e.detail.value
}

async function onSubmit() {
  if (!form.surname.trim()) {
    uni.showToast({ title: '请填写姓氏', icon: 'none' })
    return
  }
  if (!form.birth_date) {
    uni.showToast({ title: '请选择出生日期', icon: 'none' })
    return
  }
  uni.showLoading({ title: '请先授权登录' })
  try {
    const { request, setToken } = await import('../../utils/request.js')
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
    const newbornRes = await request({
      url: '/api/newborns',
      method: 'POST',
      data: {
        surname: form.surname.trim(),
        gender: form.gender,
        birth_date: form.birth_date,
        name_length: form.name_length,
        avoided_chars: form.avoided_chars || undefined,
      },
    })
    const genRes = await request({
      url: '/api/names/generate',
      method: 'POST',
      data: { newborn_id: newbornRes.newborn_id },
    })
    uni.hideLoading()
    uni.navigateTo({
      url: `/pages/result/result?batch_id=${genRes.batch_id}&unlocked=${genRes.is_unlocked ? 1 : 0}`,
    })
  } catch (e) {
    uni.hideLoading()
    uni.showToast({ title: e.message || '失败', icon: 'none' })
  }
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
  min-height: 320rpx;
  background: linear-gradient(180deg, rgba($foreground, 0.12) 0%, rgba($foreground, 0.06) 40%, rgba($foreground, 0.02) 100%),
    linear-gradient(135deg, hsl(18, 45%, 55%) 0%, hsl(25, 35%, 45%) 100%);
  position: relative;
}
.header-badge {
  position: absolute;
  top: 24rpx;
  right: 24rpx;
  background: rgba($card, 0.9);
  border: 1rpx solid rgba($primary, 0.2);
  border-radius: 999rpx;
  padding: 12rpx 24rpx;
}
.header-badge-text {
  font-size: 22rpx;
  font-weight: 600;
  color: $foreground;
}
.header-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 40rpx 32rpx 32rpx;
}
.header-title {
  font-size: 44rpx;
  font-weight: 700;
  color: $card;
  letter-spacing: 0.05em;
  display: block;
  margin-bottom: 12rpx;
}
.header-desc {
  font-size: 26rpx;
  color: rgba($card, 0.9);
  display: block;
  margin-bottom: 12rpx;
}
.header-extra-text {
  font-size: 24rpx;
  color: rgba($card, 0.75);
}

/* 为何选择我们 */
.trust-section {
  margin: 24rpx 32rpx;
  background: $card;
  border: 1rpx solid $border;
  border-radius: 32rpx;
  padding: 32rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}
.trust-title-wrap {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 24rpx;
}
.trust-title-bar {
  width: 8rpx;
  height: 32rpx;
  border-radius: 4rpx;
  background: $primary;
}
.trust-title {
  font-size: 30rpx;
  font-weight: 600;
  color: $foreground;
  letter-spacing: 0.02em;
}
.trust-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24rpx;
}
.trust-card {
  background: rgba($secondary, 0.6);
  border: 1rpx solid rgba($border, 0.6);
  border-radius: 24rpx;
  padding: 24rpx;
}
.trust-card-icon-wrap {
  width: 56rpx;
  height: 56rpx;
  border-radius: 16rpx;
  background: rgba($primary, 0.1);
  align-items: center;
  justify-content: center;
  display: flex;
  margin-bottom: 16rpx;
}
.trust-card-icon {
  font-size: 28rpx;
  color: $primary;
}
.trust-card-title {
  font-size: 26rpx;
  font-weight: 600;
  color: $foreground;
  display: block;
  margin-bottom: 8rpx;
}
.trust-card-desc {
  font-size: 22rpx;
  color: $muted;
  line-height: 1.45;
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
}
.form-picker--placeholder { color: rgba($muted, 0.5); }
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
.page-note {
  text-align: center;
  font-size: 22rpx;
  color: rgba($muted, 0.85);
  line-height: 1.5;
  margin: 32rpx 48rpx 0;
}
</style>
