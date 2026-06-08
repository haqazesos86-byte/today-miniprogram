// utils/date.js — 日期工具

const WEEKDAYS_CN = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

function pad(n) { return n < 10 ? '0' + n : '' + n }

function formatDate(d) {
  // YYYY-MM-DD
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function parseDate(str) {
  // 解析 YYYY-MM-DD 为本地时区的 Date
  const [y, m, day] = str.split('-').map(Number)
  return new Date(y, m - 1, day)
}

function isToday(d) {
  const t = new Date()
  return d.getFullYear() === t.getFullYear() &&
         d.getMonth() === t.getMonth() &&
         d.getDate() === t.getDate()
}

function formatMonthDay(d) {
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

function formatWeekday(d) {
  return WEEKDAYS_CN[d.getDay()]
}

// 获取从今天起往前 6 天的日期数组（含今天，共 7 天）
function getLast7Days() {
  const arr = []
  const today = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    arr.push(d)
  }
  return arr
}

// 获取本周（周一到周日）的日期数组
function getCurrentWeek() {
  const arr = []
  const today = new Date()
  const dow = today.getDay() // 0=Sun, 1=Mon
  const mondayOffset = dow === 0 ? -6 : 1 - dow
  const monday = new Date(today)
  monday.setDate(today.getDate() + mondayOffset)
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    arr.push(d)
  }
  return arr
}

module.exports = {
  formatDate,
  parseDate,
  isToday,
  formatMonthDay,
  formatWeekday,
  getLast7Days,
  getCurrentWeek
}
