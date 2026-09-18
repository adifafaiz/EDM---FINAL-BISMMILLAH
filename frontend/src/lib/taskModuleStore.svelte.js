/** @typedef {'backlog' | 'development' | 'testing' | 'uat' | 'to_production' | 'selesai'} TaskWorkflow */
/** @typedef {'high' | 'medium' | 'low'} TaskPriority */
/** @typedef {'pending' | 'revision' | 'approved'} ApprovalState */
/** @typedef {'teknis' | 'pic' | 'viewer'} UserRole */
/** @typedef {'approval_request' | 'approved' | 'revision' | 'comment'} NotifType */

/**
 * @typedef {Object} TaskActivity
 * @property {number} id
 * @property {string} at
 * @property {string} actor
 * @property {string} action
 */

/**
 * @typedef {Object} TaskComment
 * @property {number} id
 * @property {string} at
 * @property {string} actor
 * @property {string} body
 */

/**
 * @typedef {Object} ModuleTask
 * @property {number} id
 * @property {string} title
 * @property {string} description
 * @property {string} dashboard
 * @property {TaskWorkflow} status
 * @property {ApprovalState} approval_state
 * @property {string} pic
 * @property {string} created_by
 * @property {TaskPriority} priority
 * @property {string} deadline
 * @property {string} created_at
 * @property {string} updated_at
 * @property {string} [approval_note]
 * @property {TaskComment[]} comments
 * @property {TaskActivity[]} activity
 */

/**
 * @typedef {Object} AppNotification
 * @property {number} id
 * @property {string} at
 * @property {NotifType} type
 * @property {string} title
 * @property {string} body
 * @property {number | null} taskId
 * @property {string} dashboard
 * @property {string} toUser
 * @property {boolean} read
 */

/**
 * @typedef {Object} SessionUser
 * @property {string} id
 * @property {string} name
 * @property {UserRole} role
 * @property {string} label
 */

const STORAGE_KEY = 'edm-fe-module-tasks-v3'
const NOTIF_KEY = 'edm-fe-module-notifs-v1'
const SESSION_KEY = 'edm-fe-session-persona-v1'

/** PIC resmi per dashboard (selaras Registry owner) */
export const dashboardPicMap = {
  'GBO Dashboard': 'Alya Putri',
  FinSight: 'Citra Dewi',
  'CX Dashboard': 'Eka Rahma',
  TRAXIS: 'Gita Lestari',
  GARD: 'Hendra Wijaya',
  'EDM Core Monitor': 'Budi Santoso',
}

/** Demo personas — ganti di chrome untuk uji gate/inbox */
export const sessionPersonas = [
  { id: 'teknis', name: 'Farras Al-Risyad', role: /** @type {UserRole} */ ('teknis'), label: 'Teknis' },
  { id: 'pic-alya', name: 'Alya Putri', role: /** @type {UserRole} */ ('pic'), label: 'PIC · GBO' },
  { id: 'pic-citra', name: 'Citra Dewi', role: /** @type {UserRole} */ ('pic'), label: 'PIC · FinSight' },
  { id: 'viewer', name: 'Sinta Viewer', role: /** @type {UserRole} */ ('viewer'), label: 'Viewer' },
]

export const defaultDashboards = [
  'GBO Dashboard',
  'FinSight',
  'CX Dashboard',
  'TRAXIS',
  'GARD',
  'EDM Core Monitor',
]

