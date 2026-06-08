// pages/onboarding/onboarding.js
const ONBOARDED_KEY = 'today.onboarded'
Page({
  data: { current: 0 },
  onSwiperChange(e) { this.setData({ current: e.detail.current }) },
  onNext() { if (this.data.current < 3) this.setData({ current: this.data.current + 1 }); else this.finish() },
  onSkip() { this.finish() },
  finish() { try { wx.setStorageSync(ONBOARDED_KEY, true) } catch (e) {}; wx.reLaunch({ url: '/pages/index/index' }) }
})
