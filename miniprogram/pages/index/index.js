// pages/index/index.js
const taskApi = require('../../utils/taskApi.js')
const dateUtil = require('../../utils/date.js')
const { showError, withRetry, EMPTY_HINTS } = require('../../utils/error.js')
const storage = require('../../utils/storage.js')

const app = getApp()

Page({
  data: {
    // 加载/错误状态
    loading: true,
    hasError: false,
    errorText: '',

    // 日期
    currentDate: '',
    dateTitle: '今 天',
    dateSubtitle: '',

    // 任务数据
    tasks: [],
    undoneTasks: [],
    doneTasks: [],
    filteredUndone: [],
    filteredDone: [],
    isEmpty: true,
    hasCompleted: false,
    counts: { all: 0, undone: 0, done: 0 },

    // 过滤
    filterMode: 'all', // 'all' | 'undone' | 'done'
    searchText: '',

    // 添加任务
    addingMode: false,
    newTaskText: '',
    newTaskTag: '',
    newTaskPriority: 'normal', // 'low' | 'normal' | 'high'
    newTaskDueDate: '',

    // 标签选择弹窗
    tagPickerOpen: false,
    editingTaskId: null,

    // 输入
    inputFocused: false,
    touchStartX: 0,
    touchStartY: 0,
    touchStartTime: 0,
    swipedTaskId: null  // 当前已左滑的任务 id
  },

  onLoad() {
    this.setCurrentDate(new Date())
  },

  onShow() {
    if (this.data.currentDate && !this.data.loading) {
      this.loadTasks()
    }
  },

  // ============ 日期处理 ============
  setCurrentDate(date) {
    const dateStr = dateUtil.formatDate(date)
    const isToday = dateUtil.isToday(date)
    const title = isToday ? '今 天' : dateUtil.formatMonthDay(date)
    const subtitle = isToday
      ? `${dateUtil.formatMonthDay(date)} ${dateUtil.formatWeekday(date)}`
      : dateUtil.formatWeekday(date)

    this.setData({
      currentDate: dateStr,
      dateTitle: title,
      dateSubtitle: subtitle
    })

    this.loadTasks()
  },

  goPrev() {
    const d = dateUtil.parseDate(this.data.currentDate)
    d.setDate(d.getDate() - 1)
    this.setCurrentDate(d)
  },

  goNext() {
    const d = dateUtil.parseDate(this.data.currentDate)
    d.setDate(d.getDate() + 1)
    this.setCurrentDate(d)
  },

  // ============ 滑动切换日期 ============
  touchStart(e) {
    this.setData({
      touchStartX: e.touches[0].clientX,
      touchStartY: e.touches[0].clientY,
      touchStartTime: Date.now()
    })
  },

  touchEnd(e) {
    if (this.data.swipedTaskId) return  // 左滑打开中不切日期
    const dx = e.changedTouches[0].clientX - this.data.touchStartX
    const dy = Math.abs(e.changedTouches[0].clientY - this.data.touchStartY)
    if (dy < Math.abs(dx) * 0.5 && Math.abs(dx) > 100) {
      if (dx > 0) this.goPrev()
      else this.goNext()
    }
  },

  // ============ 数据加载 ============
  async loadTasks() {
    this.setData({ loading: true, hasError: false })
    // 优先显示本地缓存（弱网体验）
    const cached = storage.load(this.data.currentDate)
    if (cached) {
      this.processTasks(cached)
    }
    try {
      const tasks = await withRetry(
        () => taskApi.getTasksByDate(this.data.currentDate),
        2, 1000
      )
      this.processTasks(tasks)
      storage.save(this.data.currentDate, tasks)  // 缓存到本地
    } catch (err) {
      console.error('加载任务失败:', err)
      if (!cached) {
        // 没缓存 + 网络挂了 → 显示错误
        this.setData({
          loading: false,
          hasError: true,
          errorText: err.message || '网络异常，请检查后重试'
        })
      } else {
        // 有缓存 + 网络挂了 → 静默用缓存
        this.setData({ loading: false, hasError: false })
        showError('网络异常，已显示本地缓存', err, true)
      }
    }
  },

  processTasks(tasks) {
    const sorted = [...tasks].sort((a, b) => a.order - b.order)
    const today = dateUtil.formatDate(new Date())
    // 给任务加 overdue 字段
    const withOverdue = sorted.map(t => {
      let overdue = false
      let dueDateLabel = ''
      if (t.dueDate && !t.isDone) {
        overdue = t.dueDate < today
        // 友好显示：今天、明天、昨天、具体日期
        const tdy = new Date(today)
        const due = new Date(t.dueDate)
        const diffDays = Math.round((due - tdy) / 86400000)
        if (diffDays === 0) dueDateLabel = '今天'
        else if (diffDays === 1) dueDateLabel = '明天'
        else if (diffDays === -1) dueDateLabel = '昨天'
        else if (diffDays > 0 && diffDays <= 7) dueDateLabel = `${diffDays}天后`
        else if (diffDays < 0 && diffDays >= -7) dueDateLabel = `${-diffDays}天前`
        else dueDateLabel = t.dueDate.slice(5)  // MM-DD
      }
      return { ...t, overdue, dueDateLabel }
    })
    const undone = withOverdue.filter(t => !t.isDone)
    const done = withOverdue.filter(t => t.isDone)
      .sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0))

    const counts = {
      all: withOverdue.length,
      undone: undone.length,
      done: done.length
    }

    this.setData({
      tasks: withOverdue,
      undoneTasks: undone,
      doneTasks: done,
      counts,
      isEmpty: withOverdue.length === 0,
      hasCompleted: done.length > 0,
      loading: false,
      hasError: false
    })
    this.applyFilter()
  },

  onRetry() {
    this.loadTasks()
  },

  // ============ 过滤 + 搜索 ============
  applyFilter() {
    const { filterMode, searchText, undoneTasks, doneTasks } = this.data
    const search = searchText.trim().toLowerCase()

    const match = (t) => !search || (t.text && t.text.toLowerCase().includes(search))

    let fUndone = undoneTasks
    let fDone = doneTasks
    if (filterMode === 'undone') fDone = []
    if (filterMode === 'done') fUndone = []

    fUndone = fUndone.filter(match)
    fDone = fDone.filter(match)

    this.setData({
      filteredUndone: fUndone,
      filteredDone: fDone
    })
  },

  setFilter(e) {
    const mode = e.currentTarget.dataset.mode
    this.setData({ filterMode: mode })
    this.applyFilter()
  },

  onSearchInput(e) {
    this.setData({ searchText: e.detail.value })
    this.applyFilter()
  },

  onSearchConfirm(e) {
    this.setData({ searchText: e.detail.value })
    this.applyFilter()
  },

  onSearchClear() {
    this.setData({ searchText: '' })
    this.applyFilter()
  },

  // ============ 左滑手势 ============
  onItemTouchStart(e) {
    // 记录开始时间 + 位置
    this._touchStartX = e.touches[0].clientX
    this._touchStartY = e.touches[0].clientY
    this._touchStartTime = Date.now()
  },

  onItemTouchEnd(e) {
    // 触屏结束时什么也不做（让 movable-view 自己处理）
  },

  onSwipeChange(e) {
    // 实时更新 x 位置（用于动画）
    // 简化：只保存 id 用于后续操作
  },

  onTaskTap(e) {
    const { id, list } = e.currentTarget.dataset
    if (this.data.swipedTaskId === id) {
      // 已左滑 → 点击关闭
      this.closeSwipe(id)
      return
    }
    // 短按 = 切换完成
    this.toggleTaskById(id, list)
  },

  onCheckTap(e) {
    const { id, list } = e.currentTarget.dataset
    this.toggleTaskById(id, list)
  },

  onDeleteTap(e) {
    const { id, list } = e.currentTarget.dataset
    this.closeSwipe(id)
    this.deleteTaskById(id)
  },

  onEditTap(e) {
    const { id, list } = e.currentTarget.dataset
    this.closeSwipe(id)
    this.editTaskById(id)
  },

  onTaskLongPress(e) {
    const { id } = e.currentTarget.dataset
    wx.showActionSheet({
      itemList: ['编辑', '删除', '标为高优先级', '取消高优先级'],
      success: (res) => {
        if (res.tapIndex === 0) this.editTaskById(id)
        else if (res.tapIndex === 1) this.deleteTaskById(id)
        else if (res.tapIndex === 2) this.setPriority(id, 'high')
        else if (res.tapIndex === 3) this.setPriority(id, 'normal')
      }
    })
  },

  closeSwipe(id) {
    this.setData({ swipedTaskId: null })
  },

  // ============ 任务操作 ============
  async toggleTaskById(id, list) {
    const task = this.data.tasks.find(t => t.id === id)
    if (!task) return

    const updated = {
      isDone: !task.isDone,
      doneAt: !task.isDone ? Date.now() : null
    }

    // 乐观更新
    const newTasks = this.data.tasks.map(t =>
      t.id === id ? { ...t, ...updated } : t
    )
    this.processTasks(newTasks)

    try {
      await withRetry(() => taskApi.updateTask(id, updated), 1, 600)
    } catch (err) {
      console.error('更新失败:', err)
      showError('更新失败', err, true)
      this.processTasks(this.data.tasks)
    }
  },

  async setPriority(id, priority) {
    const newTasks = this.data.tasks.map(t =>
      t.id === id ? { ...t, priority } : t
    )
    this.processTasks(newTasks)
    try {
      await withRetry(() => taskApi.updateTask(id, { priority }), 1, 600)
    } catch (err) {
      showError('操作失败', err, true)
    }
  },

  deleteTaskById(id) {
    wx.showModal({
      title: '删除任务',
      content: '确定要删除这个任务吗？',
      confirmColor: '#ff3b30',
      success: async (res) => {
        if (!res.confirm) return
        const newTasks = this.data.tasks.filter(t => t.id !== id)
        this.processTasks(newTasks)
        try {
          await withRetry(() => taskApi.deleteTask(id), 1, 600)
          wx.showToast({ title: '已删除', icon: 'success', duration: 800 })
        } catch (err) {
          showError('删除失败', err, true)
          this.loadTasks()  // 回滚：重新拉
        }
      }
    })
  },

  editTaskById(id) {
    const task = this.data.tasks.find(t => t.id === id)
    if (!task) return
    this.setData({ editingTaskId: id })
    wx.showModal({
      title: '编辑任务',
      editable: true,
      placeholderText: '任务内容',
      content: task.text,
      success: async (res) => {
        if (!res.confirm) {
          this.setData({ editingTaskId: null })
          return
        }
        const newText = (res.content || '').trim()
        if (!newText || newText === task.text) {
          this.setData({ editingTaskId: null })
          return
        }
        // 乐观更新
        const newTasks = this.data.tasks.map(t =>
          t.id === id ? { ...t, text: newText } : t
        )
        this.processTasks(newTasks)
        try {
          await withRetry(() => taskApi.updateTask(id, { text: newText }), 1, 600)
        } catch (err) {
          showError('更新失败', err, true)
          this.loadTasks()
        }
        this.setData({ editingTaskId: null })
      }
    })
  },

  // ============ 添加任务 ============
  onFabTap() {
    this.setData({
      addingMode: true,
      newTaskText: '',
      newTaskTag: '',
      newTaskPriority: 'normal',
      newTaskDueDate: ''
    })
  },

  onPickDue() {
    const today = new Date()
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    wx.showActionSheet({
      itemList: ['今天截止', '明天截止', '一周内截止', '自定义'],
      success: (res) => {
        const now = new Date()
        let target = new Date(now)
        if (res.tapIndex === 0) {
          // 今天
        } else if (res.tapIndex === 1) {
          target.setDate(now.getDate() + 1)
        } else if (res.tapIndex === 2) {
          target.setDate(now.getDate() + 7)
        } else if (res.tapIndex === 3) {
          // 自定义（弹 date picker）
          // 简化：让用户用文本输入（最多 20 字）
          wx.showModal({
            title: '截止日期',
            editable: true,
            placeholderText: 'YYYY-MM-DD',
            content: this.data.newTaskDueDate || dateStr,
            success: (r) => {
              if (r.confirm && r.content && /^\d{4}-\d{2}-\d{2}$/.test(r.content.trim())) {
                this.setData({ newTaskDueDate: r.content.trim() })
              }
            }
          })
          return
        }
        const due = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(target.getDate()).padStart(2, '0')}`
        this.setData({ newTaskDueDate: due })
      }
    })
  },

  onClearDue() {
    this.setData({ newTaskDueDate: '' })
  },

  onAddInput(e) {
    this.setData({ newTaskText: e.detail.value })
  },

  onAddBlur() {
    // 失焦不关闭（用户可能在选标签）
  },

  async onAddConfirm() {
    const text = this.data.newTaskText.trim()
    if (!text) {
      this.cancelAdd()
      return
    }
    try {
      const maxOrder = this.data.tasks.reduce((m, t) => Math.max(m, t.order), -1)
      const newTask = await withRetry(
        () => taskApi.addTask({
          text,
          date: this.data.currentDate,
          order: maxOrder + 1,
          tag: this.data.newTaskTag || null,
          priority: this.data.newTaskPriority,
          dueDate: this.data.newTaskDueDate || null
        }),
        1, 600
      )
      this.processTasks([...this.data.tasks, newTask])
      this.setData({
        addingMode: false,
        newTaskText: '',
        newTaskTag: '',
        newTaskPriority: 'normal',
        newTaskDueDate: ''
      })
    } catch (err) {
      showError('添加失败', err, true)
    }
  },

  cancelAdd() {
    this.setData({
      addingMode: false,
      newTaskText: '',
      newTaskTag: '',
      newTaskPriority: 'normal',
      newTaskDueDate: '',
      tagPickerOpen: false
    })
  },

  onPickTag() {
    this.setData({ tagPickerOpen: !this.data.tagPickerOpen })
  },

  selectTag(e) {
    const tag = e.currentTarget.dataset.tag || ''
    this.setData({ newTaskTag: tag, tagPickerOpen: false })
  },

  selectPriority(e) {
    this.setData({ newTaskPriority: e.currentTarget.dataset.priority })
  }
})
