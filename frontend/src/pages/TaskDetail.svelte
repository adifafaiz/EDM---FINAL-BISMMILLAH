<script>
  import { link, push } from 'svelte-spa-router'
  import GlassPanel from '../lib/GlassPanel.svelte'
  import {
    getModuleTask,
    updateModuleTask,
    moveModuleTask,
    deleteModuleTask,
    rememberDetailId,
    workflowColumns,
    workflowLabel,
    priorityLabel,
    priorityOptions,
    isOverdue,
    defaultDashboards,
    dashboardOptions,
    taskModuleStore,
    addTaskComment,
    canUpdateBoard,
    approvalLabel,
    approveModuleTask,
    requestRevisionModuleTask,
    resubmitModuleTask,
    isCurrentUserPicOf,
    currentUserName,
  } from '../lib/taskModuleStore.svelte.js'
  import { formatDate } from '../lib/format.js'

  let { params = {} } = $props()

  let editTitle = $state('')
  let editDescription = $state('')
  let editDashboard = $state('')
  let editPic = $state('')
  let editPriority = $state(/** @type {'high' | 'medium' | 'low'} */ ('medium'))
  let editDeadline = $state('')
  let nextStatus = $state(/** @type {'backlog' | 'development' | 'testing' | 'uat' | 'to_production' | 'selesai'} */ ('backlog'))
  let commentBody = $state('')
  let msg = $state('')
  let lastLoadedId = $state(/** @type {number | null} */ (null))

  const task = $derived.by(() => {
    void taskModuleStore.items
    return params?.id ? getModuleTask(params.id) : null
  })

  const canEdit = $derived.by(() => {
    void taskModuleStore.session
    return canUpdateBoard()
  })

  const dashboards = $derived([...new Set([...defaultDashboards, ...dashboardOptions()])])

  $effect(() => {
    const id = params?.id ? Number(params.id) : null
    if (!id || lastLoadedId === id) return
    const item = getModuleTask(id)
    if (!item) return

    lastLoadedId = id
    rememberDetailId(id)
    editTitle = item.title
    editDescription = item.description
    editDashboard = item.dashboard
    editPic = item.pic
    editPriority = item.priority
    editDeadline = item.deadline
    nextStatus = item.status
    msg = ''
  })

  function onSave(event) {
    event.preventDefault()
    if (!task || !canEdit) return
    if (!editTitle.trim()) {
      msg = 'Judul wajib diisi'
      return
    }
    updateModuleTask(task.id, {
      title: editTitle.trim(),
      description: editDescription.trim(),
      dashboard: editDashboard,
      pic: editPic.trim(),
      priority: editPriority,
      deadline: editDeadline,
    })
    msg = 'Perubahan disimpan'
  }

  function onMove(event) {
    event.preventDefault()
    if (!task || !canEdit) return
    if (task.approval_state !== 'approved') {
      msg = 'Task belum approved — tidak bisa digeser di pipeline'
      return
    }
    moveModuleTask(task.id, nextStatus)
    msg = `Status diubah ke ${workflowLabel(nextStatus)}`
  }

  function onComment(event) {
    event.preventDefault()
    if (!task || !canEdit) return
    if (!commentBody.trim()) return
    addTaskComment(task.id, commentBody)
    commentBody = ''
    msg = 'Komentar ditambahkan'
  }

  function onDelete() {
    if (!task || !canEdit) return
    if (!confirm(`Hapus task "${task.title}"?`)) return
    deleteModuleTask(task.id)
    push('/tasks/list')
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
</script>

<section class="page">
  {#if !task}
    <GlassPanel>
      <p class="state error">Task tidak ditemukan.</p>
    </GlassPanel>
  {:else}
    <GlassPanel>
      <div class="hero">
        <div class="meta">
          <span class="mono-id">#{task.id}</span>
          <span class={`chip appr-${task.approval_state}`}>{approvalLabel(task.approval_state)}</span>
          {#if task.approval_state === 'approved'}
            <span class={`chip st-${task.status}`}>{workflowLabel(task.status)}</span>
          {/if}
          <span class={`chip p-${task.priority}`}>{priorityLabel(task.priority)}</span>
          {#if isOverdue(task)}
            <span class="over">Overdue</span>
          {/if}
        </div>
        <h2>{task.title}</h2>
        <p class="lead">{task.description || 'Tidak ada deskripsi.'}</p>
        <div class="hero-pic">
          <i class="face">{initials(task.pic)}</i>
          <div>
            <strong>{task.pic}</strong>
            <small>PIC · Deadline {formatDate(task.deadline)}</small>
          </div>
        </div>
      </div>
    </GlassPanel>

    <div class="grid">
      <GlassPanel>
        <h3>Info Task</h3>
        <dl>
          <div><dt>Dashboard</dt><dd>{task.dashboard}</dd></div>
          <div><dt>PIC</dt><dd>{task.pic}</dd></div>
          <div><dt>Created</dt><dd>{task.created_at}</dd></div>
          <div><dt>Updated</dt><dd>{task.updated_at}</dd></div>
        </dl>
      </GlassPanel>

      <GlassPanel>
        <h3>Status Workflow</h3>
        <ol class="workflow">
          {#each workflowColumns as col, i}
            {@const idx = workflowColumns.findIndex((c) => c.key === task.status)}
            <li class:done={i < idx} class:current={i === idx}>
              <span class="dot">{i + 1}</span>
              <span>{col.label}</span>
            </li>
          {/each}
        </ol>
      </GlassPanel>

      <GlassPanel class="wide">
        <h3>Komentar</h3>
        {#if task.comments.length === 0}
          <p class="empty">Belum ada komentar.</p>
        {:else}
          <ol class="timeline comments">
            {#each task.comments as entry (entry.id)}
              <li>
                <div class="when">{entry.at}</div>
                <div class="what">
                  <strong>{entry.actor}</strong>
                  <span>{entry.body}</span>
                </div>
              </li>
            {/each}
          </ol>
        {/if}
        {#if canEdit}
          <form class="comment-form" onsubmit={onComment}>
            <textarea rows="2" bind:value={commentBody} placeholder="Tulis komentar…"></textarea>
            <button type="submit" class="primary">Kirim</button>
          </form>
        {/if}
      </GlassPanel>

      <GlassPanel class="wide">
        <h3>Activity Log</h3>
        {#if task.activity.length === 0}
          <p class="empty">Belum ada aktivitas.</p>
        {:else}
          <ol class="timeline">
            {#each task.activity as entry (entry.id)}
              <li>
                <div class="when">{entry.at}</div>
                <div class="what">
                  <strong>{entry.action}</strong>
                  <span>{entry.actor}</span>
                </div>
              </li>
            {/each}
          </ol>
        {/if}
      </GlassPanel>

      <GlassPanel class="wide">
        <h3>Actions</h3>
        {#if msg}<p class="msg">{msg}</p>{/if}

        {#if task.approval_state !== 'approved'}
          <div class="approval-box">
            <p>
              Status approval: <strong>{approvalLabel(task.approval_state)}</strong>
              {#if task.approval_note}
                — {task.approval_note}
              {/if}
            </p>
            {#if isCurrentUserPicOf(task.dashboard) && task.approval_state === 'pending'}
              <div class="approval-acts">
                <button type="button" class="primary" onclick={() => approveModuleTask(task.id)}>Approve → Backlog</button>
                <button
                  type="button"
                  class="ghost-btn"
                  onclick={() => {
                    const note = prompt('Catatan revisi?') || ''
                    requestRevisionModuleTask(task.id, note)
                    msg = 'Revisi dikirim'
                  }}
                >
                  Minta revisi
                </button>
              </div>
            {:else if task.approval_state === 'revision' && (task.created_by === currentUserName() || isCurrentUserPicOf(task.dashboard)) && canEdit}
              <button type="button" class="primary" onclick={() => resubmitModuleTask(task.id)}>Ajukan ulang</button>
            {/if}
          </div>
        {/if}

        {#if canEdit}
          <form class="stack" onsubmit={onSave}>
            <div class="row">
              <label>
                <span>Judul</span>
                <input bind:value={editTitle} />
              </label>
              <label>
                <span>PIC</span>
                <input bind:value={editPic} />
              </label>
            </div>
            <label>
              <span>Deskripsi</span>
              <textarea rows="3" bind:value={editDescription}></textarea>
            </label>
            <div class="row">
              <label>
                <span>Dashboard</span>
                <select bind:value={editDashboard}>
                  {#each dashboards as name}
                    <option value={name}>{name}</option>
                  {/each}
                </select>
              </label>
              <label>
                <span>Prioritas</span>
                <select bind:value={editPriority}>
                  {#each priorityOptions as opt}
                    <option value={opt.value}>{opt.label}</option>
                  {/each}
                </select>
              </label>
            </div>
            <label>
              <span>Deadline</span>
              <input type="date" bind:value={editDeadline} />
            </label>
            <button type="submit" class="primary">Simpan perubahan</button>
          </form>

          {#if task.approval_state === 'approved'}
            <form class="move" onsubmit={onMove}>
              <label>
                <span>Ubah status workflow</span>
                <select bind:value={nextStatus}>
                  {#each workflowColumns as col}
                    <option value={col.key}>{col.label}</option>
                  {/each}
                </select>
              </label>
              <button type="submit" class="primary">Update status</button>
            </form>
          {/if}

          <div class="danger">
            <p>Hapus task dari modul (data lokal FE).</p>
            <button type="button" class="danger-btn" onclick={onDelete}>Hapus task</button>
            <a class="back" href="/tasks/list" use:link>← Kembali ke List</a>
          </div>
        {:else}
          <p class="empty">Mode view — tidak ada aksi edit.</p>
          <a class="back" href="/tasks/list" use:link>← Kembali ke List</a>
        {/if}
      </GlassPanel>
    </div>
  {/if}
</section>

<style>
  .page {
    overflow: auto;
    padding-bottom: 1rem;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .hero {
    display: grid;
    gap: 0.55rem;
  }

  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
    align-items: center;
  }

  h2 {
    margin: 0;
    font-size: 1.45rem;
    font-weight: 750;
    letter-spacing: -0.02em;
  }

  .lead {
    margin: 0;
    color: #6b6b6b;
    max-width: 70ch;
    line-height: 1.5;
    font-weight: 500;
  }

  .hero-pic {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    margin-top: 0.35rem;
  }

  .hero-pic strong {
    display: block;
    font-size: 0.9rem;
  }

  .hero-pic small {
    color: #7a7a80;
    font-size: 0.75rem;
  }

  .face {
    width: 36px;
    height: 36px;
    border-radius: 999px;
    display: grid;
    place-items: center;
    font-size: 0.72rem;
    font-style: normal;
    font-weight: 750;
    background: rgba(26, 26, 26, 0.08);
  }

  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  :global(.wide) {
    grid-column: 1 / -1;
  }

  h3 {
    margin: 0 0 0.9rem;
    font-size: 0.95rem;
    font-weight: 750;
  }

  dl {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.9rem;
    margin: 0;
  }

  dt {
    color: #8a8a90;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-weight: 700;
    margin-bottom: 0.2rem;
  }

  dd {
    margin: 0;
    font-weight: 700;
  }

  .workflow {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.5rem;
  }

  .workflow li {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    color: #9a9aa0;
    font-size: 0.88rem;
    font-weight: 600;
  }

  .workflow li.done { color: #2f6b4a; }
  .workflow li.current { color: #1a1a1a; font-weight: 750; }

  .dot {
    width: 1.4rem;
    height: 1.4rem;
    border-radius: 999px;
    display: grid;
    place-items: center;
    font-size: 0.68rem;
    font-weight: 750;
    background: rgba(0, 0, 0, 0.06);
  }

  .workflow li.done .dot,
  .workflow li.current .dot {
    background: #1a1a1a;
    color: #fff;
  }

  .timeline {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.75rem;
  }

  .timeline li {
    display: grid;
    grid-template-columns: 180px 1fr;
    gap: 0.85rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  }

  .timeline li:last-child {
    border-bottom: 0;
    padding-bottom: 0;
  }

  .when {
    color: #8a8a90;
    font-size: 0.82rem;
    font-weight: 600;
  }

  .what {
    display: grid;
    gap: 0.15rem;
  }

  .what span {
    color: #7a7a80;
    font-size: 0.82rem;
  }

  .comments .what strong {
    font-size: 0.85rem;
  }

  .comment-form {
    display: grid;
    gap: 8px;
    margin-top: 12px;
  }

  .comment-form textarea {
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 12px;
    padding: 10px 12px;
    font: inherit;
    font-size: 0.88rem;
  }

  .approval-box {
    margin-bottom: 1rem;
    padding: 12px 14px;
    border-radius: 14px;
    background: rgba(50, 140, 230, 0.08);
    border: 1px solid rgba(50, 140, 230, 0.18);
  }

  .approval-box p {
    margin: 0 0 10px;
    font-size: 0.85rem;
  }

  .approval-acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .ghost-btn {
    border: 1px solid rgba(0, 0, 0, 0.1);
    background: #fff;
    border-radius: 999px;
    padding: 10px 16px;
    font: inherit;
    font-size: 0.82rem;
    font-weight: 650;
    cursor: pointer;
  }

  .chip.appr-pending {
    background: rgba(50, 140, 230, 0.16);
    color: #2a6cb0;
  }

  .chip.appr-revision {
    background: rgba(224, 164, 90, 0.22);
    color: #9a6a20;
  }

  .chip.appr-approved {
    background: rgba(47, 122, 82, 0.16);
    color: #2f7a52;
  }

  .stack,
  .move {
    display: grid;
    gap: 0.75rem;
    margin-bottom: 1.1rem;
  }

  .move {
    grid-template-columns: minmax(0, 260px) auto;
    align-items: end;
  }

  .row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  label {
    display: grid;
    gap: 6px;
  }

  label span {
    font-size: 0.7rem;
    font-weight: 650;
    color: #6b6b6b;
  }

  input,
  select,
  textarea {
    border: 1px solid rgba(0, 0, 0, 0.08);
    background: rgba(255, 255, 255, 0.78);
    border-radius: 14px;
    padding: 0.65rem 0.85rem;
    font: inherit;
    font-size: 0.88rem;
  }

  .primary,
  .danger-btn {
    height: 2.4rem;
    width: fit-content;
    padding: 0 1.05rem;
    border-radius: 999px;
    border: none;
    background: #1a1a1a;
    color: #fff;
    font: inherit;
    font-weight: 700;
    cursor: pointer;
  }

  .danger {
    border-top: 1px solid rgba(0, 0, 0, 0.06);
    padding-top: 1rem;
  }

  .danger p {
    margin: 0 0 0.65rem;
    color: #7a7a80;
    font-size: 0.85rem;
  }

  .danger-btn {
    background: #b42318;
    margin-right: 0.75rem;
  }

  .back {
    font-weight: 700;
    color: #1a1a1a;
  }

  .msg {
    margin: 0 0 0.75rem;
    color: #2f6b4a;
    font-size: 0.88rem;
    font-weight: 650;
  }

  .mono-id {
    color: #8a8a90;
    font-weight: 700;
    font-size: 0.82rem;
  }

  .chip {
    display: inline-block;
    padding: 0.22rem 0.55rem;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 700;
    background: rgba(0, 0, 0, 0.06);
  }

  .p-high { background: rgba(235, 170, 180, 0.45); color: #8a3a4a; }
  .p-medium { background: rgba(242, 190, 160, 0.45); color: #8a4b2a; }
  .p-low { background: rgba(196, 181, 230, 0.4); color: #5b4a8a; }
  .st-selesai { background: rgba(170, 220, 190, 0.45); color: #2f6b4a; }

  .over {
    font-size: 0.72rem;
    font-weight: 750;
    color: #b42318;
  }

  .empty,
  .state {
    margin: 0;
    color: #7a7a80;
  }

  .state.error {
    color: #b42318;
    font-weight: 650;
  }

  @media (max-width: 900px) {
    .grid,
    dl,
    .row,
    .move,
    .timeline li {
      grid-template-columns: 1fr;
    }
  }
</style>
