// cloudfunctions/subscribe/index.js
// 订阅消息：用户授权后，每天 21:00 推送今天的未完成任务
// ⚠️ 限制：微信订阅消息是"一次性"的，每次推送前都需要用户重新授权
// 真正可靠的定时需要云函数定时触发器（每天 21:00 自动跑）
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command
const TASKS = 'tasks'
const SUBS = 'subscriptions'

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { action } = event
  try {
    let data
    switch (action) {
      case 'subscribe': data = await subscribe(openid, event); break
      case 'unsubscribe': data = await unsubscribe(openid); break
      case 'getStatus': data = await getStatus(openid); break
      case 'cronPush': data = await cronPush(); break
      default: return { success: false, errorMessage: `未知 action: ${action}` }
    }
    return { success: true, data }
  } catch (err) { return { success: false, errorMessage: err.message } }
}

async function subscribe(openid, event) {
  const now = Date.now()
  await db.collection(SUBS).where({ _openid: openid }).update({ data: { enabled: true, lastAuthAt: now, updatedAt: now } }).catch(async () => {
    await db.collection(SUBS).add({ data: { _openid: openid, enabled: true, lastAuthAt: now, createdAt: now, updatedAt: now } })
  })
  return { enabled: true, lastAuthAt: now }
}

async function unsubscribe(openid) {
  await db.collection(SUBS).where({ _openid: openid }).update({ data: { enabled: false, updatedAt: Date.now() } })
  return { enabled: false }
}

async function getStatus(openid) {
  const res = await db.collection(SUBS).where({ _openid: openid }).limit(1).get()
  if (res.data.length === 0) return { enabled: false, lastAuthAt: null }
  return { enabled: res.data[0].enabled, lastAuthAt: res.data[0].lastAuthAt }
}

async function cronPush() {
  const subs = await db.collection(SUBS).where({ enabled: true }).limit(1000).get()
  console.log(`[cronPush] 待推送用户数: ${subs.data.length}`)
  const today = new Date()
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  let sent = 0
  for (const sub of subs.data) {
    const openid = sub._openid
    const tasksRes = await db.collection(TASKS).where({ _openid: openid, date: dateStr, isDone: false }).limit(20).get()
    const undone = tasksRes.data
    if (undone.length === 0) continue
    try {
      await cloud.openapi.subscribeMessage.send({
        touser: openid,
        templateId: 'YOUR_TEMPLATE_ID', // ⚠️ 改这里
        page: 'pages/index/index',
        data: {
          thing1: { value: '今日待办' },
          thing2: { value: `${undone.length} 项未完成` },
          thing3: { value: undone[0]?.text?.slice(0, 20) || '点击查看' }
        }
      })
      sent++
    } catch (err) { console.warn(`[cronPush] 推 ${openid} 失败:`, err.message) }
  }
  return { sent, total: subs.data.length, date: dateStr }
}
