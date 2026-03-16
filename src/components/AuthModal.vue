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
