// cloudfunctions/tasks/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command
const TASKS = 'tasks'

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { action } = event
  try {
    let data
    switch (action) {
      case 'list': data = await listByDate(openid, event.date); break
      case 'listRange': data = await listByDateRange(openid, event.startDate, event.endDate); break
      case 'add': data = await add(openid, event); break
      case 'update': data = await update(openid, event); break
      case 'delete': data = await remove(openid, event); break
      default: return { success: false, errorMessage: `未知 action: ${action}` }
    }
    return { success: true, data }
  } catch (err) {
    return { success: false, errorMessage: err.message }
  }
}

async function listByDate(openid, date) {
  if (!date) throw new Error('date 必填')
  const res = await db.collection(TASKS).where({ _openid: openid, date }).orderBy('order', 'asc').limit(200).get()
  return res.data
}

async function listByDateRange(openid, startDate, endDate) {
  if (!startDate || !endDate) throw new Error('startDate/endDate 必填')
  const res = await db.collection(TASKS).where({ _openid: openid, date: _.gte(startDate).and(_.lte(endDate)) }).limit(1000).get()
  return res.data
}

async function add(openid, { text, date, order = 0, tag = null, priority = 'normal', dueDate = null }) {
  if (!text || !date) throw new Error('text/date 必填')
  const now = Date.now()
  const res = await db.collection(TASKS).add({ data: { _openid: openid, text: String(text).trim().slice(0, 500), date, isDone: false, doneAt: null, order: Number(order) || 0, tag: tag ? String(tag).slice(0, 20) : null, priority: ['low', 'normal', 'high'].includes(priority) ? priority : 'normal', dueDate: dueDate ? String(dueDate) : null, createdAt: now, updatedAt: now } })
  return { _id: res._id, text, date, isDone: false, order, doneAt: null, tag, priority, dueDate, createdAt: now }
}

async function update(openid, { id, updates = {} }) {
  if (!id) throw new Error('id 必填')
  const exist = await db.collection(TASKS).doc(id).get()
  if (exist.data._openid !== openid) throw new Error('无权限操作')
  const allowed = {}
  if (typeof updates.isDone === 'boolean') { allowed.isDone = updates.isDone; allowed.doneAt = updates.isDone ? (updates.doneAt || Date.now()) : null }
  if (typeof updates.text === 'string') allowed.text = updates.text.trim().slice(0, 500)
  if (typeof updates.order === 'number') allowed.order = updates.order
  if (typeof updates.tag === 'string' || updates.tag === null) allowed.tag = updates.tag ? String(updates.tag).slice(0, 20) : null
  if (typeof updates.priority === 'string') allowed.priority = ['low', 'normal', 'high'].includes(updates.priority) ? updates.priority : 'normal'
  if (typeof updates.dueDate === 'string' || updates.dueDate === null) allowed.dueDate = updates.dueDate ? String(updates.dueDate) : null
  allowed.updatedAt = Date.now()
  await db.collection(TASKS).doc(id).update({ data: allowed })
  return { _id: id, ...allowed }
}

async function remove(openid, { id }) {
  if (!id) throw new Error('id 必填')
  const exist = await db.collection(TASKS).doc(id).get()
  if (exist.data._openid !== openid) throw new Error('无权限操作')
  await db.collection(TASKS).doc(id).remove()
  return { _id: id, deleted: true }
}
