<template>
  <!-- 遮罩层 -->
  <view class="modal-mask" v-if="visible" @click="onClose">
    <!-- 授权卡片 -->
    <view class="modal-card" @click.stop :class="{ show: visible }">
      <!-- 图标 -->
      <view class="modal-icon">👤</view>

      <!-- 标题 -->
      <view class="modal-title">完善个人信息</view>

      <!-- 说明文字 -->
      <view class="modal-desc">
        <text>为了提供更好的服务，请完善以下信息：</text>
      </view>

      <!-- 头像选择 -->
      <view class="form-item">
        <view class="form-label">头像</view>
        <button
          class="avatar-btn"
          open-type="chooseAvatar"
          @chooseavatar="onChooseAvatar"
        >
          <image
            v-if="avatarUrl"
            :src="avatarUrl"
            class="avatar-img"
            mode="aspectFill"
          />
          <view v-else class="avatar-placeholder">
            <text class="avatar-placeholder-text">点击选择头像</text>
          </view>
        </button>
      </view>

      <!-- 手机号授权 -->
      <view class="form-item">
        <view class="form-label">手机号</view>
        <button
          v-if="!phone"
          class="phone-btn"
          open-type="getPhoneNumber"
          @getphonenumber="onGetPhoneNumber"
        >
          <text class="phone-btn-text">📱 获取手机号</text>
        </button>
        <view v-else class="phone-display">
          <text class="phone-text">{{ phone }}</text>
          <text class="phone-check">✓</text>
        </view>
      </view>

      <!-- 提交按钮 -->
      <button
        class="modal-btn primary"
        :disabled="!canSubmit"
        @click="onSubmit"
      >
        完成授权
      </button>

      <!-- 取消按钮 -->
      <view class="modal-cancel" @click="onClose">
        稍后再说
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { request } from '../utils/request.js'

const props = defineProps({
  visible: Boolean
})

const emit = defineEmits(['close', 'success'])

// 状态
const avatarUrl = ref('')
const phone = ref('')

// 是否可以提交（需要头像和手机号）
const canSubmit = computed(() => {
  return avatarUrl.value && phone.value
})

function onClose() {
  // 清空状态
  avatarUrl.value = ''
  phone.value = ''
  emit('close')
}

// 选择头像
function onChooseAvatar(e) {
  const { avatarUrl: tempAvatarUrl } = e.detail
  console.log('选择头像:', tempAvatarUrl)

  if (tempAvatarUrl) {
    avatarUrl.value = tempAvatarUrl
  }
}

// 获取手机号
async function onGetPhoneNumber(e) {
  console.log('获取手机号:', e.detail)

  if (e.detail.errMsg === 'getPhoneNumber:fail user deny') {
    uni.showToast({ title: '已取消授权', icon: 'none' })
    return
  }

  if (!e.detail.code) {
    uni.showToast({ title: '获取手机号失败', icon: 'none' })
    return
  }

  try {
    // 调用后端解密手机号
    const res = await request({
      url: '/api/auth/wechat/phone',
      method: 'POST',
      data: {
        code: e.detail.code
      }
    })

    phone.value = res.phone
    uni.showToast({ title: '手机号获取成功', icon: 'success' })
  } catch (err) {
    console.error('获取手机号失败:', err)
    uni.showToast({ title: err.message || '获取手机号失败', icon: 'none' })
  }
}

// 提交授权信息
async function onSubmit() {
  if (!canSubmit.value) {
    uni.showToast({ title: '请完善所有信息', icon: 'none' })
    return
  }

  try {
    // 调用后端保存用户信息
    await request({
      url: '/api/user/authorize',
      method: 'POST',
      data: {
        avatar_url: avatarUrl.value,
        phone: phone.value
      }
    })

    uni.showToast({ title: '授权成功', icon: 'success' })

    // 清空状态
    avatarUrl.value = ''
    phone.value = ''

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
$border: #e0d9cf;

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
  margin-bottom: 16rpx;
}

.modal-desc {
  text-align: center;
  font-size: 26rpx;
  color: $muted;
  line-height: 1.6;
  margin-bottom: 32rpx;
}

// 表单项
.form-item {
  margin-bottom: 24rpx;
}

.form-label {
  font-size: 26rpx;
  color: $foreground;
  font-weight: 500;
  margin-bottom: 12rpx;
}

// 头像选择
.avatar-btn {
  width: 160rpx;
  height: 160rpx;
  padding: 0;
  border: none;
  background: transparent;
  display: block;
  margin: 0 auto;
}

.avatar-img {
  width: 160rpx;
  height: 160rpx;
  border-radius: 80rpx;
  border: 4rpx solid $border;
}

.avatar-placeholder {
  width: 160rpx;
  height: 160rpx;
  border-radius: 80rpx;
  border: 4rpx dashed $border;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba($border, 0.3);
}

.avatar-placeholder-text {
  font-size: 24rpx;
  color: $muted;
  text-align: center;
}

// 手机号
.phone-btn {
  width: 100%;
  height: 88rpx;
  border-radius: 16rpx;
  background: rgba($primary, 0.1);
  border: 2rpx solid rgba($primary, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.phone-btn-text {
  font-size: 28rpx;
  color: $primary;
  font-weight: 500;
}

.phone-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx;
  background: rgba($primary, 0.05);
  border-radius: 16rpx;
  border: 2rpx solid rgba($primary, 0.2);
}

.phone-text {
  font-size: 28rpx;
  color: $foreground;
  font-weight: 500;
}

.phone-check {
  font-size: 32rpx;
  color: #52c41a;
}

// 提交按钮
.modal-btn {
  width: 100%;
  height: 96rpx;
  border-radius: 24rpx;
  font-size: 30rpx;
  font-weight: 600;
  border: none;
  margin-top: 16rpx;
  margin-bottom: 16rpx;

  &.primary {
    background: linear-gradient(135deg, $primary 0%, darken($primary, 10%) 100%);
    color: #fff;
    box-shadow: 0 8rpx 24rpx rgba($primary, 0.3);
  }

  &[disabled] {
    opacity: 0.5;
    box-shadow: none;
  }
}

.modal-cancel {
  text-align: center;
  font-size: 26rpx;
  color: $muted;
  padding: 16rpx;
}
</style>
