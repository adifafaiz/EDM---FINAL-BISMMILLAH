<script>
  import GlassPanel from '../lib/GlassPanel.svelte'
  import SubmenuHeader from '../lib/SubmenuHeader.svelte'
  import {
    workflowColumns,
    tasksByColumn,
    moveModuleTask,
    priorityLabel,
    priorityOptions,
    isOverdue,
    rememberDetailId,
    createModuleTask,
    setBoardDashboard,
    resolveBoardDashboard,
    boardDashboardOptions,
    workflowStatusColor,
    taskModuleStore,
    setBoardTab,
    listInboxTasks,
    inboxNeedsMyAction,
    canCreateTask,
    canUpdateBoard,
    isCurrentUserPicOf,
    approveModuleTask,
    requestRevisionModuleTask,
    resubmitModuleTask,
    latestComment,
    approvalLabel,
    picOfDashboard,
    currentUserName,
    addTaskComment,
    getModuleTask,
  } from '../lib/taskModuleStore.svelte.js'
  import { formatDate } from '../lib/format.js'

  let dragId = $state(/** @type {number | null} */ (null))
  let overColumn = $state(/** @type {string | null} */ (null))
  let addOpen = $state(false)
  /** Approval review modal */
  let reviewId = $state(/** @type {number | null} */ (null))
  let reviewNote = $state('')
  /** Inline comment composer on card */
  let commentOpenId = $state(/** @type {number | null} */ (null))
  let commentDraft = $state('')

  let title = $state('')
  let description = $state('')
  let pic = $state('')
  let priority = $state(/** @type {'high' | 'medium' | 'low'} */ ('medium'))
  let deadline = $state('')
  let error = $state('')

  const dashboards = $derived(boardDashboardOptions())
  const selectedDashboard = $derived(resolveBoardDashboard())
  const boardTab = $derived.by(() => {
    void taskModuleStore.boardTab
    return taskModuleStore.boardTab
  })
  const session = $derived.by(() => {
    void taskModuleStore.session
    return taskModuleStore.session
  })
  const canAdd = $derived.by(() => {
    void taskModuleStore.session
    return canCreateTask()
  })
  const canDrag = $derived.by(() => {
    void taskModuleStore.session
    return canUpdateBoard()
  })
  const canComment = $derived.by(() => {
    void taskModuleStore.session
    return canUpdateBoard()
  })
  const asPicHere = $derived.by(() => {
    void taskModuleStore.session
    void taskModuleStore.boardDashboard
    return isCurrentUserPicOf(selectedDashboard)
  })
  const inboxItems = $derived.by(() => {
    void taskModuleStore.items
    return listInboxTasks(selectedDashboard)
  })
  const myActionCount = $derived.by(() => {
    void taskModuleStore.items
    void taskModuleStore.session
    return inboxNeedsMyAction(selectedDashboard).length
  })
  const reviewTask = $derived.by(() => {
    void taskModuleStore.items
    return reviewId ? getModuleTask(reviewId) : null
  })

  const columnTone = {
    backlog: 'sand',
    development: 'sky',
    testing: 'lavender',
    uat: 'peach',
    to_production: 'rose',
    selesai: 'mint',
  }

  function today() {
    const d = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  }

  function openAdd() {
    title = ''
    description = ''
    pic = currentUserName()
    priority = 'medium'
    deadline = today()
    error = ''
    addOpen = true
  }

  function closeAdd() {
    addOpen = false
  }

  function onAddSubmit(event) {
    event.preventDefault()
    error = ''
    if (!title.trim()) {
      error = 'Judul task wajib diisi'
      return
    }
    if (!pic.trim()) {
      error = 'PIC wajib diisi'
      return
    }
    if (!deadline) {
      error = 'Deadline wajib diisi'
      return
    }

    const created = createModuleTask({
      title,
      description,
      dashboard: selectedDashboard,
      pic,
      priority,
      status: 'backlog',
      deadline,
    })

    if (!created) {
      error = 'Gagal membuat task (cek peran Anda)'
      return
    }

    rememberDetailId(created.id)
    addOpen = false
    if (created.approval_state !== 'approved') {
      setBoardTab('inbox')
    }
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

  /** @param {DragEvent} e @param {number} id */
  function onDragStart(e, id) {
    if (!canDrag) {
      e.preventDefault()
      return
    }
    if (commentOpenId === id) {
      e.preventDefault()
      return
    }
    dragId = id
    e.dataTransfer?.setData('text/plain', String(id))
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
  }

  function onDragEnd() {
    dragId = null
    overColumn = null
  }

  /** @param {DragEvent} e @param {string} column */
  function onDragOver(e, column) {
    if (!canDrag) return
    e.preventDefault()
    overColumn = column
  }

  /** @param {DragEvent} e @param {string} column */
  function onDrop(e, column) {
    e.preventDefault()
    if (!canDrag) return
    const raw = e.dataTransfer?.getData('text/plain') || String(dragId || '')
    const id = Number(raw)
    if (id) moveModuleTask(id, /** @type {any} */ (column))
    dragId = null
    overColumn = null
  }

  function onKeydown(e) {
    if (e.key === 'Escape') {
      closeAdd()
      closeReview()
      commentOpenId = null
      commentDraft = ''
    }
  }

  /** @param {number} id */
  function openReview(id) {
    reviewId = id
    reviewNote = ''
  }

  function closeReview() {
    reviewId = null
    reviewNote = ''
  }

  function submitApprove() {
    if (!reviewId) return
    approveModuleTask(reviewId)
    closeReview()
  }

  function submitRevise() {
    if (!reviewId) return
    requestRevisionModuleTask(reviewId, reviewNote)
    closeReview()
  }

  /** @param {number} id */
  function toggleComment(id) {
    if (commentOpenId === id) {
      commentOpenId = null
      commentDraft = ''
      return
    }
    commentOpenId = id
    commentDraft = ''
  }

  /** @param {SubmitEvent} e @param {number} id */
  function submitCardComment(e, id) {
    e.preventDefault()
    if (!commentDraft.trim()) return
    addTaskComment(id, commentDraft)
    commentDraft = ''
    commentOpenId = null
  }
</script>

<section class="page">
  <GlassPanel>
    <SubmenuHeader
      eyebrow="Task"
      title="Board"
      sub="Kanban per dashboard · need approval"
      meta={selectedDashboard || '—'}
    >
      {#snippet actions()}
        <label class="ctrl">
          <span>Dashboard</span>
          <select
            class="ctrl-input"
            value={selectedDashboard}
            onchange={(e) => setBoardDashboard(/** @type {HTMLSelectElement} */ (e.currentTarget).value)}
          >
            {#each dashboards as name}
              <option value={name}>{name}</option>
            {/each}
          </select>
        </label>
        {#if canAdd}
          <button type="button" class="btn-primary" onclick={openAdd}>+ Tambah Task</button>
        {/if}
      {/snippet}
    </SubmenuHeader>

    <div class="tabs" role="tablist" aria-label="Board views">
      <button
        type="button"
        role="tab"
        class="tab"
        class:on={boardTab === 'kanban'}
        aria-selected={boardTab === 'kanban'}
        onclick={() => setBoardTab('kanban')}
      >
        Kanban
      </button>
      <button
        type="button"
        role="tab"
        class="tab"
        class:on={boardTab === 'inbox'}
        aria-selected={boardTab === 'inbox'}
        onclick={() => setBoardTab('inbox')}
      >
        Need approval
        {#if inboxItems.length > 0}
          <span class="tab-count">{inboxItems.length}</span>
        {/if}
        {#if myActionCount > 0}
          <span class="tab-alert">{myActionCount}</span>
        {/if}
      </button>
      <p class="tab-hint">
        {#if session.role === 'viewer'}
          Mode view saja
        {:else if asPicHere}
          Anda PIC {selectedDashboard} · add langsung Backlog
        {:else if session.role === 'pic'}
          PIC {picOfDashboard(selectedDashboard) || '—'} · Anda PIC dashboard lain
        {:else}
          Teknis · add masuk antrian approval
        {/if}
      </p>
    </div>
  </GlassPanel>

  {#if boardTab === 'inbox'}
    <div class="inbox-rail">
      {#if inboxItems.length === 0}
        <p class="inbox-empty">Tidak ada request pending / revisi untuk {selectedDashboard}.</p>
      {:else}
        <div class="inbox-list">
          {#each inboxItems as task (task.id)}
            {@const comment = latestComment(task)}
            {@const canAct = isCurrentUserPicOf(task.dashboard) && task.approval_state === 'pending'}
            {@const canResubmit =
              task.approval_state === 'revision' &&
              (task.created_by === session.name || isCurrentUserPicOf(task.dashboard))}
            <article class="inbox-card" class:rev={task.approval_state === 'revision'}>
              <div class="inbox-main">
                <div class="inbox-top">
                  <span class={`appr a-${task.approval_state}`}>{approvalLabel(task.approval_state)}</span>
                  <span class={`prio p-${task.priority}`}>{priorityLabel(task.priority)}</span>
                </div>
                <strong>{task.title}</strong>
                <p class="inbox-desc">{task.description || 'Tanpa deskripsi'}</p>
                <div class="inbox-meta">
                  <span>Oleh {task.created_by}</span>
                  <span>·</span>
                  <span>Deadline {formatDate(task.deadline)}</span>
                  <span>·</span>
                  <span>PIC board: {picOfDashboard(task.dashboard) || '—'}</span>
                </div>
                {#if task.approval_note}
                  <p class="note">Catatan: {task.approval_note}</p>
                {/if}
                {#if comment}
                  <p class="preview">“{comment.body}” — {comment.actor}</p>
                {/if}
              </div>
              <div class="inbox-actions">
                {#if canAct}
                  <button type="button" class="act primary" onclick={() => openReview(task.id)}>Review</button>
                {:else if canResubmit && session.role !== 'viewer'}
                  <button type="button" class="act primary" onclick={() => resubmitModuleTask(task.id)}>
                    Ajukan ulang
                  </button>
                {/if}
              </div>
            </article>
          {/each}
        </div>
      {/if}
    </div>
  {:else}
    <div class="board-rail">
      <div class="board">
        {#each workflowColumns as col}
          {@const cards = tasksByColumn(col.key, selectedDashboard)}
          <div
            class="column tone-{columnTone[col.key] || 'sand'}"
            class:drop={overColumn === col.key}
            style="--status-color: {workflowStatusColor(col.key)}"
            ondragover={(e) => onDragOver(e, col.key)}
            ondragleave={() => {
              if (overColumn === col.key) overColumn = null
            }}
            ondrop={(e) => onDrop(e, col.key)}
            role="list"
            aria-label={col.label}
          >
            <header>
              <div class="head-main">
                <span class="status-mark" aria-hidden="true"></span>
                <div>
                  <h3>{col.label}</h3>
                  <p>Drag antar kolom</p>
                </div>
              </div>
              <span class="count">{cards.length}</span>
            </header>

            <div class="cards">
              {#each cards as task (task.id)}
                {@const comment = latestComment(task)}
                <article
                  class="card"
                  class:dragging={dragId === task.id}
                  class:late={isOverdue(task)}
                  class:commenting={commentOpenId === task.id}
                  draggable={canDrag && commentOpenId !== task.id}
                  ondragstart={(e) => onDragStart(e, task.id)}
                  ondragend={onDragEnd}
                  role="listitem"
                >
                  <div class="card-body">
                    <strong>{task.title}</strong>
                    <div class="foot">
                      <span class={`prio p-${task.priority}`}>{priorityLabel(task.priority)}</span>
                      <span class="due">{formatDate(task.deadline)}</span>
                    </div>
                    <div class="pic-row">
                      <i class="face">{initials(task.pic)}</i>
                      <span>{task.pic}</span>
                    </div>

                    <div class="card-comments">
                      {#if task.comments.length > 0}
                        <ul class="c-list">
                          {#each task.comments.slice(0, 2) as c (c.id)}
                            <li>
                              <span class="c-actor">{c.actor.split(' ')[0]}</span>
                              {c.body}
                            </li>
                          {/each}
                        </ul>
                        {#if task.comments.length > 2}
                          <p class="c-more">+{task.comments.length - 2} komentar lain</p>
                        {/if}
                      {:else if comment}
                        <p class="card-comment">{comment.body}</p>
                      {/if}

                      {#if canComment}
                        {#if commentOpenId === task.id}
                          <form
                            class="c-form"
                            onsubmit={(e) => submitCardComment(e, task.id)}
                            onmousedown={(e) => e.stopPropagation()}
                          >
                            <textarea
                              rows="2"
                              bind:value={commentDraft}
                              placeholder="Tulis komentar…"
                              onkeydown={(e) => e.stopPropagation()}
                            ></textarea>
                            <div class="c-acts">
                              <button type="button" class="c-ghost" onclick={() => toggleComment(task.id)}>Batal</button>
                              <button type="submit" class="c-send">Kirim</button>
                            </div>
                          </form>
                        {:else}
                          <button
                            type="button"
                            class="c-toggle"
                            onclick={(e) => {
                              e.stopPropagation()
                              toggleComment(task.id)
                            }}
                            onmousedown={(e) => e.stopPropagation()}
                          >
                            {task.comments.length > 0 ? `Komentar (${task.comments.length})` : '+ Komentar'}
                          </button>
                        {/if}
                      {:else if task.comments.length > 0}
                        <span class="c-count-only">{task.comments.length} komentar</span>
                      {/if}
                    </div>
                  </div>
                </article>
              {:else}
                <p class="empty">Belum ada task</p>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</section>

{#if addOpen}
  <div class="backdrop" role="presentation" onclick={closeAdd} onkeydown={onKeydown}>
    <div
      class="modal liquidGlass-wrapper"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-task-board-title"
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
      onkeydown={onKeydown}
    >
      <div class="liquidGlass-effect"></div>
      <div class="liquidGlass-tint"></div>
      <div class="liquidGlass-shine"></div>

      <form class="modal-body" onsubmit={onAddSubmit}>
        <div class="modal-head">
          <div>
            <h2 id="add-task-board-title">Tambah Task</h2>
            <p>
              Board <strong>{selectedDashboard}</strong>
              {#if asPicHere}
                · langsung masuk <strong>Backlog</strong>
              {:else}
                · masuk <strong>Need approval</strong> menunggu PIC ({picOfDashboard(selectedDashboard) || '—'})
              {/if}
            </p>
          </div>
          <button type="button" class="close" aria-label="Tutup" onclick={closeAdd}>×</button>
        </div>

        <label>
          <span>Judul</span>
          <input bind:value={title} placeholder="Contoh: Build SLA heatmap" />
        </label>

        <label>
          <span>Deskripsi</span>
          <textarea rows="3" bind:value={description} placeholder="Opsional"></textarea>
        </label>

        <div class="row">
          <label>
            <span>PIC eksekusi</span>
            <input bind:value={pic} placeholder="Nama PIC" />
          </label>
          <label>
            <span>Prioritas</span>
            <select bind:value={priority}>
              {#each priorityOptions as opt}
                <option value={opt.value}>{opt.label}</option>
              {/each}
            </select>
          </label>
        </div>

        <label>
          <span>Deadline</span>
          <input type="date" bind:value={deadline} />
        </label>

        {#if error}<p class="error">{error}</p>{/if}

        <div class="actions">
          <button type="button" class="ghost" onclick={closeAdd}>Batal</button>
          <button type="submit" class="primary">{asPicHere ? 'Simpan ke Backlog' : 'Ajukan approval'}</button>
        </div>
      </form>
    </div>
  </div>
{/if}

{#if reviewTask}
  <div class="backdrop" role="presentation" onclick={closeReview} onkeydown={onKeydown}>
    <div
      class="modal liquidGlass-wrapper"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-title"
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
      onkeydown={onKeydown}
    >
      <div class="liquidGlass-effect"></div>
      <div class="liquidGlass-tint"></div>
      <div class="liquidGlass-shine"></div>
      <div class="modal-body">
        <div class="modal-head">
          <div>
            <h2 id="review-title">Review approval</h2>
            <p>{reviewTask.dashboard} · oleh {reviewTask.created_by}</p>
          </div>
          <button type="button" class="close" aria-label="Tutup" onclick={closeReview}>×</button>
        </div>

        <div class="review-summary">
          <strong>{reviewTask.title}</strong>
          <p>{reviewTask.description || 'Tanpa deskripsi'}</p>
          <div class="inbox-meta">
            <span class={`prio p-${reviewTask.priority}`}>{priorityLabel(reviewTask.priority)}</span>
            <span>Deadline {formatDate(reviewTask.deadline)}</span>
            <span>PIC eksekusi: {reviewTask.pic}</span>
          </div>
        </div>

        <label>
          <span>Catatan (wajib jika minta revisi)</span>
          <textarea
            rows="3"
            bind:value={reviewNote}
            placeholder="Contoh: Lengkapi definisi skor dan sumber data"
          ></textarea>
        </label>

        <div class="actions review-acts">
          <button type="button" class="ghost" onclick={closeReview}>Batal</button>
          <button
            type="button"
            class="ghost warn"
            onclick={() => {
              if (!reviewNote.trim()) {
                reviewNote = 'Perlu dilengkapi sebelum masuk board.'
              }
              submitRevise()
            }}
          >
            Minta revisi
          </button>
          <button type="button" class="primary" onclick={submitApprove}>Approve → Backlog</button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .page {
    min-height: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow: hidden;
  }

  .tabs {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid rgba(0, 0, 0, 0.06);
  }

  .tab {
    border: 1px solid rgba(0, 0, 0, 0.08);
    background: rgba(255, 255, 255, 0.7);
    border-radius: 999px;
    padding: 7px 14px;
    font: inherit;
    font-size: 0.78rem;
    font-weight: 650;
    color: #4a6080;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .tab.on {
    background: #0f1b2e;
    border-color: #0f1b2e;
    color: #fff;
  }

  .tab-count {
    font-size: 0.68rem;
    font-weight: 750;
    padding: 0.1rem 0.4rem;
    border-radius: 999px;
    background: rgba(50, 140, 230, 0.18);
    color: inherit;
  }

  .tab.on .tab-count {
    background: rgba(255, 255, 255, 0.2);
  }

  .tab-alert {
    font-size: 0.65rem;
    font-weight: 750;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 999px;
    background: #e11d48;
    color: #fff;
    display: grid;
    place-items: center;
  }

  .tab-hint {
    margin: 0 0 0 auto;
    font-size: 0.72rem;
    color: #8a9bb0;
    font-weight: 550;
  }

  .inbox-rail {
    flex: 1;
    min-height: 0;
    overflow: auto;
    border-radius: 28px;
    padding: 14px;
    background:
      radial-gradient(90% 120% at 100% 0%, rgba(51, 158, 245, 0.35), transparent 55%),
      linear-gradient(125deg, #042a5c 0%, #053a83 40%, #065fc6 100%);
    border: 1px solid rgba(255, 255, 255, 0.16);
  }

  .inbox-empty {
    margin: 0;
    padding: 2.5rem 1rem;
    text-align: center;
    color: rgba(255, 255, 255, 0.75);
    font-size: 0.88rem;
    font-weight: 550;
  }

  .inbox-list {
    display: grid;
    gap: 10px;
  }

  .inbox-card {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    justify-content: space-between;
    align-items: flex-start;
    padding: 14px 16px;
    border-radius: 18px;
    background: linear-gradient(160deg, #ffffff 0%, #f4f8fc 100%);
    border: 1.5px solid rgba(120, 170, 220, 0.4);
  }

  .inbox-card.rev {
    border-color: rgba(224, 164, 90, 0.55);
  }

  .inbox-main {
    flex: 1;
    min-width: 220px;
    display: grid;
    gap: 6px;
  }

  .inbox-top {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .appr {
    font-size: 0.68rem;
    font-weight: 750;
    border-radius: 999px;
    padding: 0.15rem 0.5rem;
  }

  .a-pending {
    background: rgba(50, 140, 230, 0.18);
    color: #2a6cb0;
  }

  .a-revision {
    background: rgba(224, 164, 90, 0.22);
    color: #9a6a20;
  }

  .inbox-main strong {
    font-size: 0.95rem;
    font-weight: 750;
  }

  .inbox-desc {
    margin: 0;
    font-size: 0.8rem;
    color: #5a7088;
    line-height: 1.4;
  }

  .inbox-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    font-size: 0.72rem;
    color: #7a90a8;
    font-weight: 550;
  }

  .note,
  .preview {
    margin: 0;
    font-size: 0.76rem;
    color: #2a5080;
    line-height: 1.4;
  }

  .preview {
    padding: 8px 10px;
    border-radius: 10px;
    background: rgba(50, 140, 230, 0.08);
  }

  .inbox-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
  }

  .act {
    border: 1px solid rgba(0, 0, 0, 0.1);
    background: #fff;
    border-radius: 999px;
    padding: 8px 12px;
    font: inherit;
    font-size: 0.76rem;
    font-weight: 650;
    color: #2a5080;
    cursor: pointer;
    text-decoration: none;
  }

  .act.primary {
    background: #0f1b2e;
    border-color: #0f1b2e;
    color: #fff;
  }

  .act.link {
    border: none;
    background: transparent;
  }

  .board-rail {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding: 14px;
    border-radius: 28px;
    overflow: hidden;
    background:
      radial-gradient(90% 120% at 100% 0%, rgba(51, 158, 245, 0.45), transparent 55%),
      radial-gradient(80% 100% at 0% 100%, rgba(5, 58, 131, 0.55), transparent 50%),
      linear-gradient(125deg, #042a5c 0%, #053a83 28%, #065fc6 68%, #339ef5 100%);
    border: 1px solid rgba(255, 255, 255, 0.16);
    box-shadow:
      0 10px 28px rgba(5, 58, 131, 0.28),
      inset 1px 1px 0 rgba(255, 255, 255, 0.2);
  }

  .board {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: repeat(6, minmax(210px, 1fr));
    gap: 12px;
    overflow: auto;
    padding: 2px;
  }

  .column {
    min-width: 0;
    min-height: 300px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    border-radius: 20px;
    padding: 14px 12px;
    background: linear-gradient(160deg, #f7fbff 0%, #eef5fc 100%);
    border: 1.5px solid rgba(120, 170, 220, 0.4);
    border-top: 3px solid var(--status-color, rgba(120, 170, 220, 0.55));
    box-shadow:
      0 6px 16px rgba(4, 40, 90, 0.12),
      inset 1px 1px 0 rgba(255, 255, 255, 0.95);
    transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
  }

  .column.drop {
    border-color: rgba(50, 140, 230, 0.75);
    box-shadow:
      0 0 0 2px rgba(51, 158, 245, 0.28),
      0 8px 20px rgba(4, 40, 90, 0.18),
      inset 1px 1px 0 rgba(255, 255, 255, 1);
  }

  .tone-sand {
    border-color: rgba(80, 150, 210, 0.52);
  }
  .tone-sky {
    border-color: rgba(50, 140, 230, 0.58);
  }
  .tone-lavender {
    border-color: rgba(120, 140, 210, 0.55);
  }
  .tone-peach {
    border-color: rgba(100, 160, 220, 0.55);
  }
  .tone-rose {
    border-color: rgba(90, 120, 200, 0.55);
  }
  .tone-mint {
    border-color: rgba(70, 170, 190, 0.55);
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
  }

  .head-main {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    min-width: 0;
  }

  .status-mark {
    width: 8px;
    height: 8px;
    margin-top: 0.35rem;
    border-radius: 999px;
    flex-shrink: 0;
    background: var(--status-color, #94a3b8);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--status-color, #94a3b8) 18%, transparent);
  }

  h3 {
    margin: 0;
    font-size: 0.92rem;
    font-weight: 750;
    color: #0f1b2e;
  }

  header p {
    margin: 2px 0 0;
    font-size: 0.7rem;
    font-weight: 500;
    color: rgba(42, 80, 128, 0.72);
  }

  .count {
    font-size: 0.72rem;
    font-weight: 750;
    border-radius: 999px;
    padding: 0.22rem 0.55rem;
    background: color-mix(in srgb, var(--status-color, #065fc6) 16%, #ffffff);
    color: color-mix(in srgb, var(--status-color, #065fc6) 72%, #0f1b2e);
  }

  .cards {
    display: grid;
    gap: 10px;
    align-content: start;
    flex: 1;
  }

  .card {
    border-radius: 16px;
    background: linear-gradient(160deg, #ffffff 0%, #f4f8fc 100%);
    border: 1.5px solid rgba(120, 170, 220, 0.38);
    box-shadow:
      0 4px 12px rgba(4, 40, 90, 0.1),
      inset 1px 1px 0 rgba(255, 255, 255, 0.95);
    cursor: grab;
    transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease, border-color 0.15s ease;
  }

  .card.commenting {
    cursor: default;
    border-color: rgba(50, 140, 230, 0.55);
  }

  .card:hover {
    transform: translateY(-1px);
    border-color: rgba(50, 140, 230, 0.55);
  }

  .card.dragging {
    opacity: 0.5;
  }

  .card.late {
    border-color: rgba(80, 120, 200, 0.55);
  }

  .card-body {
    display: grid;
    gap: 0.4rem;
    padding: 0.85rem 0.9rem;
    color: inherit;
  }

  .card strong {
    font-size: 0.88rem;
    font-weight: 700;
    line-height: 1.35;
    color: #0f1b2e;
  }

  .card-comments {
    display: grid;
    gap: 6px;
    margin-top: 2px;
    padding-top: 6px;
    border-top: 1px solid rgba(120, 170, 220, 0.25);
  }

  .c-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 4px;
  }

  .c-list li {
    font-size: 0.68rem;
    color: #4a6080;
    line-height: 1.35;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .c-actor {
    font-weight: 750;
    color: #2a6cb0;
    margin-right: 4px;
  }

  .c-more {
    margin: 0;
    font-size: 0.64rem;
    color: #8a9bb0;
    font-weight: 600;
  }

  .c-toggle,
  .c-count-only {
    border: none;
    background: transparent;
    padding: 0;
    font: inherit;
    font-size: 0.68rem;
    font-weight: 700;
    color: #2a6cb0;
    cursor: pointer;
    text-align: left;
  }

  .c-count-only {
    cursor: default;
    color: #7a90a8;
  }

  .c-form {
    display: grid;
    gap: 6px;
  }

  .c-form textarea {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid rgba(50, 140, 230, 0.35);
    border-radius: 10px;
    padding: 8px;
    font: inherit;
    font-size: 0.72rem;
    resize: vertical;
    background: #fff;
  }

  .c-acts {
    display: flex;
    justify-content: flex-end;
    gap: 6px;
  }

  .c-ghost,
  .c-send {
    border: none;
    border-radius: 999px;
    padding: 5px 10px;
    font: inherit;
    font-size: 0.68rem;
    font-weight: 650;
    cursor: pointer;
  }

  .c-ghost {
    background: transparent;
    color: #6b6b6b;
  }

  .c-send {
    background: #0f1b2e;
    color: #fff;
  }

  .review-summary {
    display: grid;
    gap: 6px;
    padding: 12px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.55);
    border: 1px solid rgba(0, 0, 0, 0.06);
  }

  .review-summary strong {
    font-size: 0.95rem;
  }

  .review-summary p {
    margin: 0;
    font-size: 0.8rem;
    color: #5a7088;
    line-height: 1.4;
  }

  .review-acts {
    flex-wrap: wrap;
  }

  .ghost.warn {
    color: #9a6a20;
  }

  .foot {
    display: flex;
    justify-content: space-between;
    gap: 0.4rem;
    align-items: center;
  }

  .prio {
    font-size: 0.68rem;
    font-weight: 750;
    border-radius: 999px;
    padding: 0.15rem 0.5rem;
  }

  .p-high {
    background: rgba(90, 120, 200, 0.2);
    color: #3f5694;
  }
  .p-medium {
    background: rgba(50, 140, 230, 0.18);
    color: #2a6cb0;
  }
  .p-low {
    background: rgba(70, 170, 190, 0.2);
    color: #2a7a88;
  }

  .due {
    font-size: 0.7rem;
    color: rgba(42, 80, 128, 0.72);
    font-weight: 600;
  }

  .pic-row {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.72rem;
    color: #2a5080;
    font-weight: 600;
  }

  .face {
    width: 22px;
    height: 22px;
    border-radius: 999px;
    display: grid;
    place-items: center;
    font-size: 0.58rem;
    font-style: normal;
    font-weight: 750;
    background: rgba(50, 140, 230, 0.16);
    color: #2a6cb0;
  }

  .empty {
    margin: 0;
    padding: 1.4rem 0.5rem;
    text-align: center;
    color: rgba(42, 80, 128, 0.55);
    font-size: 0.78rem;
    font-weight: 550;
    border: 1.5px dashed rgba(100, 160, 220, 0.4);
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.45);
  }

  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 80;
    background: rgba(20, 22, 30, 0.28);
    backdrop-filter: blur(6px);
    display: grid;
    place-items: center;
    padding: 20px;
  }

  .modal {
    position: relative;
    width: min(480px, 100%);
    border-radius: 28px;
    overflow: hidden;
    box-shadow: 0 6px 6px rgba(0, 0, 0, 0.2), 0 0 20px rgba(0, 0, 0, 0.1);
  }

  .liquidGlass-effect {
    position: absolute;
    z-index: 0;
    inset: 0;
    backdrop-filter: blur(3px);
    -webkit-backdrop-filter: blur(3px);
    pointer-events: none;
  }

  .liquidGlass-tint {
    z-index: 1;
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.25);
    pointer-events: none;
  }

  .liquidGlass-shine {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
    box-shadow:
      inset 2px 2px 1px 0 rgba(255, 255, 255, 0.5),
      inset -1px -1px 1px 1px rgba(255, 255, 255, 0.5);
  }

  .modal-body {
    position: relative;
    z-index: 3;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 20px;
    background: rgba(255, 255, 255, 0.55);
  }

  .modal-head {
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }

  .modal-head h2 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 750;
  }

  .modal-head p {
    margin: 4px 0 0;
    font-size: 0.78rem;
    color: #6b6b6b;
  }

  .close {
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.06);
    color: #1a1a1a;
    font-size: 1.2rem;
    line-height: 1;
    cursor: pointer;
  }

  .modal-body label {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }

  .modal-body label span {
    font-size: 0.72rem;
    font-weight: 600;
    color: #6b6b6b;
  }

  .modal-body input,
  .modal-body select,
  .modal-body textarea {
    border: 1px solid rgba(0, 0, 0, 0.08);
    background: rgba(255, 255, 255, 0.8);
    border-radius: 12px;
    padding: 10px 12px;
    font: inherit;
    font-size: 0.88rem;
  }

  .row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .error {
    margin: 0;
    font-size: 0.75rem;
    color: #b42318;
    font-weight: 600;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 4px;
  }

  .ghost,
  .primary {
    border: none;
    border-radius: 999px;
    padding: 10px 16px;
    font: inherit;
    font-size: 0.82rem;
    font-weight: 650;
    cursor: pointer;
  }

  .ghost {
    background: transparent;
    color: #5a5a5a;
  }

  .primary {
    background: #1a1a1a;
    color: #fff;
  }

  @media (max-width: 1200px) {
    .board {
      grid-template-columns: repeat(3, minmax(220px, 1fr));
    }
  }

  @media (max-width: 720px) {
    .board {
      grid-template-columns: minmax(260px, 1fr);
    }

    .row {
      grid-template-columns: 1fr;
    }

    .tab-hint {
      margin-left: 0;
      width: 100%;
    }
  }
</style>
