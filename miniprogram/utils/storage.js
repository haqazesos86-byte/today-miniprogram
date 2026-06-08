// utils/storage.js — 本地缓存

const CACHE_KEY = 'today.cache'
const CACHE_TTL = 24 * 60 * 60 * 1000  // 24 小时

function save(date, tasks) {
  try {
    wx.setStorageSync(CACHE_KEY, {
      date,
      tasks,
      savedAt: Date.now()
    })
  } catch (e) {
    // 存储满或失败，忽略
  }
}

function load(date) {
  try {
    const cache = wx.getStorageSync(CACHE_KEY)
    if (!cache) return null
    // 检查是否是同一天
    if (cache.date !== date) return null
    // 检查是否过期
    if (Date.now() - cache.savedAt > CACHE_TTL) return null
    return cache.tasks
  } catch (e) {
    return null
  }
}

function clear() {
  try { wx.removeStorageSync(CACHE_KEY) } catch (e) {}
}

module.exports = { save, load, clear }
