// pages/remind/remind.js
const subscribe = require('../../utils/subscribe.js')
const TEMPLATE_IDS = ['YOUR_TEMPLATE_ID']
const REFRESH_DAYS = 7
Page({
  data: { enabled: false, lastAuthAt: null, lastAuthAtText: '', refreshDays: REFRESH_DAYS },
  onLoad() { this.loadStatus() },
  onShow() { this.loadStatus() },
  async loadStatus() {
    try {
      const res = await wx.cloud.callFunction({ name: 'subscribe', data: { action: 'getStatus' } })
      if (res.result?.success) { const { enabled, lastAuthAt } = res.result.data; this.setData({ enabled, lastAuthAt, lastAuthAtText: lastAuthAt ? this.formatDate(lastAuthAt) : '从未' }) }
    } catch (err) { console.warn('获取订阅状态失败:', err.message) }
  },
  formatDate(ts) { const d = new Date(ts); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` },
  async onEnable() {
    if (TEMPLATE_IDS[0] === 'YOUR_TEMPLATE_ID') { wx.showModal({ title: '需要先配置模板', content: '请到微信公众平台 → 订阅消息 → 新增模板，把模板 ID 填到 cloudfunctions/subscribe/index.js', showCancel: false, confirmText: '知道了' }); return }
    await subscribe.requestSubscribe(TEMPLATE_IDS); this.loadStatus()
  },
  async onDisable() {
    try { await wx.cloud.callFunction({ name: 'subscribe', data: { action: 'unsubscribe' } }); wx.showToast({ title: '已关闭', icon: 'success' }); this.loadStatus() }
    catch (err) { console.error('关闭失败:', err); wx.showToast({ title: '关闭失败', icon: 'none' }) }
  }
})
