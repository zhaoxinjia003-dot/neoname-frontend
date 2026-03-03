<template>
  <view class="page">
    <view class="title">起名结果</view>
    <view class="list" v-if="names.length">
      <view class="item" v-for="(item, i) in names" :key="i">
        <view class="name">{{ item.name }}</view>
        <view class="teaser">{{ item.teaser }}</view>
        <view class="reason" v-if="unlocked && item.reason">{{ item.reason }}</view>
        <view class="lock-tip" v-else-if="!unlocked">
          支付 0.5 元查看详细解析
        </view>
      </view>
    </view>
    <view class="unlock-row" v-if="!unlocked && batchId">
      <button class="btn" @click="onUnlock">解锁详细原因（0.5元）</button>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { request } from '../../utils/request'

const batchId = ref(0)
const unlocked = ref(false)
const names = ref([])

onMounted(() => {
  const pages = getCurrentPages()
  const cur = pages[pages.length - 1]
  const options = cur.options || {}
  batchId.value = parseInt(options.batch_id || '0', 10)
  unlocked.value = options.unlocked === '1'
  loadResult()
})

async function loadResult() {
  if (!batchId.value) return
  try {
    const r = await request({ url: `/api/names/batches/${batchId.value}` })
    names.value = r.names || []
    unlocked.value = !!r.is_unlocked
  } catch (_) {
    names.value = []
  }
}

async function onUnlock() {
  try {
    // 先创建订单
    await request({
      url: '/api/payments/orders',
      method: 'POST',
      data: { batch_id: batchId.value },
    })
    // 再调用 mock 支付
    await request({
      url: '/api/payments/mock/pay',
      method: 'POST',
      data: { batch_id: batchId.value, amount: 0.5 },
    })
    uni.showToast({ title: '已解锁' })
    await loadResult()
  } catch (e) {
    uni.showToast({ title: e.message || '解锁失败', icon: 'none' })
  }
}
</script>

<style lang="scss" scoped>
.page {
  padding: 48rpx 32rpx;
  min-height: 100vh;
  background: #f5f5f5;
}
.title {
  font-size: 40rpx;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 32rpx;
}
.list {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
}
.item {
  padding: 24rpx 0;
  border-bottom: 1rpx solid #eee;
}
.item:last-child {
  border-bottom: none;
}
.name {
  font-size: 36rpx;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 8rpx;
}
.teaser {
  font-size: 26rpx;
  color: #666;
}
.reason {
  font-size: 26rpx;
  color: #333;
  margin-top: 12rpx;
  padding: 12rpx;
  background: #f9f9f9;
  border-radius: 8rpx;
}
.lock-tip {
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
}
.unlock-row {
  margin-top: 32rpx;
}
.btn {
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  background: #1a1a1a;
  color: #fff;
  border-radius: 12rpx;
  font-size: 30rpx;
}
</style>
