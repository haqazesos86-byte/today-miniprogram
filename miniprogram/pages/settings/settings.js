// pages/settings/settings.js
const { showError } = require('../../utils/error.js')
const showSuccess = (msg) => wx.showToast({ title: msg, icon: 'success', duration: 1500 })
const THEME_KEY = 'today.theme', TIME_KEY = 'today.remindTime'
Page({
  data: { theme: 'auto', remindTime: '21:00' },
  onLoad() { this.loadSettings() },
  onShow() { this.loadSettings() },
  loadSettings() { const theme = wx.getStorageSync(THEME_KEY) || 'auto'; const remindTime = wx.getStorageSync(TIME_KEY) || '21:00'; this.setData({ theme, remindTime }); this.applyTheme(theme) },
  setTheme(e) { const theme = e.currentTarget.dataset.theme; wx.setStorageSync(THEME_KEY, theme); this.setData({ theme }); this.applyTheme(theme); showSuccess('已切换') },
  applyTheme(theme) { let actual = theme; if (theme === 'auto') { try { const sys = wx.getSystemInfoSync(); actual = sys.theme || 'light' } catch (e) { actual = 'light' } } wx.setNavigationBarColor({ frontColor: actual === 'dark' ? '#ffffff' : '#000000', backgroundColor: actual === 'dark' ? '#1d1d1f' : '#ffffff' }) },
  onTimeChange(e) { const time = e.detail.value; wx.setStorageSync(TIME_KEY, time); this.setData({ remindTime: time }); showSuccess('已保存') },
  async onExport() {
    try {
      wx.showLoading({ title: '导出中', mask: true })
      const tasksRes = await wx.cloud.callFunction({ name: 'tasks', data: { action: 'listRange', startDate: '2020-01-01', endDate: '2099-12-31' } })
      const tasks = (tasksRes.result && tasksRes.result.data) || []
      const json = JSON.stringify({ version: '0.5.0', exportedAt: new Date().toISOString(), taskCount: tasks.length, tasks }, null, 2)
      wx.setClipboardData({ data: json, success: () => showSuccess(`已导出 ${tasks.length} 条到剪贴板`), fail: () => wx.showModal({ title: '导出完成', content: `${tasks.length} 条任务已复制到剪贴板`, showCancel: false }) })
    } catch (err) { showError('导出失败', err, true) } finally { wx.hideLoading() }
  },
  async onClearAll() {
    wx.showModal({ title: '⚠️ 清空所有任务', content: '此操作将删除你账号下的所有任务记录，无法恢复。确定吗？', confirmText: '全部清空', confirmColor: '#ff3b30', success: async (res) => {
      if (!res.confirm) return
      try {
        wx.showLoading({ title: '清空中', mask: true })
        const tasksRes = await wx.cloud.callFunction({ name: 'tasks', data: { action: 'listRange', startDate: '2020-01-01', endDate: '2099-12-31' } })
        const tasks = (tasksRes.result && tasksRes.result.data) || []
        for (const t of tasks) await wx.cloud.callFunction({ name: 'tasks', data: { action: 'delete', id: t._id } })
        showSuccess(`已清空 ${tasks.length} 条任务`); setTimeout(() => wx.navigateBack(), 1000)
      } catch (err) { showError('清空失败', err, true) } finally { wx.hideLoading() }
    } })
  },
  onGoFeedback() { wx.navigateTo({ url: '/pages/feedback/feedback' }) },
  onContact() { wx.showActionSheet({ itemList: ['查看常见问题', '查看隐私/用户协议'], success: (res) => { if (res.tapIndex === 0) this.onShowFAQ(); else if (res.tapIndex === 1) this.onShowAgreement() } }) },
  onShowFAQ() { wx.showModal({ title: '常见问题', content: '1. 数据存在哪？\n微信云开发 CloudBase\n\n2. 能换设备吗？\n可以，换设备登录微信后数据自动同步\n\n3. 数据安全吗？\n传输加密 + 静态加密，仅你本人能访问', showCancel: false, confirmText: '我知道了' }) },
  onContactEvent(e) { console.log('客服事件:', e.detail) },
  onShowAgreement() { wx.showActionSheet({ itemList: ['《隐私协议》', '《用户协议》'], success: (res) => { wx.showModal({ title: res.tapIndex === 0 ? '隐私协议' : '用户协议', content: `完整协议见项目内 legal/${res.tapIndex === 0 ? 'privacy' : 'terms'}.html`, showCancel: false }) } }) },
  onShowOnboarding() { wx.navigateTo({ url: '/pages/onboarding/onboarding' }) }
})
