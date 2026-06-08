// utils/taskApi.js — 任务云函数封装（含重试 + 错误处理）

const { withRetry, showError } = require('./error.js')

/**
 * 调用云函数的统一入口（带 1 次自动重试）
 */
function callFn(name, data, retries = 1) {
  return withRetry(() => {
    return new Promise((resolve, reject) => {
      if (!wx.cloud) {
        reject(new Error('云开发未初始化'))
        return
      }
      wx.cloud.callFunction({
        name,
        data,
        success: (res) => {
          if (res.result && res.result.success) {
            resolve(res.result.data)
          } else {
            reject(new Error(res.result?.errorMessage || '云函数返回失败'))
          }
        },
        fail: (err) => reject(new Error(err.errMsg || '网络请求失败'))
      })
    })
  }, retries, 800).catch(err => {
    showError('网络异常，请检查后重试', err, true)
    throw err
  })
}

/**
 * 根据日期获取任务列表
 */
function getTasksByDate(date) {
  return callFn('tasks', { action: 'list', date })
}

/**
 * 根据日期范围获取任务（用于统计）
 */
function getTasksByDateRange(startDate, endDate) {
  return callFn('tasks', { action: 'listRange', startDate, endDate })
}

/**
 * 添加任务
 */
function addTask(task) {
  return callFn('tasks', {
    action: 'add',
    text: task.text,
    date: task.date,
    order: task.order || 0
  })
}

/**
 * 更新任务
 */
function updateTask(id, updates) {
  return callFn('tasks', { action: 'update', id, updates })
}

/**
 * 删除任务
 */
function deleteTask(id) {
  return callFn('tasks', { action: 'delete', id })
}

/**
 * 订阅今日任务提醒
 */
function subscribeTodayReminder() {
  return callFn('subscribe', { action: 'subscribe' })
}

module.exports = {
  getTasksByDate,
  getTasksByDateRange,
  addTask,
  updateTask,
  deleteTask,
  subscribeTodayReminder
}
