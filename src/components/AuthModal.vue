<template>
  <!-- 遮罩层 -->
  <view class="modal-mask" v-if="visible" @click="onClose">
    <!-- 授权卡片 -->
    <view class="modal-card" @click.stop :class="{ show: visible }">
      <!-- 图标 -->
      <view class="modal-icon">🎭</view>

      <!-- 标题 -->
      <view class="modal-title">设置头像</view>

      <!-- 说明文字 -->
      <view class="modal-desc">
        <text>为了提供更好的服务，请选择您的头像</text>
      </view>

      <!-- 头像授权按钮（微信原生选择器） -->
      <button
        class="modal-btn primary"
        open-type="chooseAvatar"
        @chooseavatar="onChooseAvatar"
      >
        选择头像
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

// 选择头像（触发微信原生头像选择器）
async function onChooseAvatar(e) {
  const { avatarUrl } = e.detail
  console.log('选择头像:', avatarUrl)

  if (!avatarUrl) {
    uni.showToast({ title: '未选择头像', icon: 'none' })
    return
  }

  try {
    // 调用后端保存头像
    await request({
      url: '/api/user/authorize',
      method: 'POST',
      data: {
        avatar_url: avatarUrl
      }
    })

    uni.showToast({ title: '设置成功', icon: 'success' })
    emit('success')
  } catch (e) {
    console.error('保存头像失败:', e)
    uni.showToast({ title: e.message || '保存失败，请重试', icon: 'none' })
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
  margin-bottom: 16rpx;
}

.modal-desc {
  text-align: center;
  font-size: 26rpx;
  color: $muted;
  line-height: 1.6;
  margin-bottom: 32rpx;
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
