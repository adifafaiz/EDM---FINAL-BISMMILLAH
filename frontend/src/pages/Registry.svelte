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
  } from '../lib/registryStore.svelte.js'
  import { formatDate } from '../lib/format.js'

  let status = $state('')
  let dashboard = $state('')
  let criticality = $state('')
  let q = $state('')
  let sort = $state('updated_desc')

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
  const reviewCount = $derived(
    allDashboards.filter((d) => d.status === 'draft' || d.status === 'maintenance').length
  )

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
    <div class="header-right">
      <button class="sop-master-btn" type="button" onclick={() => alert('Membuka SOP Master Aplikasi')}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/></svg>
        Lihat SOP Master Aplikasi
      </button>
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

    <!-- Card 3 -->
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

    <!-- Card 4 -->
    <div class="stat-card yellow-card">
      <div class="stat-top">
        <span class="stat-title">Draft & Maintenance</span>
        <div class="icon-wrapper yellow-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3"/></svg>
        </div>
      </div>
      <div class="stat-bottom">
        <div class="stat-value">{reviewCount}</div>
        <div class="stat-sub yellow-sub">perlu peninjauan</div>
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
              <th>PIC</th>
              <th>STATUS DASHBOARD</th>
              <th>LAST UPDATES</th>
              <th>LINK EXTERNAL</th>
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
                      <a href={`/registry/${item.id}`} use:link onclick={() => rememberDetailId(item.id)} class="dash-name">
                        {item.name}
                      </a>
                      <span class="dash-meta">{item.platform} • {item.category}</span>
                    </div>
                  </div>
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
                  <span class={`status-pill pill-${item.status}`}>
                    <span class="dot"></span>
                    {registryStatusLabel(item.status)}
                  </span>
                </td>

                <!-- Column 4: Last Updates -->
                <td>
                  <div class="date-cell">
                    <span class="date-main">{formatDateDisplay(item.updated_at)}</span>
                    <span class="date-sub">Rev: {item.updated_at ? item.updated_at.slice(0, 10) : '-'}</span>
                  </div>
                </td>

                <!-- Column 5: Link External -->
                <td>
                  <a
                    href={item.url || `#/registry/${item.id}`}
                    target={item.url ? "_blank" : "_self"}
                    rel="noreferrer"
                    class="external-link-btn"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                    Buka Link
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  </a>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</section>

<style>
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
    background: #dcfce7;
    color: #16a34a;
  }

  .pill-maintenance {
    background: #fef3c7;
    color: #d97706;
  }

  .pill-draft {
    background: #f1f5f9;
    color: #64748b;
  }

  .pill-retired {
    background: #fee2e2;
    color: #dc2626;
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

  /* External Link Button */
  .external-link-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    background: #f1f5f9;
    color: #0284c7;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.35rem 0.75rem;
    border-radius: 999px;
    text-decoration: none;
    transition: background 0.2s ease;
  }

  .external-link-btn:hover {
    background: #e2e8f0;
  }

  .empty-state {
    padding: 2rem;
    text-align: center;
    color: #64748b;
    font-size: 0.85rem;
  }
</style>

