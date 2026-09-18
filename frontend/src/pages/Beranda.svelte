<script>
  import { fade, fly } from 'svelte/transition'
  import OpsChart from '../lib/OpsChart.svelte'
  import avatarFarras from '../assets/avatar-farras.jpg'
  import logoFull from '../assets/edm-logo.png'
  import NotificationBell from '../lib/NotificationBell.svelte'
  import { link } from 'svelte-spa-router'
  import {
    addDays,
    toISODate,
    weeksOfMonth,
    daysOfWeek,
    dayBucket,
    monthLabel,
    weekIndexForDate,
    tasksInMonthWeeks,
    periodRange,
    tasksInRange,
    delayLabel,
    relativeWhen,
  } from '../lib/taskStore.svelte.js'
  import {
    taskModuleStore,
    workflowColumns,
    workflowStatusColor,
    workflowLabel,
    workflowProgressSolid,
    isOverdue,
  } from '../lib/taskModuleStore.svelte.js'
  import { pushTaskFilters } from '../lib/taskNav.js'

  /**
   * Sliding thumb for segmented switches.
   * @param {HTMLElement} node
   * @param {unknown} _active
   */
  function switchThumb(node, _active) {
    let thumb = /** @type {HTMLElement | null} */ (node.querySelector(':scope > .switch-thumb'))
    if (!thumb) {
      thumb = document.createElement('span')
      thumb.className = 'switch-thumb'
      thumb.setAttribute('aria-hidden', 'true')
      const shine = node.querySelector('.liquidGlass-shine')
      if (shine?.nextSibling) node.insertBefore(thumb, shine.nextSibling)
      else node.insertBefore(thumb, node.firstChild)
    }

    const sync = () => {
      const on = /** @type {HTMLElement | null} */ (node.querySelector('button.on'))
      if (!on || !thumb) return
      thumb.style.width = `${on.offsetWidth}px`
      thumb.style.transform = `translateX(${on.offsetLeft}px)`
    }

    let ready = false
    const enable = () => {
      sync()
      if (!ready && thumb) {
        ready = true
        requestAnimationFrame(() => thumb?.classList.add('ready'))
      }
    }

    requestAnimationFrame(enable)
    const ro = new ResizeObserver(enable)
    ro.observe(node)

    return {
      update() {
        requestAnimationFrame(sync)
      },
      destroy() {
        ro.disconnect()
      },
    }
  }

  /**
   * Adapt module task → shape dipakai timeline helpers (startDate/meta/updatedAt).
   * @param {{ id: number, title: string, dashboard: string, status: string, created_at: string, deadline: string, pic: string, priority: string, updated_at: string }} t
   */
  function toBoardTask(t) {
    return {
      id: t.id,
      title: t.title,
      meta: t.dashboard,
      status: t.status,
      startDate: String(t.created_at || t.deadline).slice(0, 10),
      deadline: t.deadline,
      pic: t.pic,
      priority: t.priority,
      updatedAt: t.updated_at,
    }
  }

  const hour = new Date().getHours()
  const greet =
    hour < 11 ? 'Good morning' : hour < 15 ? 'Good afternoon' : hour < 18 ? 'Good evening' : 'Good night'

  /** @type {'today' | 'week' | 'month'} */
  let period = $state('month')
  let searchQ = $state('')

  const session = $derived.by(() => {
    void taskModuleStore.session
    return taskModuleStore.session
  })

  const periodOptions = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This week' },
    { id: 'month', label: 'This month' },
  ]

  const now = new Date()
  const todayISO = toISODate(now)

  const range = $derived(periodRange(period, now))

  /** Semua task Kanban (pipeline 6 status) + search */
  const allBoardTasks = $derived.by(() => {
    void taskModuleStore.items
    let list = taskModuleStore.items.map(toBoardTask)
    const q = searchQ.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.meta.toLowerCase().includes(q) ||
          t.pic.toLowerCase().includes(q),
      )
    }
    return list
  })

  const scopedTasks = $derived(tasksInRange(allBoardTasks, range.start, range.end))

  /** Feed & deadline — global, tidak ikut filter periode */
  const globalTasks = $derived(allBoardTasks)

  const horizonISO = toISODate(addDays(now, 7))

  const overdueTasks = $derived(
    globalTasks
      .filter((t) => isOverdue(/** @type {any} */ (t)))
      .sort((a, b) => a.deadline.localeCompare(b.deadline))
      .slice(0, 8)
      .map((t) => ({
        id: t.id,
        title: t.title,
        pic: t.pic,
        deadline: t.deadline,
        status: t.status,
        delay: delayLabel(t.deadline, now),
      })),
  )

  const upcomingDeadlines = $derived(
    globalTasks
      .filter((t) => t.deadline >= todayISO && t.deadline <= horizonISO && t.status !== 'selesai')
      .sort((a, b) => a.deadline.localeCompare(b.deadline))
      .slice(0, 8)
      .map((t) => ({
        id: t.id,
        title: t.title,
        pic: t.pic,
        deadline: t.deadline,
        priority: t.priority === 'high' ? 'High' : t.priority === 'low' ? 'Low' : 'Medium',
      })),
  )

  const newestTasks = $derived(
    [...globalTasks]
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
      .slice(0, 6)
      .map((t) => ({
        id: t.id,
        title: t.title,
        when: relativeWhen(t.updatedAt, now),
        status: t.status,
      })),
  )

  const recentActivities = $derived(
    [...globalTasks]
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
      .slice(0, 6)
      .map((t) => {
        const action =
          t.status === 'selesai'
            ? 'menyelesaikan'
            : t.status === 'backlog'
              ? 'menambahkan task'
              : isOverdue(/** @type {any} */ (t))
                ? 'menandai overdue'
                : `update ${workflowLabel(t.status)}`
        const whenDate = new Date(t.updatedAt)
        const when =
          toISODate(whenDate) === todayISO
            ? whenDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
            : relativeWhen(t.updatedAt, now)
        return { who: t.pic, action, target: t.title, when }
      }),
  )

  /** @type {'overdue' | 'upcoming'} */
  let deadlineTab = $state('upcoming')
  /** @type {'tasks' | 'activity'} */
  let feedTab = $state('tasks')

  const heroStats = $derived.by(() => {
    const deadlineToday = scopedTasks.filter((t) => t.deadline === todayISO && t.status !== 'selesai').length
    const dueOrPast = scopedTasks.filter((t) => t.deadline <= todayISO)
    const onTime =
      dueOrPast.length === 0
        ? 100
        : Math.round((100 * dueOrPast.filter((t) => t.status === 'selesai').length) / dueOrPast.length)
    return { deadlineToday, onTime }
  })

  const metrics = $derived.by(() => {
    const total = scopedTasks.length
    const aktif = scopedTasks.filter((t) => t.status !== 'selesai').length
    const overdue = scopedTasks.filter((t) => isOverdue(/** @type {any} */ (t))).length
    const done = scopedTasks.filter((t) => t.status === 'selesai').length
    const dashboards = new Set(scopedTasks.map((t) => t.meta)).size
    const periodNote =
      period === 'today' ? 'today' : period === 'week' ? 'this week' : 'this month'
    return [
      {
        label: 'Total Dashboard',
        value: String(dashboards),
        note: `${dashboards} sumber · ${periodNote}`,
        icon: 'dash',
        tone: 'mint',
        go: () => pushTaskFilters({}, 'board'),
      },
      {
        label: 'Total Task',
        value: String(total),
        note: `semua status · ${periodNote}`,
        icon: 'task',
        tone: 'peach',
        go: () => pushTaskFilters({}),
      },
      {
        label: 'Task Aktif',
        value: String(aktif),
        note: 'belum selesai · pipeline Kanban',
        icon: 'aktif',
        tone: 'sky',
        go: () => pushTaskFilters({ aktif: 'yes' }),
      },
      {
        label: 'Task Overdue',
        value: String(overdue),
        note: overdue ? `melewati deadline` : 'aman',
        icon: 'alert',
        tone: 'rose',
        go: () => pushTaskFilters({ overdue: 'yes' }),
      },
      {
        label: 'Task Selesai',
        value: String(done),
        note: total ? `${Math.round((100 * done) / total)}% dari total` : 'dari total task',
        icon: 'done',
        tone: 'sand',
        go: () => pushTaskFilters({ status: 'selesai' }),
      },
    ]
  })

  const statusLabels = workflowColumns.map((c) => c.label)
  const statusColors = workflowColumns.map((c) => workflowStatusColor(c.key))
  const prioritasLabels = ['High', 'Medium', 'Low']
  const prioritasColors = ['#d46a6a', '#e0a45a', '#7a9bb8']
  const dashboardColors = ['#053a83', '#065fc6', '#1a7adf', '#339ef5', '#6bb8f7', '#a3d4fa']

  const statusSeries = $derived(
    workflowColumns.map((col) => scopedTasks.filter((t) => t.status === col.key).length),
  )

  const prioritasSeries = $derived([
    scopedTasks.filter((t) => t.priority === 'high').length,
    scopedTasks.filter((t) => t.priority === 'medium').length,
    scopedTasks.filter((t) => t.priority === 'low').length,
  ])

  const dashboardAgg = $derived.by(() => {
    /** @type {Map<string, number>} */
    const map = new Map()
    for (const t of scopedTasks) {
      map.set(t.meta, (map.get(t.meta) || 0) + 1)
    }
    const entries = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
    return {
      labels: entries.map(([k]) => k),
      series: entries.map(([, v]) => v),
      colors: entries.map((_, i) => dashboardColors[i % dashboardColors.length]),
    }
  })

  /** @type {'status' | 'prioritas' | 'dashboard'} */
  let chartTab = $state('status')

  const chartMeta = {
    status: { title: 'Task Per Status', sub: 'Kolom Kanban · semua dashboard' },
    prioritas: { title: 'Task Per Prioritas', sub: 'High · Medium · Low' },
    dashboard: { title: 'Task Per Dashboard', sub: 'Volume per dashboard' },
  }

  const activeChart = $derived(
    chartTab === 'prioritas'
      ? {
          labels: prioritasLabels,
          series: prioritasSeries,
          colors: prioritasColors,
          type: /** @type {'donut'} */ ('donut'),
        }
      : chartTab === 'dashboard'
        ? {
            labels: dashboardAgg.labels.length ? dashboardAgg.labels : ['—'],
            series: dashboardAgg.series.length ? dashboardAgg.series : [0],
            colors: dashboardAgg.colors.length ? dashboardAgg.colors : ['#d0d0d6'],
            type: /** @type {'bar'} */ ('bar'),
          }
        : {
            labels: statusLabels,
            series: statusSeries,
            colors: statusColors,
            type: /** @type {'donut'} */ ('donut'),
          },
  )

  const chartLegend = $derived.by(() => {
    const total = activeChart.series.reduce((a, b) => a + b, 0) || 1
    return activeChart.labels.map((label, i) => {
      const value = activeChart.series[i] ?? 0
      return {
        label,
        value,
        pct: Math.round((value / total) * 100),
        color: activeChart.colors[i] ?? '#9a9aa0',
      }
    })
  })

  /** Axis buckets depend on period — drives Task per week visual */
  const boardBuckets = $derived.by(() => {
    if (period === 'today') return dayBucket(now)
    if (period === 'week') return daysOfWeek(now)
    return weeksOfMonth(now.getFullYear(), now.getMonth())
  })

  const boardTitle = $derived.by(() => {
    if (period === 'today') {
      return now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })
    }
    if (period === 'week') {
      const start = boardBuckets[0]?.start
      const end = boardBuckets[boardBuckets.length - 1]?.end
      if (!start || !end) return 'This week'
      return `${start.getDate()}–${end.getDate()} ${end.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`
    }
    return monthLabel(now.getFullYear(), now.getMonth())
  })

  const boardHeading = $derived(
    period === 'today' ? 'Tasks today' : period === 'week' ? 'Tasks per day' : 'Tasks per week',
  )

  const weekCount = $derived(boardBuckets.length || 1)

  const currentWeekIdx = $derived.by(() => weekIndexForDate(now, boardBuckets))

  const todayPct = $derived.by(() => {
    if (currentWeekIdx < 0 || !boardBuckets.length) return -1
    const rangeStart = boardBuckets[0].start.getTime()
    const rangeEnd = addDays(boardBuckets[boardBuckets.length - 1].end, 1).getTime()
    const t = new Date(`${todayISO}T00:00:00`).getTime()
    if (t < rangeStart || t >= rangeEnd) return -1
    return ((t - rangeStart) / (rangeEnd - rangeStart)) * 100
  })

  const todayChip = $derived(
    now.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }),
  )

  const axisWeeks = $derived(
    boardBuckets.map((w, i) => {
      if (period === 'today') {
        return {
          ...w,
          range: now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
          isCurrent: true,
        }
      }
      if (period === 'week') {
        return {
          ...w,
          range: String(w.start.getDate()),
          isCurrent: i === currentWeekIdx,
        }
      }
      const startMo = w.start.toLocaleDateString('id-ID', { month: 'short' })
      const endMo = w.end.toLocaleDateString('id-ID', { month: 'short' })
      const rangeLabel =
        startMo === endMo
          ? `${w.start.getDate()}–${w.end.getDate()} ${startMo}`
          : `${w.start.getDate()} ${startMo} – ${w.end.getDate()} ${endMo}`
      return { ...w, range: rangeLabel, isCurrent: i === currentWeekIdx }
    }),
  )

  const weekItems = $derived(tasksInMonthWeeks(scopedTasks, boardBuckets))

  /** @type {{ task: { id: number, title: string, meta: string, status: string, startDate: string, deadline: string, pic: string }, x: number, y: number } | null} */
  let taskTip = $state(null)
  /** @type {ReturnType<typeof setTimeout> | null} */
  let tipShowTimer = null
  /** @type {ReturnType<typeof setTimeout> | null} */
  let tipHideTimer = null

  function clearTipTimers() {
    if (tipShowTimer) clearTimeout(tipShowTimer)
    if (tipHideTimer) clearTimeout(tipHideTimer)
    tipShowTimer = null
    tipHideTimer = null
  }

  /** @param {MouseEvent | FocusEvent} e @param {{ id: number, title: string, meta: string, status: string, startDate: string, deadline: string, pic: string }} task */
  function showTaskTip(e, task) {
    clearTipTimers()
    const el = /** @type {HTMLElement} */ (e.currentTarget)
    const r = el.getBoundingClientRect()
    const next = {
      task,
      x: Math.min(Math.max(r.left + r.width / 2, 140), window.innerWidth - 140),
      y: r.top,
    }
    if (taskTip) {
      taskTip = next
      return
    }
    tipShowTimer = setTimeout(() => {
      taskTip = next
      tipShowTimer = null
    }, 70)
  }

  function hideTaskTip() {
    clearTipTimers()
    tipHideTimer = setTimeout(() => {
      taskTip = null
      tipHideTimer = null
    }, 90)
  }

  /** @param {{ left: number, width: number }} bar @param {string} status */
  function weekBarStyle(bar, status = 'backlog') {
    const left = Math.max(0, Math.min(bar.left, 98))
    const width = Math.max(2, Math.min(bar.width, 100 - left))
    const ev = workflowStatusColor(status)
    return `left:${left}%;width:${width}%;--ev:${ev}`
  }

  /** @param {string} status */
  function statusLabel(status) {
    return workflowLabel(status)
  }

  /** @param {string} date */
  function formatDate(date) {
    return new Date(date + 'T00:00:00').toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  /** @param {string} name */
  function initials(name) {
    return name
      .split(' ')
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase()
  }

  /** @param {string} name */
  function faceTone(name) {
    const tones = ['rose', 'sky', 'soft', 'mint', 'sand']
    let h = 0
    for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i)) % tones.length
    return tones[h]
  }