function nowStamp() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`
}

function dateOnly(stamp = nowStamp()) {
  return stamp.slice(0, 10)
}

/** @param {Partial<ModuleTask> & { id: number, title: string }} raw */
function normalizeTask(raw) {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description || '',
    dashboard: raw.dashboard || 'General',
    status: raw.status || 'backlog',
    approval_state: raw.approval_state || 'approved',
    pic: raw.pic || 'You',
    created_by: raw.created_by || raw.pic || 'System',
    priority: raw.priority || 'medium',
    deadline: raw.deadline || dateOnly(),
    created_at: raw.created_at || nowStamp(),
    updated_at: raw.updated_at || raw.created_at || nowStamp(),
    approval_note: raw.approval_note || '',
    comments: Array.isArray(raw.comments) ? raw.comments : [],
    activity: Array.isArray(raw.activity) ? raw.activity : [],
  }
}

/** @returns {ModuleTask[]} */
function seedTasks() {
  return [
    normalizeTask({
      id: 1,
      title: 'SLA heatmap per region',
      description: 'Build heatmap widget for SLA breach by region on GBO.',
      dashboard: 'GBO Dashboard',
      status: 'development',
      approval_state: 'approved',
      pic: 'Alya Putri',
      created_by: 'Farras Al-Risyad',
      priority: 'high',
      deadline: '2026-09-18',
      created_at: '2026-09-01 09:00:00',
      updated_at: '2026-09-12 11:20:00',
      comments: [
        {
          id: 1,
          at: '2026-09-12 10:00:00',
          actor: 'Alya Putri',
          body: 'Pastikan legend warna konsisten dengan widget SLA lain.',
        },
      ],
      activity: [
        { id: 1, at: '2026-09-12 11:20:00', actor: 'Alya Putri', action: 'Moved to Development' },
        { id: 2, at: '2026-09-01 09:00:00', actor: 'System', action: 'Task created' },
      ],
    }),
    normalizeTask({
      id: 2,
      title: 'Throughput vs target chart',
      description: 'Line chart comparing daily throughput against monthly target.',
      dashboard: 'GBO Dashboard',
      status: 'testing',
      approval_state: 'approved',
      pic: 'Eka Rahma',
      created_by: 'Farras Al-Risyad',
      priority: 'medium',
      deadline: '2026-09-16',
      created_at: '2026-08-28 10:00:00',
      updated_at: '2026-09-13 15:00:00',
      comments: [
        {
          id: 1,
          at: '2026-09-13 14:00:00',
          actor: 'Alya Putri',
          body: 'Cek sumbu Y supaya skala target terbaca jelas.',
        },
      ],
      activity: [
        { id: 1, at: '2026-09-13 15:00:00', actor: 'Eka Rahma', action: 'Moved to Testing' },
        { id: 2, at: '2026-09-05 14:00:00', actor: 'Eka Rahma', action: 'Moved to Development' },
        { id: 3, at: '2026-08-28 10:00:00', actor: 'System', action: 'Task created' },
      ],
    }),
    normalizeTask({
      id: 3,
      title: 'Aging bucket filter',
      description: 'Add aging buckets filter for invoice cards on FinSight.',
      dashboard: 'FinSight',
      status: 'uat',
      approval_state: 'approved',
      pic: 'Citra Dewi',
      created_by: 'Citra Dewi',
      priority: 'high',
      deadline: '2026-09-12',
      created_at: '2026-08-20 08:30:00',
      updated_at: '2026-09-11 09:40:00',
      activity: [
        { id: 1, at: '2026-09-11 09:40:00', actor: 'Citra Dewi', action: 'Moved to UAT' },
        { id: 2, at: '2026-08-20 08:30:00', actor: 'System', action: 'Task created' },
      ],
    }),
    normalizeTask({
      id: 4,
      title: 'FX rate overlay',
      description: 'Overlay FX conversion rates on vendor exposure.',
      dashboard: 'FinSight',
      status: 'backlog',
      approval_state: 'approved',
      pic: 'Doni Pratama',
      created_by: 'Farras Al-Risyad',
      priority: 'medium',
      deadline: '2026-09-25',
      created_at: '2026-09-08 13:00:00',
      updated_at: '2026-09-08 13:00:00',
      activity: [{ id: 1, at: '2026-09-08 13:00:00', actor: 'System', action: 'Task created' }],
    }),
    normalizeTask({
      id: 5,
      title: 'CSAT trend by channel',
      description: 'Trend chart for CSAT across support channels.',
      dashboard: 'CX Dashboard',
      status: 'to_production',
      approval_state: 'approved',
      pic: 'Eka Rahma',
      created_by: 'Eka Rahma',
      priority: 'high',
      deadline: '2026-09-10',
      created_at: '2026-08-10 11:00:00',
      updated_at: '2026-09-10 16:00:00',
      activity: [
        { id: 1, at: '2026-09-10 16:00:00', actor: 'Eka Rahma', action: 'Moved to Production' },
        { id: 2, at: '2026-08-10 11:00:00', actor: 'System', action: 'Task created' },
      ],
    }),
    normalizeTask({
      id: 6,
      title: 'Backlog aging alert',
      description: 'Alert rule when ticket backlog ages beyond SLA.',
      dashboard: 'CX Dashboard',
      status: 'development',
      approval_state: 'approved',
      pic: 'Budi Santoso',
      created_by: 'Farras Al-Risyad',
      priority: 'high',
      deadline: '2026-09-20',
      created_at: '2026-09-02 09:15:00',
      updated_at: '2026-09-12 10:00:00',
      activity: [
        { id: 1, at: '2026-09-12 10:00:00', actor: 'Budi Santoso', action: 'Moved to Development' },
        { id: 2, at: '2026-09-02 09:15:00', actor: 'System', action: 'Task created' },
      ],
    }),
    normalizeTask({
      id: 7,
      title: 'Kanban burn-up widget',
      description: 'Prototype burn-up chart for TRAXIS delivery board.',
      dashboard: 'TRAXIS',
      status: 'backlog',
      approval_state: 'approved',
      pic: 'Gita Lestari',
      created_by: 'Farras Al-Risyad',
      priority: 'low',
      deadline: '2026-09-30',
      created_at: '2026-09-07 12:00:00',
      updated_at: '2026-09-07 12:00:00',
      activity: [{ id: 1, at: '2026-09-07 12:00:00', actor: 'System', action: 'Task created' }],
    }),
    normalizeTask({
      id: 8,
      title: 'Policy exception log',
      description: 'Table of policy exceptions with export action.',
      dashboard: 'GARD',
      status: 'selesai',
      approval_state: 'approved',
      pic: 'Hendra Wijaya',
      created_by: 'Hendra Wijaya',
      priority: 'medium',
      deadline: '2026-08-31',
      created_at: '2026-08-01 10:00:00',
      updated_at: '2026-08-31 17:00:00',
      activity: [
        { id: 1, at: '2026-08-31 17:00:00', actor: 'Hendra Wijaya', action: 'Moved to Selesai' },
        { id: 2, at: '2026-08-01 10:00:00', actor: 'System', action: 'Task created' },
      ],
    }),
    normalizeTask({
      id: 9,
      title: 'Blocker root-cause tags',
      description: 'Tagging taxonomy for delivery blockers on TRAXIS.',
      dashboard: 'TRAXIS',
      status: 'testing',
      approval_state: 'approved',
      pic: 'Gita Lestari',
      created_by: 'Farras Al-Risyad',
      priority: 'high',
      deadline: '2026-09-14',
      created_at: '2026-09-03 08:00:00',
      updated_at: '2026-09-13 09:30:00',
      comments: [
        {
          id: 1,
          at: '2026-09-13 08:00:00',
          actor: 'Gita Lestari',
          body: 'Tambah tag “dependency vendor” di taxonomy.',
        },
      ],
      activity: [
        { id: 1, at: '2026-09-13 09:30:00', actor: 'Gita Lestari', action: 'Moved to Testing' },
        { id: 2, at: '2026-09-03 08:00:00', actor: 'System', action: 'Task created' },
      ],
    }),
    normalizeTask({
      id: 10,
      title: 'Audit trail export',
      description: 'CSV/PDF export for GARD audit trail.',
      dashboard: 'GARD',
      status: 'selesai',
      approval_state: 'approved',
      pic: 'Fajar Nugroho',
      created_by: 'Fajar Nugroho',
      priority: 'low',
      deadline: '2026-09-01',
      created_at: '2026-08-15 14:00:00',
      updated_at: '2026-09-01 16:00:00',
      activity: [
        { id: 1, at: '2026-09-01 16:00:00', actor: 'Fajar Nugroho', action: 'Moved to Selesai' },
        { id: 2, at: '2026-08-15 14:00:00', actor: 'System', action: 'Task created' },
      ],
    }),
    normalizeTask({
      id: 11,
      title: 'Region drill-down panel',
      description: 'Panel drill-down untuk klik region di heatmap GBO.',
      dashboard: 'GBO Dashboard',
      status: 'backlog',
      approval_state: 'pending',
      pic: 'Farras Al-Risyad',
      created_by: 'Farras Al-Risyad',
      priority: 'high',
      deadline: '2026-09-22',
      created_at: '2026-09-14 09:00:00',
      updated_at: '2026-09-14 09:00:00',
      activity: [
        { id: 1, at: '2026-09-14 09:00:00', actor: 'Farras Al-Risyad', action: 'Diajukan untuk approval PIC' },
      ],
    }),
    normalizeTask({
      id: 12,
      title: 'Vendor risk score badge',
      description: 'Badge skor risiko vendor di kartu FinSight.',
      dashboard: 'FinSight',
      status: 'backlog',
      approval_state: 'revision',
      pic: 'Farras Al-Risyad',
      created_by: 'Farras Al-Risyad',
      priority: 'medium',
      deadline: '2026-09-28',
      created_at: '2026-09-13 11:00:00',
      updated_at: '2026-09-14 08:30:00',
      approval_note: 'Kurang definisi skala skor 1–5 dan sumber data.',
      comments: [
        {
          id: 1,
          at: '2026-09-14 08:30:00',
          actor: 'Citra Dewi',
          body: 'Tolong lengkapi skala skor dan sumber data sebelum diajukan ulang.',
        },
      ],
      activity: [
        { id: 1, at: '2026-09-14 08:30:00', actor: 'Citra Dewi', action: 'Minta revisi' },
        { id: 2, at: '2026-09-13 11:00:00', actor: 'Farras Al-Risyad', action: 'Diajukan untuk approval PIC' },
      ],
    }),
  ]
}

/** @returns {AppNotification[]} */
function seedNotifications() {
  return [
    {
      id: 1,
      at: '2026-09-14 09:00:00',
      type: 'approval_request',
      title: 'Request approval baru',
      body: 'Farras Al-Risyad mengajukan “Region drill-down panel” di GBO Dashboard.',
      taskId: 11,
      dashboard: 'GBO Dashboard',
      toUser: 'Alya Putri',
      read: false,
    },
    {
      id: 2,
      at: '2026-09-14 08:30:00',
      type: 'revision',
      title: 'Perlu revisi',
      body: 'Citra Dewi meminta revisi untuk “Vendor risk score badge”.',
      taskId: 12,
      dashboard: 'FinSight',
      toUser: 'Farras Al-Risyad',
      read: false,
    },
    {
      id: 3,
      at: '2026-09-12 10:00:00',
      type: 'comment',
      title: 'Komentar baru',
      body: 'Alya Putri: Pastikan legend warna konsisten…',
      taskId: 1,
      dashboard: 'GBO Dashboard',
      toUser: 'Farras Al-Risyad',
      read: true,
    },
  ]
}

/** @returns {ModuleTask[]} */
function loadTasks() {
  if (typeof localStorage === 'undefined') return seedTasks()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      // migrate from v2 if present
      const legacy = localStorage.getItem('edm-fe-module-tasks-v2')
      if (legacy) {
        const parsed = JSON.parse(legacy)
        if (Array.isArray(parsed) && parsed.length) {
          return parsed.map((t) => normalizeTask(t))
        }
      }
      return seedTasks()
    }
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) return seedTasks()
    return parsed.map((t) => normalizeTask(t))
  } catch {
    return seedTasks()
  }
}

/** @returns {AppNotification[]} */
function loadNotifications() {
  if (typeof localStorage === 'undefined') return seedNotifications()
  try {
    const raw = localStorage.getItem(NOTIF_KEY)
    if (!raw) return seedNotifications()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return seedNotifications()
    return parsed
  } catch {
    return seedNotifications()
  }
}

/** @returns {SessionUser} */
function loadSession() {
  const fallback = sessionPersonas[0]
  if (typeof localStorage === 'undefined') return fallback
  try {
    const id = localStorage.getItem(SESSION_KEY)
    return sessionPersonas.find((p) => p.id === id) || fallback
  } catch {
    return fallback
  }
}

function loadBoardDashboard() {
  if (typeof localStorage === 'undefined') return ''
  try {
    return localStorage.getItem('edm-fe-task-board-dashboard') || ''
  } catch {
    return ''
  }
}

function initialBoardDashboard() {
  const options = defaultDashboards
  const saved = loadBoardDashboard()
  if (saved && options.includes(saved)) return saved
  return options[0] || ''
}

export const taskModuleStore = $state({
  /** @type {ModuleTask[]} */
  items: loadTasks(),
  /** @type {AppNotification[]} */
  notifications: loadNotifications(),
  /** @type {SessionUser} */
  session: loadSession(),
  lastDetailId: /** @type {number | null} */ (null),
  boardDashboard: initialBoardDashboard(),
  /** @type {'kanban' | 'inbox'} */
  boardTab: 'kanban',
})

function persist() {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(taskModuleStore.items))
}

function persistNotifications() {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(NOTIF_KEY, JSON.stringify(taskModuleStore.notifications))
}

function persistBoardDashboard(name) {
  if (taskModuleStore.boardDashboard === name) return
  taskModuleStore.boardDashboard = name
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem('edm-fe-task-board-dashboard', name)
  } catch {
    /* ignore */
  }
}

/** @param {ModuleTask} item @param {string} action @param {string} [actor] */
function pushActivity(item, action, actor = currentUserName()) {
  const nextId = item.activity.reduce((max, a) => Math.max(max, a.id), 0) + 1
  item.activity = [{ id: nextId, at: nowStamp(), actor, action }, ...item.activity]
}

/**
 * @param {{
 *   type: NotifType,
 *   title: string,
 *   body: string,
 *   taskId?: number | null,
 *   dashboard?: string,
 *   toUser: string,
 * }} payload
 */
function pushNotification(payload) {
  const nextId = taskModuleStore.notifications.reduce((max, n) => Math.max(max, n.id), 0) + 1
  /** @type {AppNotification} */
  const row = {
    id: nextId,
    at: nowStamp(),
    type: payload.type,
    title: payload.title,
    body: payload.body,
    taskId: payload.taskId ?? null,
    dashboard: payload.dashboard || '',
    toUser: payload.toUser,
    read: false,
  }
  taskModuleStore.notifications = [row, ...taskModuleStore.notifications]
  persistNotifications()
}

export function currentUserName() {
  void taskModuleStore.session
  return taskModuleStore.session.name
}

export function currentUserRole() {
  void taskModuleStore.session
  return taskModuleStore.session.role
}

/** @param {string} personaId */
export function setSessionPersona(personaId) {
  const found = sessionPersonas.find((p) => p.id === personaId)
  if (!found) return
  taskModuleStore.session = found
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(SESSION_KEY, found.id)
    } catch {
      /* ignore */
    }
  }
}

/** @param {string} dashboard */
export function picOfDashboard(dashboard) {
  return dashboardPicMap[dashboard] || ''
}

/** @param {string} dashboard */
export function isCurrentUserPicOf(dashboard) {
  const session = taskModuleStore.session
  void session
  if (session.role !== 'pic') return false
  return picOfDashboard(dashboard) === session.name
}

export function canCreateTask() {
  const role = currentUserRole()
  return role === 'teknis' || role === 'pic'
}

export function canUpdateBoard() {
  const role = currentUserRole()
  return role === 'teknis' || role === 'pic'
}

/** @param {number} id */
export function getModuleTask(id) {
  return taskModuleStore.items.find((t) => t.id === Number(id)) || null
}

/**
 * @param {{
 *   dashboard?: string,
 *   status?: string,
 *   pic?: string,
 *   priority?: string,
 *   overdue?: string,
 *   aktif?: string,
 *   q?: string,
 *   approval?: string,
 * }} [filters]
 */
export function listModuleTasks({
  dashboard = '',
  status = '',
  pic = '',
  priority = '',
  overdue = '',
  aktif = '',
  q = '',
  approval = '',
} = {}) {
  void taskModuleStore.items
  let items = [...taskModuleStore.items]
  const today = dateOnly()

  if (dashboard) items = items.filter((t) => t.dashboard === dashboard)
  if (status) items = items.filter((t) => t.status === status)
  if (approval) items = items.filter((t) => t.approval_state === approval)
  if (aktif === 'yes') items = items.filter((t) => t.approval_state === 'approved' && t.status !== 'selesai')
  if (pic) items = items.filter((t) => t.pic === pic)
  if (priority) items = items.filter((t) => t.priority === priority)
  if (overdue === 'yes') {
    items = items.filter((t) => t.approval_state === 'approved' && t.status !== 'selesai' && t.deadline < today)
  } else if (overdue === 'no') {
    items = items.filter((t) => t.status === 'selesai' || t.deadline >= today)
  }
  if (q) {
    const needle = q.toLowerCase()
    items = items.filter((t) =>
      `${t.title} ${t.description} ${t.dashboard} ${t.pic}`.toLowerCase().includes(needle),
    )
  }

  return items.sort((a, b) => b.updated_at.localeCompare(a.updated_at))
}

/** @param {TaskWorkflow | string} status */
export function workflowProgressSolid(status) {
  switch (status) {
    case 'backlog':
      return 0.22
    case 'development':
      return 0.4
    case 'testing':
      return 0.55
    case 'uat':
      return 0.7
    case 'to_production':
      return 0.85
    case 'selesai':
      return 1
    default:
      return 0.35
  }
}

/** Pipeline columns — hanya task yang sudah approved */
/** @param {TaskWorkflow} status @param {string} [dashboard] */
export function tasksByColumn(status, dashboard = '') {
  void taskModuleStore.items
  return taskModuleStore.items
    .filter(
      (t) =>
        t.approval_state === 'approved' &&
        t.status === status &&
        (!dashboard || t.dashboard === dashboard),
    )
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
}

/** Inbox: pending + revision untuk dashboard (atau semua jika kosong) */
/** @param {string} [dashboard] */
export function listInboxTasks(dashboard = '') {
  void taskModuleStore.items
  void taskModuleStore.session
  return taskModuleStore.items
    .filter((t) => {
      if (t.approval_state !== 'pending' && t.approval_state !== 'revision') return false
      if (dashboard && t.dashboard !== dashboard) return false
      return true
    })
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
}

/** @param {string} [dashboard] */
export function inboxNeedsMyAction(dashboard = '') {
  return listInboxTasks(dashboard).filter((t) => isCurrentUserPicOf(t.dashboard) && t.approval_state === 'pending')
}

/** @param {string} name */
export function setBoardDashboard(name) {
  persistBoardDashboard(name)
}

/** @param {'kanban' | 'inbox'} tab */
export function setBoardTab(tab) {
  taskModuleStore.boardTab = tab
}

export function openBoardInbox() {
  taskModuleStore.boardTab = 'inbox'
}

export function resolveBoardDashboard() {
  void taskModuleStore.boardDashboard
  void taskModuleStore.items
  const options = boardDashboardOptions()
  if (!options.length) return ''
  if (taskModuleStore.boardDashboard && options.includes(taskModuleStore.boardDashboard)) {
    return taskModuleStore.boardDashboard
  }
  return options[0]
}

/**
 * @param {{
 *   title: string,
 *   description?: string,
 *   dashboard: string,
 *   status?: TaskWorkflow,
 *   pic: string,
 *   priority?: TaskPriority,
 *   deadline: string,
 * }} payload
 */
export function createModuleTask(payload) {
  if (!canCreateTask()) return null

  const title = (payload.title || '').trim()
  if (!title) return null

  const dashboard = (payload.dashboard || '').trim() || 'General'
  const actor = currentUserName()
  const asPic = isCurrentUserPicOf(dashboard)
  const approval_state = /** @type {ApprovalState} */ (asPic ? 'approved' : 'pending')

  const nextId = taskModuleStore.items.reduce((max, t) => Math.max(max, t.id), 0) + 1
  const stamp = nowStamp()
  /** @type {ModuleTask} */
  const task = {
    id: nextId,
    title,
    description: (payload.description || '').trim(),
    dashboard,
    status: asPic ? payload.status || 'backlog' : 'backlog',
    approval_state,
    pic: (payload.pic || '').trim() || actor,
    created_by: actor,
    priority: payload.priority || 'medium',
    deadline: payload.deadline || dateOnly(),
    created_at: stamp,
    updated_at: stamp,
    approval_note: '',
    comments: [],
    activity: [
      {
        id: 1,
        at: stamp,
        actor,
        action: asPic ? 'Task dibuat · langsung Backlog' : 'Diajukan untuk approval PIC',
      },
    ],
  }

  taskModuleStore.items = [task, ...taskModuleStore.items]
  persist()

  if (!asPic) {
    const pic = picOfDashboard(dashboard)
    if (pic) {
      pushNotification({
        type: 'approval_request',
        title: 'Request approval baru',
        body: `${actor} mengajukan “${title}” di ${dashboard}.`,
        taskId: task.id,
        dashboard,
        toUser: pic,
      })
    }
  }

  return task
}

/**
 * @param {number} id
 * @param {Partial<Pick<ModuleTask, 'title' | 'description' | 'dashboard' | 'pic' | 'priority' | 'deadline'>>} patch
 */
export function updateModuleTask(id, patch) {
  if (!canUpdateBoard()) return false
  const item = getModuleTask(id)
  if (!item) return false

  const keys = ['title', 'description', 'dashboard', 'pic', 'priority', 'deadline']
  for (const key of keys) {
    if (patch[key] !== undefined) item[key] = patch[key]
  }
  item.updated_at = nowStamp()
  pushActivity(item, 'Updated task details')
  taskModuleStore.items = [...taskModuleStore.items]
  persist()
  return true
}

/** @param {number} id @param {TaskWorkflow} status */
export function moveModuleTask(id, status) {
  if (!canUpdateBoard()) return false
  const item = getModuleTask(id)
  if (!item) return false
  if (item.approval_state !== 'approved') return false
  if (item.status === status) return true

  item.status = status
  item.updated_at = nowStamp()
  pushActivity(item, `Moved to ${workflowLabel(status)}`)
  taskModuleStore.items = [...taskModuleStore.items]
  persist()
  return true
}

/** @param {number} id @param {string} [note] */
export function approveModuleTask(id, note = '') {
  const item = getModuleTask(id)
  if (!item) return false
  if (!isCurrentUserPicOf(item.dashboard)) return false
  if (item.approval_state !== 'pending' && item.approval_state !== 'revision') return false

  item.approval_state = 'approved'
  item.status = 'backlog'
  item.approval_note = note.trim()
  item.updated_at = nowStamp()
  pushActivity(item, 'Disetujui · masuk Backlog')
  taskModuleStore.items = [...taskModuleStore.items]
  persist()

  pushNotification({
    type: 'approved',
    title: 'Task disetujui',
    body: `${currentUserName()} menyetujui “${item.title}”.`,
    taskId: item.id,
    dashboard: item.dashboard,
    toUser: item.created_by,
  })
  return true
}

/** @param {number} id @param {string} note */
export function requestRevisionModuleTask(id, note) {
  const item = getModuleTask(id)
  if (!item) return false
  if (!isCurrentUserPicOf(item.dashboard)) return false

  const body = (note || '').trim() || 'Perlu dilengkapi sebelum masuk board.'
  item.approval_state = 'revision'
  item.approval_note = body
  item.updated_at = nowStamp()
  pushActivity(item, 'Minta revisi')

  const nextCommentId = item.comments.reduce((max, c) => Math.max(max, c.id), 0) + 1
  item.comments = [
    { id: nextCommentId, at: nowStamp(), actor: currentUserName(), body },
    ...item.comments,
  ]

  taskModuleStore.items = [...taskModuleStore.items]
  persist()

  pushNotification({
    type: 'revision',
    title: 'Perlu revisi',
    body: `${currentUserName()} meminta revisi untuk “${item.title}”.`,
    taskId: item.id,
    dashboard: item.dashboard,
    toUser: item.created_by,
  })
  return true
}

/** Teknis ajukan ulang setelah revisi */
/** @param {number} id */
export function resubmitModuleTask(id) {
  const item = getModuleTask(id)
  if (!item) return false
  if (currentUserRole() === 'viewer') return false
  if (item.approval_state !== 'revision') return false
  if (item.created_by !== currentUserName() && !isCurrentUserPicOf(item.dashboard)) return false

  item.approval_state = 'pending'
  item.updated_at = nowStamp()
  pushActivity(item, 'Diajukan ulang untuk approval')
  taskModuleStore.items = [...taskModuleStore.items]
  persist()

  const pic = picOfDashboard(item.dashboard)
  if (pic) {
    pushNotification({
      type: 'approval_request',
      title: 'Request approval (ulang)',
      body: `${currentUserName()} mengajukan ulang “${item.title}”.`,
      taskId: item.id,
      dashboard: item.dashboard,
      toUser: pic,
    })
  }
  return true
}

/** @param {number} id @param {string} body */
export function addTaskComment(id, body) {
  if (!canUpdateBoard()) return false
  const item = getModuleTask(id)
  if (!item) return false
  const text = (body || '').trim()
  if (!text) return false

  const nextId = item.comments.reduce((max, c) => Math.max(max, c.id), 0) + 1
  const actor = currentUserName()
  item.comments = [{ id: nextId, at: nowStamp(), actor, body: text }, ...item.comments]
  item.updated_at = nowStamp()
  pushActivity(item, 'Menambah komentar')
  taskModuleStore.items = [...taskModuleStore.items]
  persist()

  const recipients = [...new Set([item.created_by, item.pic, picOfDashboard(item.dashboard)].filter(Boolean))]
  for (const toUser of recipients) {
    if (toUser === actor) continue
    pushNotification({
      type: 'comment',
      title: 'Komentar baru',
      body: `${actor}: ${text.slice(0, 80)}${text.length > 80 ? '…' : ''}`,
      taskId: item.id,
      dashboard: item.dashboard,
      toUser,
    })
  }
  return true
}

/** @param {ModuleTask} task */
export function latestComment(task) {
  if (!task?.comments?.length) return null
  return task.comments[0]
}

/** @param {number} id */
export function deleteModuleTask(id) {
  if (!canUpdateBoard()) return false
  const before = taskModuleStore.items.length
  taskModuleStore.items = taskModuleStore.items.filter((t) => t.id !== Number(id))
  if (taskModuleStore.items.length === before) return false
  if (taskModuleStore.lastDetailId === Number(id)) taskModuleStore.lastDetailId = null
  persist()
  return true
}

/** @param {number} id */
export function rememberDetailId(id) {
  taskModuleStore.lastDetailId = Number(id)
}

export function myNotifications() {
  void taskModuleStore.notifications
  void taskModuleStore.session
  const name = currentUserName()
  return taskModuleStore.notifications
    .filter((n) => n.toUser === name)
    .sort((a, b) => b.at.localeCompare(a.at))
}

export function unreadNotificationCount() {
  return myNotifications().filter((n) => !n.read).length
}

/** @param {number} id */
export function markNotificationRead(id) {
  const row = taskModuleStore.notifications.find((n) => n.id === Number(id))
  if (!row || row.read) return
  row.read = true
  taskModuleStore.notifications = [...taskModuleStore.notifications]
  persistNotifications()
}

export function markAllNotificationsRead() {
  let changed = false
  const name = currentUserName()
  for (const n of taskModuleStore.notifications) {
    if (n.toUser === name && !n.read) {
      n.read = true
      changed = true
    }
  }
  if (!changed) return
  taskModuleStore.notifications = [...taskModuleStore.notifications]
  persistNotifications()
}

/**
 * Handle notif click: mark read, set dashboard/tab, return path
 * @param {AppNotification} notif
 */
export function openNotification(notif) {
  markNotificationRead(notif.id)
  if (notif.dashboard) setBoardDashboard(notif.dashboard)
  if (notif.type === 'approval_request' || notif.type === 'revision') {
    setBoardTab('inbox')
    return '/tasks/board'
  }
  setBoardTab('kanban')
  return '/tasks/board'
}

export const workflowColumns = [
  { key: /** @type {TaskWorkflow} */ ('backlog'), label: 'Backlog' },
  { key: /** @type {TaskWorkflow} */ ('development'), label: 'Development' },
  { key: /** @type {TaskWorkflow} */ ('testing'), label: 'Testing' },
  { key: /** @type {TaskWorkflow} */ ('uat'), label: 'UAT' },
  { key: /** @type {TaskWorkflow} */ ('to_production'), label: 'to Production' },
  { key: /** @type {TaskWorkflow} */ ('selesai'), label: 'Selesai' },
]

export const workflowStatusColors = {
  backlog: '#94a3b8',
  development: '#065fc6',
  testing: '#7c6bc4',
  uat: '#e0a45a',
  to_production: '#e11d48',
  selesai: '#2f7a52',
}

/** @param {TaskWorkflow | string} status */
export function workflowStatusColor(status) {
  return workflowStatusColors[/** @type {keyof typeof workflowStatusColors} */ (status)] || '#94a3b8'
}

/** @param {TaskWorkflow | string} status */
export function workflowLabel(status) {
  const found = workflowColumns.find((c) => c.key === status)
  return found ? found.label : status
}

/** @param {ApprovalState | string} state */
export function approvalLabel(state) {
  switch (state) {
    case 'pending':
      return 'Menunggu approval'
    case 'revision':
      return 'Perlu revisi'
    case 'approved':
      return 'Approved'
    default:
      return state
  }
}

/** @param {TaskPriority | string} value */
export function priorityLabel(value) {
  switch (value) {
    case 'high':
      return 'High'
    case 'medium':
      return 'Medium'
    case 'low':
      return 'Low'
    default:
      return value
  }
}

export const priorityOptions = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

export function dashboardOptions() {
  void taskModuleStore.items
  return [...new Set(taskModuleStore.items.map((t) => t.dashboard))].sort()
}

export function boardDashboardOptions() {
  void taskModuleStore.items
  return [...new Set([...defaultDashboards, ...taskModuleStore.items.map((t) => t.dashboard)])].sort()
}

export function picOptions() {
  void taskModuleStore.items
  return [...new Set(taskModuleStore.items.map((t) => t.pic))].sort()
}

/** @param {ModuleTask} task */
export function isOverdue(task) {
  return task.approval_state === 'approved' && task.status !== 'selesai' && task.deadline < dateOnly()
}
