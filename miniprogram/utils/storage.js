// utils/storage.js — 本地缓存
const CACHE_KEY = 'today.cache'
const CACHE_TTL = 24 * 60 * 60 * 1000
function save(date, tasks) { try { wx.setStorageSync(CACHE_KEY, { date, tasks, savedAt: Date.now() }) } catch (e) {} }
function load(date) { try { const cache = wx.getStorageSync(CACHE_KEY); if (!cache) return null; if (cache.date !== date) return null; if (Date.now() - cache.savedAt > CACHE_TTL) return null; return cache.tasks } catch (e) { return null } }
function clear() { try { wx.removeStorageSync(CACHE_KEY) } catch (e) {} }
module.exports = { save, load, clear }