</script>

<section class="beranda">
  <header class="page-header">
    <div class="topbar">
      <a href="/" use:link class="brand-logo" aria-label="EDM Task Monitoring" title="EDM Task Monitoring">
        <img src={logoFull} alt="EDM Task Monitoring" />
      </a>

      <div class="period-pills" role="tablist" aria-label="Time range" use:switchThumb={period}>
        {#each periodOptions as opt}
          <button
            type="button"
            role="tab"
            class:on={period === opt.id}
            aria-selected={period === opt.id}
            onclick={() => (period = /** @type {'today' | 'week' | 'month'} */ (opt.id))}
          >
            {opt.label}
          </button>
        {/each}
      </div>

      <div class="topbar-right">
        <label class="search-pill">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" stroke="currentColor" stroke-width="1.7"/>
            <path d="m16.5 16.5 3.2 3.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
          </svg>
          <input type="search" placeholder="Cari task, dashboard, PIC…" bind:value={searchQ} />
        </label>
        <NotificationBell />
        <button type="button" class="circle-tool" aria-label="Bantuan">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="7.25" stroke="currentColor" stroke-width="1.7"/>
            <path d="M9.8 9.6a2.2 2.2 0 1 1 3.5 1.8c-.7.5-1.3 1-1.3 2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
            <circle cx="12" cy="16.4" r="0.9" fill="currentColor"/>
          </svg>
        </button>
        <button type="button" class="profile-chip" aria-label={`Profil ${session.name}`}>
          <img class="avatar" src={avatarFarras} alt="" />
          <span class="profile-meta">
            <strong>{session.name}</strong>
            <small>{session.label}</small>
          </span>
        </button>
      </div>
    </div>

    <div class="headline">
      <div class="headline-copy">
        <p class="hero-sub">Let's make this day productive.</p>
        <h1 class="hero-greet">{greet}, {session.name.split(' ')[0]}!</h1>
      </div>

      <div class="headline-meta">
        <div class="hero-stats">
          <div class="stat">
            <span>Deadline hari ini</span>
            <div><strong>{heroStats.deadlineToday}</strong></div>
          </div>
          <div class="stat">
            <span>On-time rate</span>
            <div><strong>{heroStats.onTime}%</strong><em class="up">↗</em></div>
          </div>
        </div>
      </div>
    </div>
  </header>

  <div class="metrics-rail liquidGlass-wrapper">
    <div class="liquidGlass-effect"></div>
    <div class="liquidGlass-tint"></div>
    <div class="liquidGlass-shine"></div>

    <div class="metrics">
      {#key period}
        {#each metrics as m, i (m.label)}
          <button
            type="button"
            class="metric-card liquidGlass-wrapper {m.tone} clickable"
            in:fly={{ y: 8, duration: 240, delay: i * 40 }}
            onclick={() => m.go()}
          >
          <div class="liquidGlass-effect"></div>
          <div class="liquidGlass-tint"></div>
          <div class="liquidGlass-shine"></div>

          <div class="metric-top">
            <span class="metric-label">{m.label}</span>
          </div>

          <div class="metric-mid">
            <strong class="metric-value">{m.value}</strong>
            <div class="metric-icon" aria-hidden="true">
              {#if m.icon === 'dash'}
                <svg viewBox="0 0 24 24" fill="none"><path d="M7 8h10M7 12h6M8.5 5.5h7A1.5 1.5 0 0 1 17 7v11.2l-5-2.4-5 2.4V7A1.5 1.5 0 0 1 8.5 5.5Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
              {:else if m.icon === 'task'}
                <svg viewBox="0 0 24 24" fill="none"><rect x="4.5" y="4.5" width="6.2" height="6.2" rx="1.4" stroke="currentColor" stroke-width="1.7"/><rect x="13.3" y="4.5" width="6.2" height="6.2" rx="1.4" stroke="currentColor" stroke-width="1.7"/><rect x="4.5" y="13.3" width="6.2" height="6.2" rx="1.4" stroke="currentColor" stroke-width="1.7"/><rect x="13.3" y="13.3" width="6.2" height="6.2" rx="1.4" stroke="currentColor" stroke-width="1.7"/></svg>
              {:else if m.icon === 'aktif'}
                <svg viewBox="0 0 24 24" fill="none"><path d="M5 12.5 9.2 17 19 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
              {:else if m.icon === 'done'}
                <svg viewBox="0 0 24 24" fill="none"><path d="M12 4.5a7.5 7.5 0 1 1 0 15 7.5 7.5 0 0 1 0-15Z" stroke="currentColor" stroke-width="1.7"/><path d="m8.8 12.2 2.1 2.1 4.3-4.4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
              {:else}
                <svg viewBox="0 0 24 24" fill="none"><path d="M12 8v5M12 16.2h.01M12 4.5a7.5 7.5 0 1 1 0 15 7.5 7.5 0 0 1 0-15Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
              {/if}
            </div>
          </div>

          <small class="metric-note">{m.note}</small>
        </button>
        {/each}
      {/key}
    </div>
  </div>

  <div class="main-grid">
    <div class="panel-glow">
      <article class="panel liquidGlass-wrapper chart-panel">
        <div class="liquidGlass-effect"></div>
        <div class="liquidGlass-tint"></div>
        <div class="liquidGlass-shine"></div>
        <div class="panel-card">
          <div class="panel-head compact">
            <div class="head-copy">
              <h2>{chartMeta[chartTab].title}</h2>
              <p class="sub">{chartMeta[chartTab].sub}</p>
            </div>
            <div class="head-tools">
              <div class="switch liquidGlass-wrapper" role="tablist" aria-label="Filter chart" use:switchThumb={chartTab}>
                <div class="liquidGlass-effect"></div>
                <div class="liquidGlass-tint"></div>
                <div class="liquidGlass-shine"></div>
                <button type="button" role="tab" class:on={chartTab === 'status'} aria-selected={chartTab === 'status'} onclick={() => (chartTab = 'status')}>Status</button>
                <button type="button" role="tab" class:on={chartTab === 'prioritas'} aria-selected={chartTab === 'prioritas'} onclick={() => (chartTab = 'prioritas')}>Prioritas</button>
                <button type="button" role="tab" class:on={chartTab === 'dashboard'} aria-selected={chartTab === 'dashboard'} onclick={() => (chartTab = 'dashboard')}>Dashboard</button>
              </div>
            </div>
          </div>
          <div class="chart-box" class:split={activeChart.type === 'donut'}>
            <div class="chart-plot">
              <OpsChart type={activeChart.type} labels={activeChart.labels} series={activeChart.series} colors={activeChart.colors} />
            </div>
            {#if activeChart.type === 'donut'}
              <ul class="chart-legend side-legend">
                {#each chartLegend as item (item.label)}
                  <li>
                    <div class="legend-item">
                      <span class="swatch" style="background:{item.color}"></span>
                      <div class="legend-copy">
                        <strong>{item.label}</strong>
                        {#key `${period}-${item.value}`}
                          <small in:fade={{ duration: 200 }}>{item.value} task</small>
                        {/key}
                      </div>
                    </div>
                  </li>
                {/each}
              </ul>
            {:else}
              <ul class="chart-legend bar-legend">
                {#each chartLegend as item (item.label)}
                  <li>
                    <div class="legend-item">
                      <span class="swatch" style="background:{item.color}"></span>
                      <div class="legend-copy">
                        <strong>{item.label}</strong>
                        <small>{item.value} task</small>
                      </div>
                    </div>
                  </li>
                {/each}
              </ul>
            {/if}
          </div>
        </div>
      </article>
    </div>

    <div class="panel-glow">
      <article class="panel liquidGlass-wrapper activity-panel">
        <div class="liquidGlass-effect"></div>
        <div class="liquidGlass-tint"></div>
        <div class="liquidGlass-shine"></div>
        <div class="panel-card">
          <div class="panel-head compact week-head">
            <div class="head-copy">
              <h2>{boardHeading}</h2>
              <p class="sub">{boardTitle} · {weekItems.length} task</p>
            </div>
          </div>

        {#key period}
        <div class="day-canvas" in:fade={{ duration: 220 }} out:fade={{ duration: 120 }}>
          <div class="day-axis week-axis" style="grid-template-columns: repeat({weekCount}, minmax(0, 1fr))">
            {#each axisWeeks as w}
              <span class:now={w.isCurrent}>
                <strong>{w.label}</strong>
                <small>{w.range}</small>
              </span>
            {/each}
          </div>

          <div class="day-board">
            <div class="day-grid" aria-hidden="true">
              {#each boardBuckets as _, i}
                <span class="grid-band" style="left:{(i / weekCount) * 100}%;width:{(1 / weekCount) * 100}%" class:alt={i % 2 === 1} class:current={i === currentWeekIdx}></span>
                <span class="grid-line" style="left:{(i / weekCount) * 100}%"></span>
              {/each}
              <span class="grid-line" style="left:100%"></span>
            </div>

            {#if todayPct >= 0}
              <div
                class="now-marker"
                class:near-start={todayPct < 14}
                class:near-end={todayPct > 86}
                style="left:{todayPct}%"
              >
                <span class="now-chip">{todayChip}</span>
                <i></i>
                <b></b>
              </div>
            {/if}

            <div class="day-tracks">
              {#if weekItems.length === 0}
                <div class="week-empty">
                  <p>Belum ada task di {boardTitle}</p>
                </div>
              {:else}
                {#each weekItems as item, i (item.task.id)}
                  <div class="day-row" in:fly={{ y: 6, duration: 220, delay: 40 + i * 28 }}>
                    <div
                      class="event"
                      style={weekBarStyle(item.bar, item.task.status)}
                      role="button"
                      tabindex="0"
                      aria-label={item.task.title}
                      onmouseenter={(e) => showTaskTip(e, item.task)}
                      onmouseleave={hideTaskTip}
                      onfocus={(e) => showTaskTip(e, item.task)}
                      onblur={hideTaskTip}
                      onclick={() => pushTaskFilters({ status: item.task.status })}
                      onkeydown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          pushTaskFilters({ status: item.task.status })
                        }
                      }}
                    >
                      <div class="event-solid" style="flex:{workflowProgressSolid(item.task.status)}">
                        <div class="event-copy">
                          <strong>{item.task.title}</strong>
                          <small>{item.task.meta} · {statusLabel(item.task.status)}</small>
                        </div>
                        <div class="event-people">
                          <span class="face-mini">{initials(item.task.pic)}</span>
                        </div>
                      </div>
                      {#if workflowProgressSolid(item.task.status) < 1}
                        <div class="event-ghost" style="flex:{1 - workflowProgressSolid(item.task.status)}"></div>
                      {/if}
                    </div>
                  </div>
                {/each}
              {/if}
            </div>
          </div>
        </div>
        {/key}
      </div>
    </article>
    </div>

    {#if taskTip}
      <div
        class="task-tip-pos"
        style="left:{taskTip.x}px;top:{taskTip.y}px"
        in:fade={{ duration: 140 }}
        out:fade={{ duration: 110 }}
      >
        <div class="task-tip" role="tooltip">
          <div class="task-tip-head">
            <strong>{taskTip.task.title}</strong>
            <span class="chip status" style="background:color-mix(in srgb, {workflowStatusColor(taskTip.task.status)} 18%, #fff);color:{workflowStatusColor(taskTip.task.status)}">{statusLabel(taskTip.task.status)}</span>
          </div>
          <dl class="task-tip-meta">
            <div><dt>Dashboard</dt><dd>{taskTip.task.meta}</dd></div>
            <div><dt>PIC</dt><dd>{taskTip.task.pic}</dd></div>
            <div><dt>Start</dt><dd>{formatDate(taskTip.task.startDate)}</dd></div>
            <div><dt>Deadline</dt><dd>{formatDate(taskTip.task.deadline)}</dd></div>
          </dl>
        </div>
      </div>
    {/if}

    <div class="panel-glow">
      <article class="panel liquidGlass-wrapper feed-panel">
        <div class="liquidGlass-effect"></div>
        <div class="liquidGlass-tint"></div>
        <div class="liquidGlass-shine"></div>
        <div class="panel-card">
          <div class="panel-head compact">
            <div class="head-copy">
              <h2>Update Terbaru</h2>
              <p class="sub">
                {#if feedTab === 'tasks'}Baru dibuat / di-update{:else}Log operasional{/if}
              </p>
            </div>
            <div class="head-tools">
              <div class="switch liquidGlass-wrapper" role="tablist" aria-label="Filter update" use:switchThumb={feedTab}>
                <div class="liquidGlass-effect"></div>
                <div class="liquidGlass-tint"></div>
                <div class="liquidGlass-shine"></div>
                <button type="button" role="tab" class:on={feedTab === 'tasks'} aria-selected={feedTab === 'tasks'} onclick={() => (feedTab = 'tasks')}>
                  Task
                </button>
                <button type="button" role="tab" class:on={feedTab === 'activity'} aria-selected={feedTab === 'activity'} onclick={() => (feedTab = 'activity')}>
                  Aktivitas
                </button>
              </div>
            </div>
          </div>

          {#key feedTab}
            <div class="table-wrap" in:fade={{ duration: 180 }}>
              {#if feedTab === 'tasks'}
                <table class="modern-table feed-table">
                  <thead>
                    <tr>
                      <th class="col-id">ID</th>
                      <th>Task</th>
                      <th class="col-when">Update</th>
                      <th class="col-status">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each newestTasks.slice(0, 4) as item}
                      <tr>
                        <td class="col-id"><span class="mono-id">#{item.id}</span></td>
                        <td>
                          <button type="button" class="task-link" onclick={() => pushTaskFilters({ status: item.status })}>{item.title}</button>
                        </td>
                        <td class="col-when"><span class="muted">{item.when}</span></td>
                        <td class="col-status"><span class="status-text" style="color:{workflowStatusColor(item.status)}">{statusLabel(item.status)}</span></td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              {:else}
                <table class="modern-table feed-table activity-table">
                  <thead>
                    <tr>
                      <th>PIC</th>
                      <th>Aktivitas</th>
                      <th class="col-when">Waktu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each recentActivities.slice(0, 4) as item}
                      <tr>
                        <td>
                          <span class="pic">
                            <i class="face {faceTone(item.who)}">{initials(item.who)}</i>
                            {item.who}
                          </span>
                        </td>
                        <td>
                          <span class="activity-line">{item.action} <em>{item.target}</em></span>
                        </td>
                        <td class="col-when"><span class="muted">{item.when}</span></td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              {/if}
            </div>
          {/key}
        </div>
      </article>
    </div>

    <div class="panel-glow">
      <article class="panel liquidGlass-wrapper deadline-panel">
        <div class="liquidGlass-effect"></div>
        <div class="liquidGlass-tint"></div>
        <div class="liquidGlass-shine"></div>
        <div class="panel-card">
          <div class="panel-head compact">
            <div class="head-copy">
              <h2>Fokus Deadline</h2>
              <p class="sub" class:alert={deadlineTab === 'overdue'}>
                {#if deadlineTab === 'overdue'}{overdueTasks.length} overdue{:else}7 hari ke depan{/if}
              </p>
            </div>
            <div class="head-tools">
              <button
                type="button"
                class="deadline-go"
                onclick={() =>
                  deadlineTab === 'overdue'
                    ? pushTaskFilters({ overdue: 'yes' })
                    : pushTaskFilters({ aktif: 'yes' })
                }
              >
                Lihat list
              </button>
              <div class="switch liquidGlass-wrapper" role="tablist" aria-label="Filter deadline" use:switchThumb={deadlineTab}>
                <div class="liquidGlass-effect"></div>
                <div class="liquidGlass-tint"></div>
                <div class="liquidGlass-shine"></div>
                <button type="button" role="tab" class:on={deadlineTab === 'upcoming'} aria-selected={deadlineTab === 'upcoming'} onclick={() => (deadlineTab = 'upcoming')}>
                  Mendatang
                </button>
                <button type="button" role="tab" class:on={deadlineTab === 'overdue'} aria-selected={deadlineTab === 'overdue'} onclick={() => (deadlineTab = 'overdue')}>
                  Overdue
                </button>
              </div>
            </div>
          </div>

          {#key deadlineTab}
            <div class="table-wrap" in:fade={{ duration: 180 }}>
              {#if deadlineTab === 'overdue'}
                <table class="modern-table deadline-table">
                  <thead>
                    <tr>
                      <th class="col-task">Task</th>
                      <th class="col-pic">PIC</th>
                      <th class="col-date">Deadline</th>
                      <th class="col-late">Terlambat</th>
                      <th class="col-status">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each overdueTasks.slice(0, 4) as row}
                      <tr>
                        <td class="col-task">
                          <button type="button" class="task-link" onclick={() => pushTaskFilters({ overdue: 'yes', status: row.status })}>{row.title}</button>
                        </td>
                        <td class="col-pic">
                          <span class="pic">
                            <i class="face {faceTone(row.pic)}">{initials(row.pic)}</i>
                            <span class="pic-name">{row.pic}</span>
                          </span>
                        </td>
                        <td class="col-date"><span class="muted">{formatDate(row.deadline)}</span></td>
                        <td class="col-late"><span class="late-text">{row.delay}</span></td>
                        <td class="col-status"><span class="status-text" style="color:{workflowStatusColor(row.status)}">{statusLabel(row.status)}</span></td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              {:else}
                <table class="modern-table deadline-table">
                  <thead>
                    <tr>
                      <th class="col-task">Task</th>
                      <th class="col-pic">PIC</th>
                      <th class="col-date">Deadline</th>
                      <th class="col-status">Prioritas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each upcomingDeadlines.slice(0, 4) as row}
                      <tr>
                        <td class="col-task">
                          <button type="button" class="task-link" onclick={() => pushTaskFilters({ aktif: 'yes', priority: row.priority.toLowerCase() })}>{row.title}</button>
                        </td>
                        <td class="col-pic">
                          <span class="pic">
                            <i class="face {faceTone(row.pic)}">{initials(row.pic)}</i>
                            <span class="pic-name">{row.pic}</span>
                          </span>
                        </td>
                        <td class="col-date"><span class="muted">{formatDate(row.deadline)}</span></td>
                        <td class="col-status"><span class="prio-text {row.priority.toLowerCase()}">{row.priority}</span></td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              {/if}
            </div>
          {/key}
        </div>
      </article>
    </div>
  </div>

</section>

<style>
  .beranda {
    position: relative;
    display: grid;
    grid-template-rows: auto auto minmax(0, 1fr);
    gap: 12px 14px;
    flex: 1;
    min-height: 0;
    height: 100%;
    overflow: hidden;
    color: #1a1a1a;
  }

  .icon-btn {
    width: 40px;
    height: 40px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.65);
    background: rgba(255, 255, 255, 0.72);
    color: #1a1a1a;
    display: grid;
    place-items: center;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    transition: background 0.15s ease, box-shadow 0.15s ease;
    flex-shrink: 0;
  }

  .icon-btn:hover {
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
  }

  .icon-btn svg { width: 15px; height: 15px; }

  .icon-btn.soft {
    width: 34px;
    height: 34px;
    background: #f3f3f6;
    border: none;
    flex-shrink: 0;
  }

  .icon-btn.soft svg { width: 15px; height: 15px; }

  .avatar {
    width: 30px;
    height: 30px;
    border: none;
    border-radius: 999px;
    object-fit: cover;
    object-position: center 18%;
    background: #d8c9f0;
    display: block;
    flex-shrink: 0;
  }

  .page-header {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin: 0;
    padding: 4px 0 18px;
  }

  /* Equal side columns → period pills truly centered */
  .topbar {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: center;
    gap: 16px;
    min-height: 44px;
  }

  .brand-logo {
    display: block;
    justify-self: start;
    flex-shrink: 0;
    line-height: 0;
  }

  .brand-logo img {
    display: block;
    height: 40px;
    width: auto;
    max-width: 168px;
    object-fit: contain;
    image-rendering: -webkit-optimize-contrast;
  }

  .period-pills {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-self: center;
    gap: 0;
    flex-wrap: nowrap;
    padding: 3px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.72);
    border: 1px solid rgba(0, 0, 0, 0.06);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
  }

  .period-pills :global(.switch-thumb) {
    position: absolute;
    top: 3px;
    left: 0;
    height: calc(100% - 6px);
    width: 0;
    border-radius: 999px;
    background: #1a1a1a;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.16);
    z-index: 0;
    pointer-events: none;
    will-change: transform, width;
  }

  .period-pills :global(.switch-thumb.ready) {
    transition:
      transform 0.32s cubic-bezier(0.32, 0.72, 0, 1),
      width 0.32s cubic-bezier(0.32, 0.72, 0, 1);
  }

  .period-pills button {
    position: relative;
    z-index: 1;
    height: 34px;
    padding: 0 18px;
    border-radius: 999px;
    border: none;
    background: transparent;
    color: #1a1a1a;
    font: inherit;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: color 0.2s ease;
  }

  .period-pills button:hover {
    color: #000;
  }

  .period-pills button.on {
    color: #fff;
    background: transparent;
    border-color: transparent;
    box-shadow: none;
  }

  .topbar-right {
    display: flex;
    align-items: center;
    justify-self: end;
    gap: 10px;
    flex-shrink: 0;
    min-width: 0;
  }

  .search-pill {
    display: flex;
    align-items: center;
    gap: 10px;
    width: min(260px, 28vw);
    height: 40px;
    padding: 0 14px;
    border-radius: 999px;
    border: 1px solid rgba(0, 0, 0, 0.06);
    background: rgba(255, 255, 255, 0.82);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
    color: #8e8e93;
  }

  .search-pill svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  .search-pill input {
    flex: 1;
    min-width: 0;
    border: none;
    outline: none;
    background: transparent;
    font: inherit;
    font-size: 0.84rem;
    color: #1a1a1a;
  }

  .search-pill input::placeholder {
    color: #aeaeb2;
  }

  .circle-tool {
    position: relative;
    width: 40px;
    height: 40px;
    border-radius: 999px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    background: rgba(255, 255, 255, 0.72);
    color: #1a1a1a;
    display: grid;
    place-items: center;
    cursor: pointer;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
    transition: background 0.15s ease;
    flex-shrink: 0;
  }

  .circle-tool:hover {
    background: rgba(255, 255, 255, 0.95);
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }

  .circle-tool svg {
    width: 16px;
    height: 16px;
  }

  .circle-tool .dot {
    position: absolute;
    top: 9px;
    right: 10px;
    width: 7px;
    height: 7px;
    border-radius: 999px;
    background: #e5484d;
    border: 1.5px solid #fff;
  }

  .headline {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    column-gap: 40px;
    row-gap: 14px;
    min-height: 56px;
  }

  .headline-copy {
    min-width: 0;
  }

  .hero-sub {
    margin: 0 0 5px;
    color: #8e8e93;
    font-size: 0.84rem;
    line-height: 1.3;
    letter-spacing: -0.01em;
  }

  .hero-greet {
    margin: 0;
    font-size: clamp(1.55rem, 2.35vw, 2.05rem);
    letter-spacing: -0.035em;
    font-weight: 700;
    line-height: 1.12;
    color: #1a1a1a;
  }

  .headline-meta {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 28px;
    flex-shrink: 0;
  }

  .profile-chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 40px;
    padding: 4px 12px 4px 4px;
    border: 1px solid rgba(255, 255, 255, 0.65);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.72);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    cursor: pointer;
    color: inherit;
    font: inherit;
    transition: background 0.15s ease, box-shadow 0.15s ease;
    flex-shrink: 0;
  }

  .profile-chip:hover {
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
  }

  .profile-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0;
    line-height: 1.15;
    padding-right: 2px;
  }

  .profile-meta strong {
    font-size: 0.72rem;
    font-weight: 700;
    color: #1a1a1a;
    white-space: nowrap;
  }

  .profile-meta small {
    font-size: 0.58rem;
    font-weight: 550;
    color: #8e8e93;
  }

  .hero-stats {
    display: flex;
    align-items: center;
    gap: 28px;
  }

  .stat {
    min-width: 7.5rem;
  }

  .stat span {
    display: block;
    font-size: 0.7rem;
    color: #8e8e93;
    margin-bottom: 4px;
    line-height: 1.2;
    white-space: nowrap;
  }

  .stat div {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 1.35rem;
  }

  .stat strong {
    font-size: 1.35rem;
    letter-spacing: -0.03em;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  .stat em {
    font-style: normal;
  }

  .stat em.up {
    color: #5bb98a;
  }

  .stat em.down {
    color: #d46a6a;
  }

  .cta {
    height: 40px;
    padding: 0 18px;
    border: none;
    border-radius: 999px;
    background: #1a1a1a;
    color: #fff;
    font-weight: 600;
    font-size: 0.84rem;
    cursor: pointer;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.14);
    white-space: nowrap;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }

  .cta:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.18);
  }

  /* Metrics rail — gradient biru dongker → biru muda logo EDM */
  .metrics-rail {
    position: relative;
    display: flex;
    flex-direction: column;
    margin-top: 4px;
    padding: 14px;
    border-radius: 28px;
    overflow: hidden;
    isolation: isolate;
    background:
      radial-gradient(90% 120% at 100% 0%, rgba(51, 158, 245, 0.45), transparent 55%),
      radial-gradient(80% 100% at 0% 100%, rgba(5, 58, 131, 0.55), transparent 50%),
      linear-gradient(125deg, #042a5c 0%, #053a83 28%, #065fc6 68%, #339ef5 100%);
    border: 1px solid rgba(255, 255, 255, 0.16);
    box-shadow:
      0 10px 28px rgba(5, 58, 131, 0.28),
      inset 1px 1px 0 rgba(255, 255, 255, 0.2);
  }

  .metrics-rail > :global(.liquidGlass-effect),
  .metrics-rail > :global(.liquidGlass-tint) {
    display: none;
  }

  .metrics-rail > :global(.liquidGlass-shine) {
    border-radius: 28px;
    background: transparent;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    box-shadow:
      inset 1.5px 1.5px 0 rgba(255, 255, 255, 0.22),
      inset -1px -1px 0 rgba(0, 20, 50, 0.12);
  }

  .metrics {
    position: relative;
    z-index: 3;
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 12px;
    margin: 0;
  }

  .metric-card {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 10px;
    border-radius: 18px;
    padding: 14px 14px 12px;
    min-width: 0;
    min-height: 108px;
    overflow: hidden;
    isolation: isolate;
    color: #0f1b2e;
    background: linear-gradient(160deg, #f7fbff 0%, #eef5fc 100%);
    border: 1.5px solid rgba(120, 170, 220, 0.35);
    box-shadow:
      0 6px 16px rgba(4, 40, 90, 0.12),
      inset 1px 1px 0 rgba(255, 255, 255, 0.95);
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
    font: inherit;
    text-align: left;
    width: 100%;
    cursor: pointer;
  }

  .metric-card.clickable:hover {
    transform: translateY(-2px);
    box-shadow:
      0 10px 22px rgba(4, 40, 90, 0.18),
      inset 1px 1px 0 rgba(255, 255, 255, 1);
  }

  .metric-card.clickable:focus-visible {
    outline: 2px solid rgba(6, 95, 198, 0.45);
    outline-offset: 2px;
  }

  .metric-card .liquidGlass-effect,
  .metric-card .liquidGlass-tint,
  .metric-card .liquidGlass-shine {
    border-radius: 18px;
  }

  .metric-card :global(.liquidGlass-effect) {
    display: none;
  }

  .metric-card :global(.liquidGlass-shine) {
    background: transparent;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    box-shadow:
      inset 1px 1px 0 rgba(255, 255, 255, 0.8),
      inset -1px -1px 0 rgba(80, 140, 200, 0.04);
  }

  /* Family biru — beda lewat outline soft (+ tint sangat tipis) */
  .metric-card.mint {
    border-color: rgba(70, 170, 190, 0.55);
    box-shadow:
      0 6px 16px rgba(4, 40, 90, 0.12),
      0 0 0 1px rgba(70, 170, 190, 0.12),
      inset 1px 1px 0 rgba(255, 255, 255, 0.95);
  }
  .metric-card.mint :global(.liquidGlass-tint) {
    background: linear-gradient(155deg, rgba(90, 190, 200, 0.1) 0%, transparent 60%);
  }

  .metric-card.lavender {
    border-color: rgba(120, 140, 210, 0.55);
    box-shadow:
      0 6px 16px rgba(4, 40, 90, 0.12),
      0 0 0 1px rgba(120, 140, 210, 0.12),
      inset 1px 1px 0 rgba(255, 255, 255, 0.95);
  }
  .metric-card.lavender :global(.liquidGlass-tint) {
    background: linear-gradient(155deg, rgba(130, 150, 220, 0.1) 0%, transparent 60%);
  }

  .metric-card.peach {
    border-color: rgba(100, 160, 220, 0.55);
    box-shadow:
      0 6px 16px rgba(4, 40, 90, 0.12),
      0 0 0 1px rgba(100, 160, 220, 0.12),
      inset 1px 1px 0 rgba(255, 255, 255, 0.95);
  }
  .metric-card.peach :global(.liquidGlass-tint) {
    background: linear-gradient(155deg, rgba(110, 170, 230, 0.1) 0%, transparent 60%);
  }

  .metric-card.sky {
    border-color: rgba(50, 140, 230, 0.58);
    box-shadow:
      0 6px 16px rgba(4, 40, 90, 0.12),
      0 0 0 1px rgba(50, 140, 230, 0.14),
      inset 1px 1px 0 rgba(255, 255, 255, 0.95);
  }
  .metric-card.sky :global(.liquidGlass-tint) {
    background: linear-gradient(155deg, rgba(60, 150, 240, 0.12) 0%, transparent 60%);
  }

  /* Overdue — aksen merah jelas, tetap glass (bukan fill penuh) */
  .metric-card.rose {
    border-color: rgba(220, 80, 95, 0.55);
    box-shadow:
      0 6px 16px rgba(160, 40, 55, 0.14),
      0 0 0 1px rgba(220, 80, 95, 0.16),
      inset 1px 1px 0 rgba(255, 255, 255, 0.95);
  }
  .metric-card.rose:hover {
    box-shadow:
      0 8px 20px rgba(160, 40, 55, 0.18),
      0 0 0 1px rgba(220, 80, 95, 0.22),
      inset 1px 1px 0 rgba(255, 255, 255, 0.98);
  }
  .metric-card.rose :global(.liquidGlass-tint) {
    background: linear-gradient(155deg, rgba(235, 90, 105, 0.22) 0%, rgba(255, 200, 205, 0.12) 45%, transparent 70%);
  }
  .metric-card.rose :global(.liquidGlass-shine) {
    box-shadow:
      inset 1px 1px 0 rgba(255, 255, 255, 0.55),
      inset -1px -1px 0 rgba(255, 255, 255, 0.28);
  }
  .metric-card.rose .metric-label {
    color: #9a3a48;
  }
  .metric-card.rose .metric-value {
    color: #c4283a;
    text-shadow: none;
  }
  .metric-card.rose .metric-note {
    color: #d44555;
  }

  .metric-card.sand {
    border-color: rgba(80, 150, 210, 0.52);
    box-shadow:
      0 6px 16px rgba(4, 40, 90, 0.12),
      0 0 0 1px rgba(80, 150, 210, 0.12),
      inset 1px 1px 0 rgba(255, 255, 255, 0.95);
  }
  .metric-card.sand :global(.liquidGlass-tint) {
    background: linear-gradient(155deg, rgba(90, 160, 220, 0.1) 0%, transparent 60%);
  }

  .metric-top,
  .metric-mid,
  .metric-note,
  .metric-icon {
    position: relative;
    z-index: 3;
  }

  .metric-top {
    display: flex;
    align-items: flex-start;
  }

  .metric-label {
    font-size: 0.74rem;
    line-height: 1.25;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: rgba(18, 28, 44, 0.78);
  }

  .metric-mid {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 10px;
    margin-top: auto;
  }

  .metric-value {
    font-size: clamp(1.45rem, 1.8vw, 1.7rem);
    font-weight: 750;
    letter-spacing: -0.04em;
    line-height: 0.95;
    color: #0b1524;
  }

  .metric-icon {
    width: 34px;
    height: 34px;
    border-radius: 11px;
    display: grid;
    place-items: center;
    background: rgba(230, 240, 250, 0.9);
    color: #2a5080;
    border: 1px solid rgba(100, 150, 210, 0.2);
    box-shadow: inset 1px 1px 0 rgba(255, 255, 255, 0.9);
    flex-shrink: 0;
  }

  .metric-card.mint .metric-icon {
    background: linear-gradient(160deg, rgba(90, 190, 200, 0.2), #f3fafb);
    color: #2a7a88;
    border-color: rgba(70, 170, 190, 0.28);
  }
  .metric-card.lavender .metric-icon {
    background: linear-gradient(160deg, rgba(120, 140, 210, 0.18), #f5f6fc);
    color: #4a5c9a;
    border-color: rgba(120, 140, 210, 0.28);
  }
  .metric-card.peach .metric-icon {
    background: linear-gradient(160deg, rgba(100, 160, 220, 0.18), #f4f8fd);
    color: #3a6a9a;
    border-color: rgba(100, 160, 220, 0.28);
  }
  .metric-card.sky .metric-icon {
    background: linear-gradient(160deg, rgba(50, 140, 230, 0.2), #f2f7fd);
    color: #2a6cb0;
    border-color: rgba(50, 140, 230, 0.3);
  }
  .metric-card.rose .metric-icon {
    background: linear-gradient(160deg, rgba(235, 90, 105, 0.22), #fff0f2);
    color: #d42a3c;
    border-color: rgba(220, 80, 95, 0.35);
    box-shadow: inset 1px 1px 0 rgba(255, 255, 255, 0.9);
  }
  .metric-card.sand .metric-icon {
    background: linear-gradient(160deg, rgba(80, 150, 210, 0.18), #f3f8fc);
    color: #356892;
    border-color: rgba(80, 150, 210, 0.28);
  }

  .metric-icon svg { width: 15px; height: 15px; }

  .metric-note {
    display: block;
    font-size: 0.68rem;
    line-height: 1.3;
    font-weight: 500;
    color: rgba(30, 42, 60, 0.72);
    letter-spacing: -0.01em;
  }

  /* 2×2: chart + board / update + deadline */
  .main-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.95fr);
    grid-template-rows: minmax(0, 1.15fr) minmax(0, 1fr);
    gap: 16px;
    min-height: 0;
    flex: 1;
  }

  .panel-glow {
    min-width: 0;
    min-height: 0;
    display: flex;
  }

  .panel {
    position: relative;
    flex: 1;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding: 10px;
    border-radius: 32px;
    overflow: hidden;
    isolation: isolate;
    color: #1a1a1a;
    background: transparent;
    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.08);
    transition: box-shadow 0.25s ease, transform 0.25s ease;
  }

  /* Soft glass — no SVG displacement (avoids vertical smear artifacts) */
  .liquidGlass-wrapper {
    position: relative;
    display: flex;
    font-weight: 600;
    overflow: hidden;
    isolation: isolate;
    color: black;
    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.08);
    transition: box-shadow 0.25s ease, transform 0.25s ease;
  }

  :global(.liquidGlass-effect) {
    position: absolute;
    z-index: 0;
    inset: 0;
    border-radius: inherit;
    backdrop-filter: blur(10px) saturate(1.05);
    -webkit-backdrop-filter: blur(10px) saturate(1.05);
    background: rgba(255, 255, 255, 0.18);
    overflow: hidden;
    pointer-events: none;
  }

  :global(.liquidGlass-tint) {
    z-index: 1;
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: rgba(255, 255, 255, 0.28);
    pointer-events: none;
  }

  :global(.liquidGlass-shine) {
    position: absolute;
    inset: 0;
    z-index: 2;
    border-radius: inherit;
    overflow: hidden;
    pointer-events: none;
    box-shadow:
      inset 1px 1px 0 rgba(255, 255, 255, 0.55),
      inset -1px -1px 0 rgba(255, 255, 255, 0.28);
  }

  .chart-panel,
  .activity-panel,
  .feed-panel,
  .deadline-panel {
    background: transparent;
  }

  .feed-panel .panel-card,
  .deadline-panel .panel-card {
    padding: 16px 18px 14px;
  }

  .feed-panel .panel-head.compact,
  .deadline-panel .panel-head.compact {
    align-items: flex-start;
    min-height: 44px;
    margin-bottom: 14px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }

  .feed-panel .head-tools,
  .deadline-panel .head-tools {
    margin-top: 2px;
  }

  .feed-panel .switch,
  .deadline-panel .switch {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .panel-card {
    position: relative;
    z-index: 3;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    background: rgba(255, 255, 255, 0.12);
    border-radius: 24px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.35);
    box-shadow:
      inset 2px 2px 1px 0 rgba(255, 255, 255, 0.45),
      inset -1px -1px 1px 1px rgba(255, 255, 255, 0.3);
    padding: 14px 16px;
  }

  .panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 10px;
    flex-shrink: 0;
  }

  .panel-head.compact {
    padding-bottom: 0;
    border-bottom: 0;
    margin-bottom: 12px;
  }

  .head-tools {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .panel-head h2 {
    margin: 0;
    font-size: 0.92rem;
    font-weight: 650;
    letter-spacing: -0.01em;
    line-height: 1.25;
  }

  .sub {
    margin: 2px 0 0;
    color: #8e8e93;
    font-size: 0.7rem;
    line-height: 1.3;
  }

  .sub.alert {
    color: #c44a4a;
    font-weight: 600;
  }

  .switch {
    position: relative;
    display: inline-flex;
    flex-direction: row;
    align-items: center;
    gap: 2px;
    padding: 3px;
    border-radius: 999px;
    overflow: hidden;
    background: transparent;
    border: none;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }

  .switch .liquidGlass-effect,
  .switch .liquidGlass-tint,
  .switch .liquidGlass-shine {
    border-radius: 999px;
  }

  .switch :global(.switch-thumb) {
    position: absolute;
    top: 3px;
    left: 0;
    height: calc(100% - 6px);
    width: 0;
    border-radius: 999px;
    background: rgba(26, 26, 26, 0.9);
    box-shadow:
      inset 2px 2px 1px 0 rgba(255, 255, 255, 0.28),
      inset -1px -1px 1px 1px rgba(255, 255, 255, 0.12);
    z-index: 2;
    pointer-events: none;
    will-change: transform, width;
  }

  .switch :global(.switch-thumb.ready) {
    transition:
      transform 0.34s cubic-bezier(0.22, 1, 0.36, 1),
      width 0.34s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .switch button {
    position: relative;
    z-index: 3;
    border: none;
    background: transparent;
    color: #5f5f5f;
    font: inherit;
    font-size: 0.7rem;
    font-weight: 600;
    padding: 6px 10px;
    border-radius: 999px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    transition: color 0.25s ease;
  }

  .switch button.on {
    background: transparent;
    color: #fff;
    box-shadow: none;
  }

  .chart-panel .panel-head.compact {
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 8px;
  }

  .chart-panel .head-copy {
    min-width: 0;
  }

  .chart-panel .head-tools {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .chart-box {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .chart-box.split {
    flex-direction: row;
    align-items: stretch;
    gap: 12px;
  }

  .chart-plot {
    flex: 1;
    min-width: 0;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .chart-box.split .chart-plot {
    flex: 1.35 1 0;
  }

  .chart-legend {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    flex-shrink: 0;
  }

  .chart-legend.side-legend {
    flex: 0 0 min(42%, 168px);
    width: min(42%, 168px);
    align-self: stretch;
    grid-template-columns: 1fr;
    grid-auto-rows: minmax(0, 1fr);
    gap: 6px;
    max-height: none;
    overflow: auto;
    min-height: 0;
    padding-right: 2px;
  }

  .chart-legend.side-legend li {
    padding: 7px 9px;
  }

  .chart-legend.bar-legend {
    display: flex;
    flex-wrap: nowrap;
    gap: 8px;
    max-height: none;
    overflow-x: auto;
    overflow-y: hidden;
    padding-bottom: 4px;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
    scrollbar-color: rgba(6, 95, 198, 0.28) transparent;
  }

  .chart-legend.bar-legend::-webkit-scrollbar {
    height: 4px;
  }

  .chart-legend.bar-legend::-webkit-scrollbar-thumb {
    background: rgba(6, 95, 198, 0.28);
    border-radius: 999px;
  }

  .chart-legend.bar-legend li {
    flex: 0 0 auto;
    min-width: 128px;
  }

  .chart-legend.bar-legend .legend-copy strong {
    overflow: visible;
    text-overflow: unset;
  }

  .chart-legend li {
    display: flex;
    align-items: stretch;
    min-width: 0;
    padding: 0;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.45);
    border: 1px solid rgba(255, 255, 255, 0.55);
    overflow: hidden;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-width: 0;
    padding: 8px 10px;
    color: inherit;
  }

  .deadline-go {
    height: 32px;
    padding: 0 0.85rem;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.28);
    background: linear-gradient(135deg, #053a83 0%, #065fc6 48%, #339ef5 100%);
    box-shadow:
      0 4px 12px rgba(6, 95, 198, 0.28),
      inset 0 1px 0 rgba(255, 255, 255, 0.28);
    font: inherit;
    font-size: 0.72rem;
    font-weight: 650;
    color: #fff;
    cursor: pointer;
    white-space: nowrap;
    transition: filter 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
  }

  .deadline-go:hover {
    filter: brightness(1.06);
    box-shadow:
      0 6px 16px rgba(6, 95, 198, 0.36),
      inset 0 1px 0 rgba(255, 255, 255, 0.35);
  }

  .chart-legend .swatch {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    flex-shrink: 0;
  }

  .legend-copy {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .legend-copy strong {
    font-size: 0.72rem;
    font-weight: 650;
    color: #1a1a1a;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .legend-copy small {
    font-size: 0.62rem;
    color: #8e8e93;
    white-space: nowrap;
  }

  .activity-panel .panel-card {
    padding: 10px 12px;
  }

  .activity-panel .panel-head.compact {
    margin-bottom: 6px;
  }

  .week-head {
    flex-wrap: nowrap;
    row-gap: 4px;
    min-width: 0;
    align-items: center;
  }

  .week-tools {
    flex-wrap: nowrap;
    justify-content: flex-end;
    min-width: 0;
    gap: 6px;
  }

  .activity-panel .icon-btn.soft {
    width: 28px;
    height: 28px;
  }

  .day-canvas {
    flex: 1;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
    overflow: hidden;
  }

  .day-axis {
    display: grid;
    grid-template-columns: repeat(8, minmax(0, 1fr));
  }

  .day-axis.week-axis {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 4px;
    margin-bottom: 0;
    min-width: 0;
    flex-shrink: 0;
  }

  .day-axis.week-axis span {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 6px;
    min-width: 0;
    padding: 4px 8px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.35);
    border: 1px solid rgba(0, 0, 0, 0.04);
    color: #3a3a3a;
    font-size: 0.72rem;
    font-weight: 700;
    overflow: hidden;
  }

  .day-axis.week-axis span strong {
    font-size: 0.72rem;
    font-weight: 750;
    letter-spacing: -0.02em;
    color: #1a1a1a;
    flex-shrink: 0;
  }

  .day-axis.week-axis small {
    font-size: 0.58rem;
    font-weight: 600;
    color: #6b6b6b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  .day-axis.week-axis span.now {
    background: rgba(26, 26, 26, 0.92);
    border-color: transparent;
    color: #fff;
  }

  .day-axis.week-axis span.now strong,
  .day-axis.week-axis span.now small {
    color: #fff;
  }

  .day-axis span {
    font-size: 0.7rem;
    color: #9a9aa0;
    font-weight: 500;
  }

  .day-axis span.now {
    color: #1a1a1a;
    font-weight: 700;
  }

  .week-empty {
    display: grid;
    place-items: center;
    gap: 10px;
    height: 100%;
    color: #8e8e93;
    font-size: 0.82rem;
  }

  .week-empty button {
    border: none;
    border-radius: 999px;
    padding: 8px 14px;
    background: #1a1a1a;
    color: #fff;
    font: inherit;
    font-size: 0.78rem;
    font-weight: 650;
    cursor: pointer;
  }

  .day-board {
    position: relative;
    flex: 1;
    min-width: 0;
    min-height: 0;
    border-radius: 18px;
    background: transparent;
    overflow: hidden;
  }

  .day-grid { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }

  .grid-band {
    position: absolute;
    top: 0;
    bottom: 0;
    background: transparent;
  }

  .grid-band.alt {
    background: rgba(0, 0, 0, 0.025);
  }

  .grid-band.current {
    background: rgba(200, 232, 168, 0.18);
  }

  .grid-line {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 1px;
    background: rgba(0, 0, 0, 0.12);
  }

  .now-marker {
    position: absolute;
    top: 2px;
    bottom: 2px;
    width: 0;
    z-index: 4;
    pointer-events: none;
  }

  .now-chip {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    white-space: nowrap;
    padding: 2px 6px;
    border-radius: 999px;
    background: #1a1a1a;
    color: #fff;
    font-size: 0.54rem;
    font-weight: 700;
    letter-spacing: 0.01em;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.16);
  }

  .now-marker.near-start .now-chip {
    left: 0;
    transform: none;
  }

  .now-marker.near-end .now-chip {
    left: auto;
    right: 0;
    transform: none;
  }

  .now-marker i {
    position: absolute;
    top: 16px;
    left: -3px;
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background: #1a1a1a;
    box-shadow: 0 0 0 2px rgba(26, 26, 26, 0.12);
  }

  .now-marker b {
    position: absolute;
    top: 22px;
    bottom: 0;
    left: -0.5px;
    width: 1.5px;
    background: #1a1a1a;
  }

  .day-tracks {
    position: relative;
    z-index: 1;
    height: 100%;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    gap: 3px;
    padding: 14px 0 2px;
    overflow-x: hidden;
    overflow-y: auto;
    scrollbar-width: thin;
  }

  .day-row {
    position: relative;
    height: 30px;
    flex: 0 0 auto;
    min-width: 0;
  }

  .event {
    position: absolute;
    top: 0;
    bottom: 0;
    display: flex;
    border-radius: 999px;
    overflow: hidden;
    min-width: 0;
    max-width: 100%;
    cursor: pointer;
    transition: filter 0.15s ease, transform 0.15s ease;
  }

  .event:hover,
  .event:focus-visible {
    filter: brightness(0.97);
    outline: none;
    box-shadow: 0 0 0 2px rgba(26, 26, 26, 0.18);
  }

  .task-tip-pos {
    position: fixed;
    z-index: 90;
    pointer-events: none;
  }

  .task-tip {
    width: min(260px, calc(100vw - 24px));
    padding: 12px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.94);
    border: 1px solid rgba(255, 255, 255, 0.72);
    box-shadow:
      0 12px 32px rgba(0, 0, 0, 0.12),
      inset 1px 1px 0 rgba(255, 255, 255, 0.75);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    color: #1a1a1a;
    transform: translate(-50%, calc(-100% - 10px));
    transform-origin: bottom center;
    animation: taskTipIn 0.22s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  @keyframes taskTipIn {
    from {
      opacity: 0;
      transform: translate(-50%, calc(-100% - 2px)) scale(0.97);
    }
    to {
      opacity: 1;
      transform: translate(-50%, calc(-100% - 10px)) scale(1);
    }
  }

  .task-tip-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 10px;
  }

  .task-tip-head strong {
    font-size: 0.82rem;
    font-weight: 700;
    line-height: 1.25;
    letter-spacing: -0.02em;
  }

  .task-tip-meta {
    margin: 0;
    display: grid;
    gap: 6px;
  }

  .task-tip-meta div {
    display: grid;
    grid-template-columns: 72px 1fr;
    gap: 8px;
    align-items: baseline;
  }

  .task-tip-meta dt {
    margin: 0;
    font-size: 0.62rem;
    font-weight: 600;
    color: #8e8e93;
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  .task-tip-meta dd {
    margin: 0;
    font-size: 0.74rem;
    font-weight: 600;
    color: #2a2a2a;
  }

  .event-solid {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    min-width: 0;
    padding: 0 8px 0 10px;
    background: color-mix(in srgb, var(--ev, #94a3b8) 46%, #ffffff);
  }

  .event-ghost {
    min-width: 12px;
    background: color-mix(in srgb, var(--ev, #94a3b8) 16%, #ffffff);
  }

  .event-copy { min-width: 0; overflow: hidden; }

  .event-copy strong {
    display: block;
    font-size: 0.7rem;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.15;
  }

  .event-copy small {
    display: none;
  }

  .event-people {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }

  .face-mini {
    width: 18px;
    height: 18px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.75);
    color: #3a3a3a;
    display: grid;
    place-items: center;
    font-size: 0.48rem;
    font-weight: 700;
  }

  .more {
    font-size: 0.62rem;
    font-weight: 700;
    color: rgba(0, 0, 0, 0.55);
  }

  .chip {
    display: inline-flex;
    align-items: center;
    padding: 3px 8px;
    border-radius: 999px;
    font-size: 0.66rem;
    font-weight: 600;
    white-space: nowrap;
  }

  .chip.danger { background: #fde8ea; color: #a33b4a; }
  .chip.status.open { background: #f0f0f3; color: #5a5a5a; }
  .chip.status.in_progress { background: #e8f1ff; color: #3a5f9a; }
  .chip.status.done { background: #e5f6ec; color: #2f7a52; }
  .chip.prio.high { background: #fde8ea; color: #a33b4a; }
  .chip.prio.medium { background: #fff3e4; color: #9a6a2e; }
  .chip.prio.low { background: #e8f0f7; color: #3f6a88; }

  .table-wrap {
    flex: 1;
    min-height: 0;
    overflow: auto;
  }

  .modern-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    font-size: 0.78rem;
  }

  .modern-table thead th {
    text-align: left;
    font-size: 0.6rem;
    font-weight: 650;
    color: #8a8a90;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    padding: 0 10px 10px 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.07);
    white-space: nowrap;
    vertical-align: bottom;
  }

  .modern-table tbody td {
    padding: 10px 10px 10px 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.045);
    color: #3a3a3a;
    vertical-align: middle;
    height: 44px;
  }

  .modern-table tbody tr:last-child td {
    border-bottom: 0;
  }

  .modern-table tbody tr:hover td {
    background: rgba(26, 26, 26, 0.025);
  }

  .feed-table .col-id { width: 44px; }
  .feed-table .col-when { width: 92px; }
  .feed-table .col-status { width: 88px; }

  .deadline-table .col-task { width: 32%; }
  .deadline-table .col-pic { width: 24%; }
  .deadline-table .col-date { width: 16%; }
  .deadline-table .col-late { width: 14%; }
  .deadline-table .col-status { width: 14%; }

  .modern-table .col-status,
  .modern-table .col-late {
    text-align: right;
    padding-right: 2px;
  }

  .modern-table th.col-status,
  .modern-table th.col-late {
    text-align: right;
  }

  .mono-id {
    font-variant-numeric: tabular-nums;
    font-size: 0.7rem;
    font-weight: 650;
    color: #9a9aa0;
  }

  .muted {
    color: #8e8e93;
    font-size: 0.72rem;
    font-weight: 500;
  }

  .task-link {
    border: none;
    background: none;
    padding: 0;
    max-width: 100%;
    color: #1a1a1a;
    font: inherit;
    font-size: 0.78rem;
    font-weight: 500;
    text-align: left;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
    transition: color 0.15s ease;
  }

  .task-link:hover {
    color: #3a5f9a;
  }

  .pic {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    max-width: 100%;
  }

  .pic-name {
    font-size: 0.74rem;
    font-weight: 550;
    color: #3a3a3a;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .face {
    width: 24px;
    height: 24px;
    border-radius: 999px;
    display: inline-grid;
    place-items: center;
    font-size: 0.55rem;
    font-weight: 700;
    font-style: normal;
    flex-shrink: 0;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.55);
  }

  .face.rose { background: #f3d5da; color: #8a2f45; }
  .face.sky { background: #d5e8f8; color: #2f5f8a; }
  .face.soft { background: #ebe7f6; color: #4a3d8f; }
  .face.mint { background: #d8f0e4; color: #2f7a52; }
  .face.sand { background: #f3e6d4; color: #8a5a2f; }

  .status-text {
    font-size: 0.72rem;
    font-weight: 650;
    letter-spacing: -0.01em;
    white-space: nowrap;
  }

  .status-text.open { color: #1a1a1a; }
  .status-text.in_progress { color: #3b6fd4; }
  .status-text.done { color: #2f7a52; }

  .late-text {
    font-size: 0.72rem;
    font-weight: 650;
    color: #c44a4a;
    white-space: nowrap;
  }

  .prio-text {
    font-size: 0.72rem;
    font-weight: 650;
    white-space: nowrap;
  }

  .prio-text.high { color: #c44a4a; }
  .prio-text.medium { color: #b07a2e; }
  .prio-text.low { color: #3f6a88; }

  .activity-line {
    display: block;
    font-size: 0.74rem;
    color: #6b6b6b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .activity-line em {
    font-style: normal;
    color: #1a1a1a;
    font-weight: 600;
  }

  @media (max-width: 1280px) {
    .metrics { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .search-pill { width: min(220px, 28vw); }
  }

  @media (max-width: 1100px) {
    .beranda {
      display: flex;
      flex-direction: column;
      overflow: auto;
      height: auto;
    }

    .main-grid {
      grid-template-columns: 1fr;
      grid-template-rows: none;
    }

    .panel { min-height: 280px; }

    .topbar {
      grid-template-columns: 1fr;
      justify-items: start;
      gap: 14px;
    }

    .brand-logo,
    .period-pills,
    .topbar-right {
      justify-self: start;
    }

    .period-pills {
      justify-self: start;
    }

    .topbar-right {
      width: 100%;
      justify-content: flex-start;
      flex-wrap: wrap;
      gap: 10px;
    }

    .search-pill {
      width: min(100%, 280px);
      flex: 1 1 180px;
    }

    .headline {
      grid-template-columns: 1fr;
      align-items: start;
      row-gap: 16px;
    }

    .headline-meta {
      justify-content: flex-start;
      flex-wrap: wrap;
      gap: 20px;
    }
  }

  @media (max-width: 700px) {
    .metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }

    .profile-meta {
      display: none;
    }

    .profile-chip {
      padding: 4px;
      width: 40px;
      justify-content: center;
    }
  }
</style>
