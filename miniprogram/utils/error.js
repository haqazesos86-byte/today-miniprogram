// utils/error.js — 全局错误处理

/**
 * 统一错误提示
 * @param {string} msg 用户友好的提示
 * @param {Error} err 原始错误
 * @param {boolean} silent 是否静默（不打 console）
 */
function showError(msg, err, silent = false) {
  if (!silent) {
    console.error(`[Today Error] ${msg}:`, err)
  }
  wx.showToast({
    title: msg,
    icon: 'none',
    duration: 2000
  })
}

/**
 * 网络/重试包装
 * @param {Function} fn 要重试的异步函数
 * @param {number} retries 重试次数
 * @param {number} delay 重试间隔 ms
 */
async function withRetry(fn, retries = 2, delay = 800) {
  let lastErr
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      if (i < retries) {
        console.warn(`[retry ${i + 1}/${retries}]`, err.message || err)
        await new Promise(r => setTimeout(r, delay))
      }
    }
  }
  throw lastErr
}

/**
 * 检测是否离线
 */
function isOffline() {
  try {
    if (!wx.getNetworkType) return true
    const nt = wx.getNetworkType()
    // nt 可能是 string 或 object({networkType})
    if (typeof nt === 'string') return nt === 'none'
    if (typeof nt === 'object' && nt !== null) return nt.networkType === 'none'
    return false
  } catch (e) {
    return true
  }
}

/**
 * 全局 Promise 拒绝捕获
 */
function installGlobalHandler() {
  // 小程序的 onError 在 App.js 里注册
  // 这里只暴露工具方法
}

/**
 * 空数据兜底文案
 */
const EMPTY_HINTS = {
  tasks: '今天可以偷个懒了 ☕️',
  stats: '还没有数据，去添加几个任务吧',
  network: '网络好像断了',
  loadFail: '加载失败，下拉重试'
}

module.exports = {
  showError,
  withRetry,
  isOffline,
  installGlobalHandler,
  EMPTY_HINTS
}
