// utils/subscribe.js — 订阅消息客户端封装

const taskApi = require('./taskApi.js')

/**
 * 调起客户端订阅授权弹窗
 * 用户同意后，调用云函数记录订阅状态
 *
 * ⚠️ 必须由用户点击行为触发（不能自动调）
 * ⚠️ 一次性授权，下一次推送前还要再授权
 */
async function requestSubscribe(templateIds) {
  return new Promise((resolve) => {
    wx.requestSubscribeMessage({
      tmplIds: templateIds,
      success: async (res) => {
        // res[templateId] = 'accept' | 'reject' | 'ban'
        const allAccepted = templateIds.every(id => res[id] === 'accept')
        if (allAccepted) {
          try {
            await taskApi.subscribeTodayReminder()
            wx.showToast({ title: '已开启提醒', icon: 'success' })
          } catch (err) {
            console.error('记录订阅状态失败:', err)
          }
        } else {
          wx.showToast({ title: '需要授权才能提醒', icon: 'none' })
        }
        resolve(res)
      },
      fail: (err) => {
        console.error('订阅弹窗失败:', err)
        wx.showToast({ title: '订阅失败', icon: 'none' })
        resolve({})
      }
    })
  })
}

/**
 * 取消订阅
 */
async function cancel() {
  try {
    await taskApi.callFn?.('subscribe', { action: 'unsubscribe' })
  } catch (e) {
    console.warn('取消订阅失败（可能云函数未部署）:', e)
  }
}

module.exports = {
  requestSubscribe,
  cancel
}
