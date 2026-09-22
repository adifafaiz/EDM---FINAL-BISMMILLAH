<script>
  import { link } from 'svelte-spa-router'
  import GlassPanel from '../lib/GlassPanel.svelte'
  import SubmenuHeader from '../lib/SubmenuHeader.svelte'
  import {
    listDashboards,
    registryStatusLabel,
    criticalityLabel,
    registryStatusOptions,
    criticalityOptions,
    dashboardFilterOptions,
    sortOptions,
    rememberDetailId,
    changeDashboardStatus,
  } from '../lib/registryStore.svelte.js'
  import { formatDate } from '../lib/format.js'

  let status = $state('')
  let dashboard = $state('')
  let criticality = $state('')
  let q = $state('')
  let sort = $state('updated_desc')
  
  let expandedRows = $state(new Set())
  let selectedSopItem = $state(null)
  let selectedDetail = $state(null)

  let applied = $state({
    status: '',
    dashboard: '',
    criticality: '',
    q: '',
    sort: 'updated_desc',
  })

  const items = $derived(listDashboards(applied))

  const allDashboards = $derived(listDashboards())
  const allItemsCount = $derived(allDashboards.length)
  const activeCount = $derived(allDashboards.filter((d) => d.status === 'active').length)
  const idleCount = $derived(allDashboards.filter((d) => d.status === 'idle').length)

  function getInitial(name = '') {
    if (!name) return '?'
    return name.trim().charAt(0).toUpperCase()
  }

  function formatDateDisplay(dateStr) {
    if (!dateStr) return '-'
    const d = new Date(dateStr.replace(' ', 'T'))
    if (isNaN(d.getTime())) return dateStr
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
    return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`
  }

  function onSubmit(event) {
    event.preventDefault()
    applied = { status, dashboard, criticality, q, sort }
  }

  function downloadSopPdf() {
    if (!selectedSopItem) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>SOP - ${selectedSopItem.name}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; line-height: 1.6; }
            h3 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
            h4 { color: #0f172a; margin-top: 20px; }
            .meta { margin-bottom: 20px; }
            .meta p { margin: 5px 0; }
          </style>
        </head>
        <body>
          <h3>SOP - ${selectedSopItem.name}</h3>
          <div class="meta">
            <p><strong>Platform:</strong> ${selectedSopItem.platform}</p>
            <p><strong>Kategori:</strong> ${selectedSopItem.category}</p>
            <p><strong>Owner (PIC):</strong> ${selectedSopItem.owner}</p>
          </div>
          <h4>Prosedur Operasional Standar (SOP)</h4>
          <p>Deskripsi sistem: <em>${selectedSopItem.description}</em></p>
          <ol>
            <li>Akses dashboard melalui platform <strong>${selectedSopItem.platform}</strong> menggunakan kredensial yang berwenang.</li>
            <li>Lakukan verifikasi data harian/berkala sesuai jadwal sistem.</li>
            <li>Jika terdapat masalah atau anomali data, segera eskalasikan kepada <strong>${selectedSopItem.owner}</strong>.</li>
            <li>Pastikan untuk mereview dashboard ini kembali jika ada perubahan dari status <strong>${selectedSopItem.status}</strong>.</li>
            <li>Dokumentasikan setiap perubahan konfigurasi pada log aktivitas.</li>
          </ol>
          <script>
            window.onload = () => { window.print(); window.close(); }
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }
</script>

{#if false}
<!-- KODE LAMA DI-COMMENT AGAR TIDAK DOUBLE -->
<section class="page">
  <GlassPanel>
    <SubmenuHeader
      eyebrow="Dashboard Registry"
      title="Daftar Dashboard"
      sub="SOP All Dashboard — katalog status, kritikalitas, dan kepemilikan"
      meta={`${items.length} item`}
    />

    <form class="filters" onsubmit={onSubmit}>
      <label>
        Status
        <select bind:value={status}>
          <option value="">Semua</option>
          {#each registryStatusOptions as opt}
            <option value={opt.value}>{opt.label}</option>
          {/each}
        </select>
      </label>

      <label>
        Dashboard
        <select bind:value={dashboard}>
          <option value="">Semua</option>
          {#each dashboardFilterOptions as opt}
            <option value={opt.value}>{opt.label}</option>
          {/each}
        </select>
      </label>

      <label>
        Kritikalitas
        <select bind:value={criticality}>
          <option value="">Semua</option>
          {#each criticalityOptions as opt}
            <option value={opt.value}>{opt.label}</option>
          {/each}
        </select>
      </label>

      <label class="grow">
        Cari
        <input type="search" placeholder="Nama, owner, platform…" bind:value={q} />
      </label>

      <label>
        Sort
        <select bind:value={sort}>
          {#each sortOptions as opt}
            <option value={opt.value}>{opt.label}</option>
          {/each}
        </select>
      </label>

      <button type="submit">Terapkan</button>
    </form>

    {#if items.length === 0}
      <p class="state">Tidak ada dashboard yang cocok.</p>
    {:else}
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Dashboard</th>
              <th>Status</th>
              <th>Kritikalitas</th>
              <th>Owner</th>
              <th>Platform</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {#each items as item (item.id)}
              <tr>
                <td class="mono">{item.id}</td>
                <td>
                  <a href={`/registry/${item.id}`} use:link onclick={() => rememberDetailId(item.id)}>
                    <strong>{item.name}</strong>
                    <span class="code">{item.code}</span>
                  </a>
                </td>
                <td>
                  <span class={`badge status-${item.status}`}>{registryStatusLabel(item.status)}</span>
                </td>
                <td>
                  <span class={`badge crit-${item.criticality}`}>{criticalityLabel(item.criticality)}</span>
                </td>
                <td>{item.owner}</td>
                <td>{item.platform}</td>
                <td>{formatDate(item.updated_at)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </GlassPanel>
</section>

<!-- ================================================================= -->
<!-- DESAIN BARU (REDSIGN DAFTAR DASHBOARD) - DIKERJAKAN DI BAWAHNYA -->
<!-- ================================================================= -->
<div class="redesign-separator">
  <span>Desain Baru — Dashboard Registry</span>
</div>
{/if}

<section class="redesign-container">
  {#if !selectedDetail}
  <!-- Header Bar -->
  <div class="redesign-header">
    <div class="header-left">
      <span class="eyebrow-tag">DASHBOARD REGISTRY</span>
      <div class="title-row">
        <h2>Daftar Dashboard</h2>
        <span class="count-pill">{items.length} dari {allItemsCount} dashboard</span>
      </div>
      <p class="subtitle">Katalog lengkap status dashboard, dokumen SOP aplikasi, PIC, dan pembaruan terakhir.</p>
    </div>
  </div>

  <!-- Summary Cards Grid -->
  <div class="stats-grid">
    <!-- Card 1 -->
    <div class="stat-card blue-solid-card">
      <div class="stat-top">
        <span class="stat-title">Total Dashboard</span>
        <div class="icon-wrapper blue-solid-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
        </div>
      </div>
      <div class="stat-bottom">
        <div class="stat-value">{allItemsCount}</div>
        <div class="stat-sub">{allItemsCount} sumber · terdaftar</div>
      </div>
    </div>

    <!-- Card 2 -->
    <div class="stat-card white-card border-bottom-blue">
      <div class="stat-top">
        <span class="stat-title">Status Active</span>
        <div class="icon-wrapper green-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        </div>
      </div>
      <div class="stat-bottom">
        <div class="stat-value">{activeCount}</div>
        <div class="stat-sub">berjalan normal · online</div>
      </div>
    </div>

    <!-- Card 3 Lama (Dokumen SOP) - di-hide -->
    <!--
    <div class="stat-card white-card border-bottom-blue">
      <div class="stat-top">
        <span class="stat-title">Dokumen SOP</span>
        <div class="icon-wrapper purple-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
        </div>
      </div>
      <div class="stat-bottom">
        <div class="stat-value">{allItemsCount}</div>
        <div class="stat-sub link-sub">Buka SOP Master Aplikasi →</div>
      </div>
    </div>
    -->

    <!-- Card 3 Baru (Status Idle) -->
    <div class="stat-card white-card border-bottom-blue">
      <div class="stat-top">
        <span class="stat-title">Status Idle</span>
        <div class="icon-wrapper purple-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
      </div>
      <div class="stat-bottom">
        <div class="stat-value">{idleCount}</div>
        <div class="stat-sub">tidak aktif</div>
      </div>
    </div>
  </div>

  <!-- Filter & Search Bar -->
  <form class="redesign-filters" onsubmit={onSubmit}>
    <div class="filter-field grow-field">
      <div class="input-with-icon">
        <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input id="search-input" type="search" placeholder="Cari nama dashboard, kode SOP, PIC, platform..." bind:value={q} />
      </div>
    </div>

    <div class="filter-field">
      <label for="status-select">Status Dashboard</label>
      <select id="status-select" bind:value={status}>
        <option value="">Semua Status</option>
        {#each registryStatusOptions as opt}
          <option value={opt.value}>{opt.label}</option>
        {/each}
      </select>
    </div>

    <div class="filter-field">
      <label for="crit-select">Kritikalitas</label>
      <select id="crit-select" bind:value={criticality}>
        <option value="">Semua Level</option>
        {#each criticalityOptions as opt}
          <option value={opt.value}>{opt.label}</option>
        {/each}
      </select>
    </div>

    <div class="filter-field">
      <label for="sort-select">Urutan</label>
      <select id="sort-select" bind:value={sort}>
        {#each sortOptions as opt}
          <option value={opt.value}>{opt.label}</option>
        {/each}
      </select>
    </div>

    <button type="submit" class="apply-btn">Terapkan</button>
  </form>

  <!-- Redesigned Table -->
  <div class="redesign-table-card">
    {#if items.length === 0}
      <div class="empty-state">
        <p>Tidak ada dashboard yang cocok dengan pencarian Anda.</p>
      </div>
    {:else}
      <div class="redesign-table-wrap">
        <table class="redesign-table">
          <thead>
            <tr>
              <th>DAFTAR DASHBOARD</th>
              <th>SOP</th>
              <th>PIC</th>
              <th>STATUS DASHBOARD</th>
              <th>LAST UPDATES</th>
            </tr>
          </thead>
          <tbody>
            {#each items as item (item.id)}
              <tr>
                <!-- Column 1: Dashboard Info -->
                <td>
                  <div class="dashboard-cell">
                    <div class="avatar-badge">{item.code || 'DB'}</div>
                    <div class="dashboard-info">
                      <a href="#" onclick={(e) => { e.preventDefault(); selectedDetail = item; rememberDetailId(item.id); }} class="dash-name">
                        {item.name}
                      </a>
                      <span class="dash-meta">{item.platform} • {item.category}</span>
                    </div>
                  </div>
                </td>

                <!-- Column SOP -->
                <td>
                  <button class="sop-btn" onclick={() => (selectedSopItem = item)}>
                    Lihat SOP
                  </button>
                </td>

                <!-- Column 2: PIC -->
                <td>
                  <div class="pic-cell">
                    <div class="pic-avatar">{getInitial(item.owner)}</div>
                    <span class="pic-name">{item.owner}</span>
                  </div>
                </td>

                <!-- Column 3: Status -->
                <td>
                  <!-- <span class={`status-pill pill-${item.status}`}>
                    <span class="dot"></span>
                    {registryStatusLabel(item.status)}
                  </span> -->
                  <select
                    class={`status-dropdown pill-${item.status}`}
                    value={item.status}
                    onchange={(e) => changeDashboardStatus(item.id, e.target.value)}
                  >
                    {#each registryStatusOptions as opt}
                      <option value={opt.value}>{opt.label}</option>
                    {/each}
                  </select>
                </td>

                <!-- Column 4: Last Updates -->
                <td>
                  <div class="date-cell">
                    <span class="date-main">{formatDateDisplay(item.updated_at)}</span>
                    <span class="date-sub">Rev: {item.updated_at ? item.updated_at.slice(0, 10) : '-'}</span>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
  {:else}
    <div class="panel">
      <header>
        <button class="back-btn" onclick={() => selectedDetail = null}>← Kembali</button>
        <!-- 
        <div class="meta" style="margin-top: 1rem;">
          <h2 style="margin: 0 0 0.4rem; font-size: 1.7rem;">{selectedDetail.name}</h2>
          <span class="mono" style="margin-left: 0.5rem;">#{selectedDetail.id}</span>
          <span class={`badge status-${selectedDetail.status}`} style="margin-left: 0.5rem;">{registryStatusLabel(selectedDetail.status)}</span>
          <span class={`badge crit-${selectedDetail.criticality}`} style="margin-left: 0.5rem;">{criticalityLabel(selectedDetail.criticality)}</span>
        </div>
        -->
        <div class="detail-header-new">
          <div class="title-section">
            <h2 class="detail-title">{selectedDetail.name}</h2>
            <span class="mono id-badge">#{selectedDetail.id}</span>
          </div>
          <div class="status-section">
            <div class="status-group">
              <span class="status-label">Status Dashboard</span>
              <span class={`badge status-${selectedDetail.status}`}>{registryStatusLabel(selectedDetail.status)}</span>
            </div>
            <div class="status-divider"></div>
            <!--
            <div class="status-group">
              <span class="status-label">Tingkat Kritikalitas</span>
              <span class={`badge crit-${selectedDetail.criticality}`}>{criticalityLabel(selectedDetail.criticality)}</span>
            </div>
            -->
            <div class="status-group">
              <span class="status-label">Tingkat Prioritas</span>
              <span class={`badge crit-${selectedDetail.criticality}`}>{criticalityLabel(selectedDetail.criticality)}</span>
            </div>
          </div>
        </div>
      </header>

      <div class="overview">
        <section>
          <h2>Quick Stats</h2>
          <div class="stats">
            <article>
              <span>Total Requirement</span>
              <strong>{selectedDetail.quick_stats?.tasks_total || 0}</strong>
            </article>
            <article>
              <span>Total Task</span>
              <strong>{selectedDetail.tasks?.length || 0}</strong>
            </article>
            <article>
              <span>Task Done</span>
              <strong>{selectedDetail.quick_stats?.tasks_done || 0}</strong>
            </article>
            <article>
              <span>Created</span>
              <strong class="date">{formatDateDisplay(selectedDetail.created_at)}</strong>
            </article>
            <!-- <article>
              <span>Last Updates</span>
              <strong class="date">{formatDateDisplay(selectedDetail.updated_at)}</strong>
            </article> -->
            <article>
              <span>Last Update</span>
              <strong class="date">{formatDateDisplay(selectedDetail.updated_at)}</strong>
            </article>
          </div>
        </section>

        <section>
          <h2>Info Dasar</h2>
          <dl class="grid3">
            <div><dt>Code</dt><dd>{selectedDetail.code}</dd></div>
            <div><dt>Owner</dt><dd>{selectedDetail.owner}</dd></div>
            <div><dt>Platform</dt><dd>{selectedDetail.platform}</dd></div>
            <div><dt>Category</dt><dd>{selectedDetail.category}</dd></div>
            <div><dt>Version</dt><dd>{selectedDetail.version}</dd></div>
            <div><dt>URL</dt><dd>{selectedDetail.url || '—'}</dd></div>
            
            <div><dt>Framework</dt><dd>{selectedDetail.metadata?.framework || 'CodeIgniter'}</dd></div>
            <div><dt>Backend</dt><dd>{selectedDetail.metadata?.backend || 'PHP'}</dd></div>
            <div><dt>Frontend</dt><dd>{selectedDetail.metadata?.frontend || 'Svelte'}</dd></div>
            <div><dt>Versi CI</dt><dd>{selectedDetail.metadata?.ci_version || '4.x'}</dd></div>
            <div><dt>Versi PHP</dt><dd>{selectedDetail.metadata?.php_version || '8.2'}</dd></div>

            <!-- <div><dt>Created</dt><dd>{formatDateDisplay(selectedDetail.created_at)}</dd></div>
            <div><dt>Updated</dt><dd>{formatDateDisplay(selectedDetail.updated_at)}</dd></div> -->
          </dl>
        </section>
      </div>
    </div>
  {/if}
</section>

{#if selectedSopItem}
  <div class="sop-modal-backdrop" onclick={() => (selectedSopItem = null)}>
    <div class="sop-modal-content" onclick={(e) => e.stopPropagation()}>
      <div class="sop-modal-header">
        <h3>SOP - {selectedSopItem.name}</h3>
        <button class="close-btn" onclick={() => (selectedSopItem = null)}>×</button>
      </div>
      <div class="sop-modal-body">
        <p><strong>Platform:</strong> {selectedSopItem.platform}</p>
        <p><strong>Kategori:</strong> {selectedSopItem.category}</p>
        <p><strong>Owner (PIC):</strong> {selectedSopItem.owner}</p>
        <hr class="sop-divider" />
        <h4>Prosedur Operasional Standar (SOP)</h4>
        <p>Deskripsi sistem: <em>{selectedSopItem.description}</em></p>
        <ol class="sop-list">
           <li>Akses dashboard melalui platform <strong>{selectedSopItem.platform}</strong> menggunakan kredensial yang berwenang.</li>
           <li>Lakukan verifikasi data harian/berkala sesuai jadwal sistem.</li>
           <li>Jika terdapat masalah atau anomali data, segera eskalasikan kepada <strong>{selectedSopItem.owner}</strong>.</li>
           <li>Pastikan untuk mereview dashboard ini kembali jika ada perubahan dari status <strong>{selectedSopItem.status}</strong>.</li>
           <li>Dokumentasikan setiap perubahan konfigurasi pada log aktivitas.</li>
        </ol>
      </div>
      <div class="sop-modal-footer" style="gap: 10px;">
        <button class="sop-btn download-btn" onclick={downloadSopPdf}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Download PDF
        </button>
        <!-- <button class="sop-btn" onclick={() => (selectedSopItem = null)}>Tutup SOP</button> -->
        <button class="sop-btn" onclick={() => (selectedSopItem = null)}>Tutup SOP</button>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Detail View Styles (Legacy Format) */
  .panel {
    background: var(--surface, #fff);
    border: 1px solid var(--border, #e2e8f0);
    border-radius: var(--radius, 12px);
    box-shadow: var(--shadow, 0 1px 3px rgba(0, 0, 0, 0.06));
    padding: 1.25rem;
    margin-top: 1rem;
  }

  .panel h2 {
    margin: 0 0 0.85rem;
    font-size: 1rem;
  }

  .overview {
    display: grid;
    gap: 1.5rem;
  }

  .grid3 {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
    margin: 0;
  }

  dt {
    color: var(--muted, #64748b);
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    margin-bottom: 0.25rem;
  }

  dd {
    margin: 0;
    font-weight: 600;
    word-break: break-word;
  }

  .stats {
    display: grid;
    /* Diubah menjadi 5 kolom untuk memuat 5 card (Total Req, Total Task, Task Done, Created, Last Update) */
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 0.75rem;
  }

  .stats article {
    background: #f8fafc;
    border: 1px solid var(--border, #e2e8f0);
    border-radius: 10px;
    padding: 0.9rem 1rem;
    display: grid;
    gap: 0.35rem;
  }

  .stats span {
    color: var(--muted, #64748b);
    font-size: 0.82rem;
  }

  .stats strong {
    font-size: 1.45rem;
    line-height: 1;
  }

  .stats strong.date {
    font-size: 1rem;
  }

  @media (max-width: 900px) {
    .grid3,
    .stats {
      grid-template-columns: 1fr;
    }
  }

  .back-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    background: #ffffff;
    color: #475569;
    border: 1px solid #cbd5e1;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  .back-btn:hover {
    background: #f8fafc;
    color: #0f172a;
    border-color: #94a3b8;
  }

  .page {
    min-height: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: auto;
    padding-bottom: 1.5rem;
  }

  .redesign-container {
    min-height: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: auto;
    padding-bottom: 1.5rem;
    padding-top: 1rem;
    flex: 1;
    min-width: 0;
  }

  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: end;
    margin: 1rem 0;
  }

  label {
    display: grid;
    gap: 0.35rem;
    font-size: 0.85rem;
    color: var(--muted, #64748b);
  }

  label.grow {
    flex: 1;
    min-width: 180px;
  }

  select,
  input,
  button {
    height: 2.4rem;
    border: 1px solid var(--border, #e2e8f0);
    border-radius: 8px;
    padding: 0 0.75rem;
    background: var(--surface, #fff);
    color: #0f172a; /* Fix dropdown text visibility */
  }

  select {
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
    background-repeat: no-repeat;
    background-position: right 0.75rem center;
    background-size: 0.65em auto;
    padding-right: 2rem !important;
    cursor: pointer;
    min-width: 140px;
    color: #0f172a !important;
    background-color: #ffffff !important;
  }
  
  select option {
    color: #0f172a;
    background: #ffffff;
  }

  button {
    background: var(--accent, #1a1a1a);
    color: white;
    border-color: var(--accent, #1a1a1a);
    cursor: pointer;
  }

  .table-wrap {
    overflow: auto;
    background: var(--surface, #fff);
    border: 1px solid var(--border, #e2e8f0);
    border-radius: var(--radius, 12px);
    box-shadow: var(--shadow, 0 1px 3px rgba(0, 0, 0, 0.06));
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th,
  td {
    text-align: left;
    padding: 0.85rem 1rem;
    border-bottom: 1px solid var(--border, #e2e8f0);
    vertical-align: top;
  }

  th {
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--muted, #64748b);
    background: #f8fafc;
  }

  tbody tr:last-child td {
    border-bottom: 0;
  }

  a {
    color: var(--accent, #1a1a1a);
    display: grid;
    gap: 0.15rem;
  }

  a strong {
    font-weight: 600;
  }

  .code {
    font-size: 0.78rem;
    color: var(--muted, #64748b);
    font-weight: 500;
  }

  .mono {
    color: var(--muted, #64748b);
  }

  .badge {
    display: inline-block;
    padding: 0.2rem 0.55rem;
    border-radius: 999px;
    font-size: 0.78rem;
    font-weight: 600;
  }

  .status-active {
    background: #dcfce7;
    color: #166534;
  }

  .status-draft {
    background: #e2e8f0;
    color: #475569;
  }

  .status-maintenance {
    background: #fef3c7;
    color: #92400e;
  }

  .status-retired {
    background: #fee2e2;
    color: #991b1b;
  }

  .status-idle {
    background: #f1f5f9;
    color: #475569;
  }

  .crit-high {
    background: #fee2e2;
    color: #991b1b;
  }

  .crit-medium {
    background: #ffedd5;
    color: #9a3412;
  }

  .crit-low {
    background: #e0e7ff;
    color: #3730a3;
  }

  .state {
    padding: 1rem;
    background: var(--surface, #fff);
    border: 1px solid var(--border, #e2e8f0);
    border-radius: var(--radius, 12px);
  }

  /* ========================================= */
  /* STYLES DESAIN BARU (REDESIGN DAFTAR DASHBOARD) */
  /* ========================================= */

  .redesign-separator {
    margin: 3rem 0 1.5rem 0;
    text-align: center;
    border-bottom: 2px dashed #cbd5e1;
    line-height: 0.1em;
  }

  .redesign-separator span {
    background: #f8fafc;
    padding: 0 1rem;
    color: #0f172a;
    font-weight: 700;
    font-size: 0.95rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* Header Bar */
  .redesign-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: transparent;
    padding: 0 0 1.5rem 0;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .header-left {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 300px;
    flex: 1;
  }

  .eyebrow-tag {
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.06em;
    color: #94a3b8;
    text-transform: uppercase;
  }

  .title-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .title-row h2 {
    margin: 0;
    font-size: 1.6rem;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.02em;
  }

  .count-pill {
    font-size: 0.75rem;
    font-weight: 700;
    background: #e2e8f0;
    color: #475569;
    padding: 0.25rem 0.75rem;
    border-radius: 999px;
    white-space: nowrap;
  }

  .subtitle {
    margin: 0;
    font-size: 0.85rem;
    color: #64748b;
  }

  .sop-master-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: #1e3a8a;
    color: #ffffff;
    font-size: 0.85rem;
    font-weight: 600;
    padding: 0.6rem 1.25rem;
    border-radius: 999px;
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(30, 58, 138, 0.2);
    transition: background 0.2s ease;
    white-space: nowrap;
  }

  .sop-master-btn:hover {
    background: #1e40af;
  }

  /* Stats Grid */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1.25rem;
    margin-bottom: 2rem;
  }

  .stat-card {
    border-radius: 12px;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    position: relative;
    overflow: hidden;
  }

  .blue-solid-card {
    background: #1e3a8a;
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(30, 58, 138, 0.2);
  }

  .white-card {
    background: #ffffff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    border: 1px solid #e2e8f0;
  }
  
  .border-bottom-blue {
     border-bottom: 4px solid #1e3a8a;
  }

  .yellow-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-top: 4px solid #f59e0b;
    border-right: 4px solid #f59e0b;
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.1);
  }

  .stat-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .stat-title {
    font-size: 0.85rem;
    font-weight: 600;
  }

  .blue-solid-card .stat-title {
    color: #bfdbfe;
  }

  .white-card .stat-title,
  .yellow-card .stat-title {
    color: #475569;
  }

  .icon-wrapper {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .blue-solid-icon { background: rgba(255, 255, 255, 0.2); color: #ffffff; }
  .green-icon { background: #dcfce7; color: #16a34a; }
  .purple-icon { background: #f3e8ff; color: #9333ea; }
  .yellow-icon { background: #fef3c7; color: #d97706; }

  .stat-bottom {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .stat-value {
    font-size: 2.25rem;
    font-weight: 800;
    line-height: 1;
  }

  .blue-solid-card .stat-value {
    color: #ffffff;
  }

  .white-card .stat-value,
  .yellow-card .stat-value {
    color: #0f172a;
  }

  .stat-sub {
    font-size: 0.75rem;
  }

  .blue-solid-card .stat-sub {
    color: #93c5fd;
  }

  .white-card .stat-sub {
    color: #64748b;
  }

  .link-sub {
    color: #94a3b8 !important;
    font-weight: 500;
  }

  .yellow-sub {
    color: #d97706 !important;
    font-weight: 600;
  }

  /* Redesign Filters */
  .redesign-filters {
    background: transparent;
    padding: 0 0 1.5rem 0;
    display: flex;
    align-items: flex-end;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .filter-field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .filter-field label {
    font-size: 0.75rem;
    font-weight: 600;
    color: #475569;
  }

  .grow-field {
    flex: 1;
    min-width: 240px;
  }

  .input-with-icon {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-icon {
    position: absolute;
    left: 0.75rem;
    color: #94a3b8;
  }

  .input-with-icon input {
    width: 100%;
    padding-left: 2.25rem;
    padding-right: 0.75rem;
    border-radius: 6px;
    border: 1px solid #cbd5e1;
    font-size: 0.85rem;
    height: 2.5rem;
    background: #ffffff;
  }

  .input-with-icon input:focus {
      outline: none;
      border-color: #94a3b8;
  }

  .redesign-filters select {
    border-radius: 6px;
    border: 1px solid #cbd5e1;
    font-size: 0.85rem;
    height: 2.5rem;
    padding: 0 2rem 0 0.75rem;
    color: #1e293b;
    background-color: #ffffff;
    min-width: 140px;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 5l3 3 3-3'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.75rem center;
  }
  
  .redesign-filters select:focus {
      outline: none;
      border-color: #94a3b8;
  }

  .apply-btn {
    height: 2.5rem;
    padding: 0 1.25rem;
    border-radius: 6px;
    background: #0f172a;
    color: #ffffff;
    font-weight: 600;
    font-size: 0.85rem;
    border: none;
    cursor: pointer;
    transition: background 0.2s ease;
    align-self: flex-end;
  }

  .apply-btn:hover {
    background: #1e293b;
  }

  /* Redesign Table Card */
  .redesign-table-card {
    background: #ffffff;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    flex-shrink: 0;
  }

  .redesign-table-wrap {
    overflow-x: auto;
  }

  .redesign-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
  }

  .redesign-table th {
    background: #f8fafc;
    padding: 0.85rem 1.25rem;
    font-size: 0.7rem;
    font-weight: 700;
    color: #64748b;
    letter-spacing: 0.05em;
    border-bottom: 1px solid #e2e8f0;
  }

  .redesign-table td {
    padding: 1rem 1.25rem;
    border-bottom: 1px solid #f1f5f9;
    vertical-align: middle;
  }

  .redesign-table tr:last-child td {
    border-bottom: none;
  }

  /* Dashboard Cell */
  .dashboard-cell {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .avatar-badge {
    width: 32px;
    height: 32px;
    background: #1e293b;
    color: #ffffff;
    font-weight: 700;
    font-size: 0.7rem;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    letter-spacing: 0.02em;
    flex-shrink: 0;
  }

  .dashboard-info {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  .dash-name {
    font-size: 0.9rem;
    font-weight: 600;
    color: #0f172a;
    text-decoration: none;
  }

  .dash-name:hover {
    color: #0284c7;
  }

  .dash-meta {
    font-size: 0.75rem;
    color: #94a3b8;
  }

  /* PIC Cell */
  .pic-cell {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .pic-avatar {
    width: 26px;
    height: 26px;
    background: #3b82f6;
    color: #ffffff;
    font-weight: 600;
    font-size: 0.75rem;
    border-radius: 999px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .pic-name {
    font-size: 0.85rem;
    font-weight: 500;
    color: #475569;
  }

  /* Status Pills */
  .status-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.25rem 0.6rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .status-pill .dot {
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background: currentColor;
  }

  .pill-active {
    background-color: #dcfce7 !important;
    color: #16a34a !important;
  }

  .pill-idle {
    background-color: #f1f5f9 !important;
    color: #64748b !important;
  }

  .status-dropdown {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 1.6rem 0.25rem 0.6rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
    border: none;
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 4l2 2 2-2'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.4rem center;
    background-size: 0.8em;
  }
  .status-dropdown:focus {
    outline: 2px solid #94a3b8;
  }
  
  .status-dropdown option {
    background-color: #ffffff;
    color: #0f172a;
  }

  /* Date Cell */
  .date-cell {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  .date-main {
    font-size: 0.85rem;
    font-weight: 500;
    color: #475569;
  }

  .date-sub {
    font-size: 0.75rem;
    color: #94a3b8;
  }

  .empty-state {
    padding: 2rem;
    text-align: center;
    color: #64748b;
    font-size: 0.85rem;
  }

  .redesign-table-wrap {
    width: 100%;
  }

  /* Sticky header for scrollable table */
  .redesign-table thead th {
    position: sticky;
    top: 0;
    z-index: 10;
    background: #f8fafc;
    border-bottom: 2px solid #e2e8f0;
    box-shadow: 0 2px 4px -2px rgba(0,0,0,0.05); /* add slight shadow for sticky */
  }

  .sop-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    background: #f1f5f9;
    color: #1e3a8a;
    border: 1px solid #cbd5e1;
    padding: 0.4rem 0.8rem;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .sop-btn:hover {
    background: #e2e8f0;
    border-color: #94a3b8;
  }

  /* SOP Modal Styles */
  .sop-modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(15, 23, 42, 0.4);
    backdrop-filter: blur(4px);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .sop-modal-content {
    background: #ffffff;
    border-radius: 12px;
    width: 90%;
    max-width: 500px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    animation: modalPop 0.2s ease-out forwards;
  }

  @keyframes modalPop {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }

  .sop-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid #e2e8f0;
  }

  .sop-modal-header h3 {
    margin: 0;
    font-size: 1.15rem;
    color: #0f172a;
  }

  .close-btn {
    background: transparent;
    border: none;
    font-size: 1.5rem;
    line-height: 1;
    color: #64748b;
    padding: 0;
    cursor: pointer;
    height: auto;
  }

  .close-btn:hover {
    color: #0f172a;
  }

  .sop-modal-body {
    padding: 1.5rem;
    color: #334155;
    font-size: 0.9rem;
    line-height: 1.5;
    max-height: 60vh;
    overflow-y: auto;
  }

  .sop-modal-body p {
    margin: 0.25rem 0;
  }

  .sop-divider {
    margin: 1.25rem 0;
    border: none;
    border-top: 1px solid #e2e8f0;
  }

  .sop-modal-body h4 {
    margin: 0 0 0.5rem 0;
    color: #0f172a;
    font-size: 1rem;
  }

  .sop-list {
    padding-left: 1.25rem;
    margin: 0.75rem 0 0 0;
  }

  .sop-list li {
    margin-bottom: 0.5rem;
  }

  .sop-modal-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid #e2e8f0;
    display: flex;
    justify-content: flex-end;
  }

  /* CSS Baru untuk Detail Header Status */
  .detail-header-new {
    margin-top: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding-bottom: 1.25rem;
    border-bottom: 1px solid #e2e8f0;
    margin-bottom: 1.5rem;
  }

  .title-section {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    flex-wrap: wrap;
  }

  .detail-title {
    margin: 0 !important;
    font-size: 1.7rem !important;
    font-weight: 700;
    color: #0f172a;
    line-height: 1.2;
  }

  .id-badge {
    background: #f1f5f9;
    padding: 0.2rem 0.6rem;
    border-radius: 6px;
    font-size: 0.9rem;
    color: #64748b;
    border: 1px solid #e2e8f0;
  }

  .status-section {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    flex-wrap: wrap;
    background: #f8fafc;
    padding: 0.8rem 1.2rem;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    width: fit-content;
  }

  .status-group {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .status-label {
    font-size: 0.85rem;
    color: #475569;
    font-weight: 500;
  }

  .status-divider {
    width: 1px;
    height: 24px;
    background: #cbd5e1;
  }
</style>

