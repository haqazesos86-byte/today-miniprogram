// utils/error.js — 全局错误处理
function showError(msg, err, silent = false) {
  if (!silent) console.error(`[Today Error] ${msg}:`, err)
  wx.showToast({ title: msg, icon: 'none', duration: 2000 })
}
async function withRetry(fn, retries = 2, delay = 800) {
  let lastErr
  for (let i = 0; i <= retries; i++) {
    try { return await fn() } catch (err) {
      lastErr = err
      if (i < retries) { console.warn(`[retry ${i + 1}/${retries}]`, err.message || err); await new Promise(r => setTimeout(r, delay)) }
    }
  }
  throw lastErr
}
function isOffline() {
  try {
    if (!wx.getNetworkType) return true
    const nt = wx.getNetworkType()
    if (typeof nt === 'string') return nt === 'none'
    if (typeof nt === 'object' && nt !== null) return nt.networkType === 'none'
    return false
  } catch (e) { return true }
}
const EMPTY_HINTS = { tasks: '今天可以偷个懒了 ☕️', stats: '还没有数据，去添加几个任务吧', network: '网络好像断了', loadFail: '加载失败，下拉重试' }
module.exports = { showError, withRetry, isOffline, EMPTY_HINTS }
