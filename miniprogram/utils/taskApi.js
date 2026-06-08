// utils/taskApi.js — 任务云函数封装（含重试 + 错误处理）
const { withRetry, showError } = require('./error.js')
function callFn(name, data, retries = 1) {
  return withRetry(() => new Promise((resolve, reject) => {
    if (!wx.cloud) { reject(new Error('云开发未初始化')); return }
    wx.cloud.callFunction({
      name, data,
      success: (res) => res.result && res.result.success ? resolve(res.result.data) : reject(new Error(res.result?.errorMessage || '云函数返回失败')),
      fail: (err) => reject(new Error(err.errMsg || '网络请求失败'))
    })
  }), retries, 800).catch(err => { showError('网络异常，请检查后重试', err, true); throw err })
}
function getTasksByDate(date) { return callFn('tasks', { action: 'list', date }) }
function getTasksByDateRange(startDate, endDate) { return callFn('tasks', { action: 'listRange', startDate, endDate }) }
function addTask(task) { return callFn('tasks', { action: 'add', text: task.text, date: task.date, order: task.order || 0 }) }
function updateTask(id, updates) { return callFn('tasks', { action: 'update', id, updates }) }
function deleteTask(id) { return callFn('tasks', { action: 'delete', id }) }
function subscribeTodayReminder() { return callFn('subscribe', { action: 'subscribe' }) }
module.exports = { getTasksByDate, getTasksByDateRange, addTask, updateTask, deleteTask, subscribeTodayReminder }
