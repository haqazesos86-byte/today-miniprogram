// cloudfunctions/feedback/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const FEEDBACK = 'feedback'

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { action } = event
  try {
    let data
    switch (action) {
      case 'submit': data = await submit(openid, event); break
      case 'list': data = await list(openid, event); break
      default: return { success: false, errorMessage: `未知 action: ${action}` }
    }
    return { success: true, data }
  } catch (err) { return { success: false, errorMessage: err.message } }
}

async function submit(openid, { type, content, contact }) {
  if (!content || !content.trim()) throw new Error('反馈内容不能为空')
  if (content.length > 1000) throw new Error('反馈内容不能超过 1000 字')
  const validTypes = ['bug', 'feature', 'praise', 'other']
  const feedbackType = validTypes.includes(type) ? type : 'other'
  const now = Date.now()
  const res = await db.collection(FEEDBACK).add({
    data: {
      _openid: openid,
      type: feedbackType,
      content: content.trim(),
      contact: contact ? String(contact).slice(0, 100) : '',
      status: 'pending',
      systemInfo: { model: event.systemInfo?.model || '', version: event.systemInfo?.version || '', platform: event.systemInfo?.platform || '' },
      createdAt: now
    }
  })
  return { _id: res._id, status: 'pending' }
}

async function list(openid, { limit = 50 } = {}) {
  const res = await db.collection(FEEDBACK).where({ _openid: openid }).orderBy('createdAt', 'desc').limit(Math.min(limit, 100)).get()
  return res.data
}
