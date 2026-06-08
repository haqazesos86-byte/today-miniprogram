// pages/feedback/feedback.js
const { showError, showSuccess } = require('../../utils/error.js')
const TYPES = [{ value: 'bug', emoji: '🐛', name: 'Bug' }, { value: 'feature', emoji: '✨', name: '建议' }, { value: 'praise', emoji: '👍', name: '鼓励' }, { value: 'other', emoji: '💬', name: '其他' }]
const TYPE_LABELS = { bug: '🐛 Bug', feature: '✨ 建议', praise: '👍 鼓励', other: '💬 其他' }
Page({
  data: { types: TYPES, form: { type: 'feature', content: '', contact: '' }, deviceInfo: '', submitting: false, history: [] },
  onLoad() { this.loadDeviceInfo(); this.loadHistory() },
  loadDeviceInfo() { try { const sys = wx.getSystemInfoSync(); this.setData({ deviceInfo: `${sys.model || ''} · WeChat ${sys.version || ''} · ${sys.platform || ''}` }) } catch (e) { this.setData({ deviceInfo: '设备信息不可用' }) } },
  onTypeTap(e) { this.setData({ 'form.type': e.currentTarget.dataset.value }) },
  onContentInput(e) { this.setData({ 'form.content': e.detail.value }) },
  onContactInput(e) { this.setData({ 'form.contact': e.detail.value }) },
  async onSubmit() {
    if (!this.data.form.content.trim()) { showError('请填写反馈内容', null, true); return }
    if (this.data.submitting) return
    this.setData({ submitting: true })
    try {
      const sys = wx.getSystemInfoSync()
      await wx.cloud.callFunction({ name: 'feedback', data: { action: 'submit', type: this.data.form.type, content: this.data.form.content, contact: this.data.form.contact, systemInfo: { model: sys.model, version: sys.version, platform: sys.platform } } })
      showSuccess('反馈已送达，🎉')
      this.setData({ 'form.content': '', 'form.contact': '', submitting: false })
      this.loadHistory()
    } catch (err) { showError('提交失败', err, true); this.setData({ submitting: false }) }
  },
  async loadHistory() {
    try {
      const res = await wx.cloud.callFunction({ name: 'feedback', data: { action: 'list', limit: 20 } })
      const list = (res.result && res.result.data) || []
      this.setData({ history: list.map(t => ({ ...t, typeLabel: TYPE_LABELS[t.type] || '💬 其他', timeLabel: this.formatTime(t.createdAt) })) })
    } catch (err) { console.warn('加载历史失败:', err.message) }
  },
  formatTime(ts) { const d = new Date(ts), now = new Date(); if (d.toDateString() === now.toDateString()) return `今天 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` }
})
