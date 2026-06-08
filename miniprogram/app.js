// TODO: 替换为你的云开发环境 ID（在微信开发者工具"云开发"控制台获取）
const CLOUD_ENV = 'jasonzhao-d5gt994xp455c624f'
const app = getApp()

App({
  globalData: {
    userInfo: null,
    openid: null,
    cloudEnv: CLOUD_ENV
  },

  onLaunch() {
    if (wx.cloud) {
      wx.cloud.init({
        env: CLOUD_ENV,
        traceUser: true
      })
    }
    const systemInfo = wx.getSystemInfoSync()
    this.globalData.systemInfo = systemInfo
    console.log('📱 设备:', systemInfo.model, '微信:', systemInfo.version)
    const theme = require('./utils/theme.js')
    theme.init()
  }
})
