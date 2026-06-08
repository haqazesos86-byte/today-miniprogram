// utils/theme.js — 主题管理
const THEME_KEY = 'today.theme'
let currentTheme = 'auto'
let actualTheme = 'light'
function getActualTheme(theme) {
  if (theme === 'auto') { try { const sys = wx.getSystemInfoSync(); return sys.theme || 'light' } catch (e) { return 'light' } }
  return theme
}
function load() { try { return wx.getStorageSync(THEME_KEY) || 'auto' } catch (e) { return 'auto' } }
function apply(theme) {
  currentTheme = theme; actualTheme = getActualTheme(theme)
  const pages = getCurrentPages()
  if (pages.length > 0) { const page = pages[pages.length - 1]; if (actualTheme === 'dark') page.setData({ _isDark: true }); else page.setData({ _isDark: false }) }
  try { wx.setNavigationBarColor({ frontColor: actualTheme === 'dark' ? '#ffffff' : '#000000', backgroundColor: actualTheme === 'dark' ? '#1d1d1f' : '#ffffff', animation: { duration: 200, timingFunc: 'easeIn' } }) } catch (e) {}
}
function init() { const theme = load(); apply(theme); try { wx.onThemeChange && wx.onThemeChange(({ theme }) => { if (currentTheme === 'auto') { actualTheme = theme; apply('auto') } }) } catch (e) {} }
function set(theme) { try { wx.setStorageSync(THEME_KEY, theme) } catch (e) {}; apply(theme) }
function get() { return currentTheme }
function getActual() { return actualTheme }
module.exports = { init, set, get, getActual }
