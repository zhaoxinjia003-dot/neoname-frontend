const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:20261'

function getToken() {
  return uni.getStorageSync('access_token') || ''
}

export function clearToken() {
  uni.removeStorageSync('access_token')
}

export function request(options) {
  const token = getToken()
  return new Promise((resolve, reject) => {
    uni.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...options.header,
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          // 如果是 401，清除本地 token
          if (res.statusCode === 401) {
            clearToken()
          }
          const error = new Error(res.data?.detail || '请求失败')
          error.statusCode = res.statusCode
          error.data = res.data
          reject(error)
        }
      },
      fail: reject,
    })
  })
}

export function setToken(token) {
  uni.setStorageSync('access_token', token)
}
