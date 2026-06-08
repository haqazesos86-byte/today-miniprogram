// pages/stats/stats.js
const taskApi = require('../../utils/taskApi.js')
const dateUtil = require('../../utils/date.js')
const { showError } = require('../../utils/error.js')
Page({
  data: { viewMode: 'week', stats: { weekCreated: 0, weekDone: 0, completionRate: 0, streak: 0, totalCreated: 0, totalDone: 0, allTimeRate: 0, usedDays: 0 }, dayStats: [], calendarDays: [] },
  onLoad() { this.loadStats() },
  onShow() { this.loadStats() },
  setView(e) { this.setData({ viewMode: e.currentTarget.dataset.mode }); this.loadStats(); this.drawChart() },
  async loadStats() {
    try {
      wx.showLoading({ title: '加载中', mask: true })
      const days = this.data.viewMode === 'week' ? 7 : 30
      const dates = []
      const today = new Date()
      for (let i = days - 1; i >= 0; i--) { const d = new Date(today); d.setDate(today.getDate() - i); dates.push(d) }
      const startDate = dateUtil.formatDate(dates[0]), endDate = dateUtil.formatDate(dates[dates.length - 1])
      const tasks = await taskApi.getTasksByDateRange(startDate, endDate)
      const byDate = {}; dates.forEach(d => byDate[dateUtil.formatDate(d)] = []); tasks.forEach(t => { if (byDate[t.date]) byDate[t.date].push(t) })
      const weekList = dates.slice(-7)
      const dayStats = dates.slice().reverse().map(d => {
        const k = dateUtil.formatDate(d), list = byDate[k] || [], total = list.length, done = list.filter(t => t.isDone).length
        return { date: k, dateLabel: `${d.getMonth() + 1}/${d.getDate()}`, weekday: dateUtil.isToday(d) ? '今天' : dateUtil.formatWeekday(d).replace('星期', '周'), total, done, percent: total === 0 ? 0 : Math.round((done / total) * 100) }
      })
      let weekCreated = 0, weekDone = 0
      weekList.forEach(d => { const k = dateUtil.formatDate(d), list = byDate[k] || []; weekCreated += list.length; weekDone += list.filter(t => t.isDone).length })
      const completionRate = weekCreated === 0 ? 0 : Math.round((weekDone / weekCreated) * 100)
      const totalCreated = tasks.length, totalDone = tasks.filter(t => t.isDone).length
      const allTimeRate = totalCreated === 0 ? 0 : Math.round((totalDone / totalCreated) * 100)
      let streak = 0
      for (const d of dates.slice().reverse()) { const k = dateUtil.formatDate(d), list = byDate[k] || []; if (list.length === 0) break; const done = list.filter(t => t.isDone).length; if (done === 0) break; streak++ }
      const usedDays = Object.values(byDate).filter(l => l.length > 0).length
      const calendarDays = dates.map(d => { const k = dateUtil.formatDate(d), list = byDate[k] || [], total = list.length, done = list.filter(t => t.isDone).length; return { date: k, dayLabel: d.getDate(), hasTasks: total > 0, total, done, percent: total === 0 ? 0 : Math.round((done / total) * 100) } })
      this.setData({ stats: { weekCreated, weekDone, completionRate, streak, totalCreated, totalDone, allTimeRate, usedDays }, dayStats, calendarDays })
      this.drawChart()
    } catch (err) { console.error('统计加载失败:', err); showError('加载失败', err, true) } finally { wx.hideLoading() }
  },
  drawChart() {
    const query = wx.createSelectorQuery()
    query.select('#trendChart').fields({ node: true, size: true }).exec((res) => {
      if (!res[0] || !res[0].node) return
      const canvas = res[0].node, ctx = canvas.getContext('2d'), dpr = wx.getSystemInfoSync().pixelRatio, w = res[0].width, h = res[0].height
      canvas.width = w * dpr; canvas.height = h * dpr; ctx.scale(dpr, dpr)
      const padding = { l: 40, r: 20, t: 20, b: 30 }, cw = w - padding.l - padding.r, ch = h - padding.t - padding.b
      ctx.clearRect(0, 0, w, h)
      const stats = this.data.dayStats; if (!stats.length) return
      const maxVal = Math.max(...stats.map(s => Math.max(s.total, s.done)), 1), niceMax = Math.ceil(maxVal) || 1, yTicks = 4
      ctx.font = '20px -apple-system, sans-serif'; ctx.fillStyle = '#c7c7cc'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'
      for (let i = 0; i <= yTicks; i++) { const v = Math.round((niceMax / yTicks) * (yTicks - i)), y = padding.t + (ch / yTicks) * i; ctx.fillText(v, padding.l - 6, y); ctx.strokeStyle = '#f0f0f0'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(padding.l, y); ctx.lineTo(w - padding.r, y); ctx.stroke() }
      const groupW = cw / stats.length, barW = Math.max((groupW - 4) / 2, 2)
      stats.forEach((s, i) => {
        const x0 = padding.l + groupW * i + groupW / 2
        if (s.total > 0) { const bh1 = (s.total / niceMax) * ch, x1 = x0 - barW - 1, y1 = padding.t + ch - bh1; ctx.fillStyle = '#c7c7cc'; ctx.fillRect(x1, y1, barW, bh1); if (bh1 > 18) { ctx.fillStyle = '#86868b'; ctx.font = '16px -apple-system, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(s.total, x1 + barW / 2, y1 - 6) } }
        if (s.done > 0) { const bh2 = (s.done / niceMax) * ch, x2 = x0 + 1, y2 = padding.t + ch - bh2; ctx.fillStyle = '#1f8a4c'; ctx.fillRect(x2, y2, barW, bh2); if (bh2 > 18) { ctx.fillStyle = '#1f8a4c'; ctx.font = '16px -apple-system, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(s.done, x2 + barW / 2, y2 - 6) } }
        if (this.data.viewMode === 'month' && i % 5 !== 0) return
        ctx.fillStyle = '#86868b'; ctx.font = '18px -apple-system, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(s.dateLabel, x0, padding.t + ch + 6)
      })
      const legendY = padding.t + 4; ctx.font = '20px -apple-system, sans-serif'; ctx.textBaseline = 'middle'
      ctx.fillStyle = '#1f8a4c'; ctx.fillRect(w - 180, legendY, 14, 14); ctx.fillStyle = '#1d1d1f'; ctx.textAlign = 'left'; ctx.fillText('完成', w - 160, legendY + 7)
      ctx.fillStyle = '#c7c7cc'; ctx.fillRect(w - 100, legendY, 14, 14); ctx.fillStyle = '#1d1d1f'; ctx.fillText('新建', w - 80, legendY + 7)
    })
  },
  onDateTap(e) { const date = e.currentTarget.dataset.date; const pages = getCurrentPages(); const indexPage = pages.find(p => p.route === 'pages/index/index'); if (indexPage) { indexPage.setCurrentDate(dateUtil.parseDate(date)); wx.navigateBack() } }
})
