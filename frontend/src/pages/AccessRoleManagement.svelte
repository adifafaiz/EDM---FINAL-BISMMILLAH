<script>
  import GlassPanel from '../lib/GlassPanel.svelte'
  import SubmenuHeader from '../lib/SubmenuHeader.svelte'
  import {
    accessStore,
    permissionCatalog,
    setRolePermission,
    countUsersInRole,
  } from '../lib/accessStore.svelte.js'

  const roles = $derived(accessStore.roles)

  /** @param {import('../lib/accessStore.svelte.js').AccessRole} role */
  function enabledCount(role) {
    return Object.values(role.permissions).filter(Boolean).length
  }

  /** @param {import('../lib/accessStore.svelte.js').AccessRole} role @param {string} key */
  function hasPerm(role, key) {
    return !!role.permissions[key]
  }

  /** @param {number} roleId @param {string} key */
  function togglePerm(roleId, key) {
    const role = roles.find((r) => r.id === roleId)
    if (!role) return
    setRolePermission(roleId, key, !role.permissions[key])
  }

  const groups = $derived.by(() => {
    /** @type {Map<string, typeof permissionCatalog>} */
    const map = new Map()
    for (const p of permissionCatalog) {
      const list = map.get(p.group) || []
      list.push(p)
      map.set(p.group, list)
    }
    return [...map.entries()]
  })
</script>

<section class="page">
  <GlassPanel>
    <SubmenuHeader
      eyebrow="User Access"
      title="Role Management"
      sub="Daftar peran dan matriks permission"
      meta={`${roles.length} role`}
    />
  </GlassPanel>

  <GlassPanel class="fill">
    <div class="split">
      <div class="role-list">
        <h3>List Role</h3>
        <div class="role-cards">
          {#each roles as role (role.id)}
            <article class="role-card">
              <div class="role-head">
                <strong>{role.name}</strong>
                <span class="count">{countUsersInRole(role.id)} user</span>
              </div>
              <p>{role.description}</p>
              <div class="perm-summary">
                <span class="chip">{enabledCount(role)}/{permissionCatalog.length} permission</span>
              </div>
            </article>
          {/each}
        </div>
      </div>

      <div class="matrix-wrap">
        <h3>Permission Matrix</h3>
        <p class="hint">Centang untuk mengaktifkan permission pada masing-masing role.</p>
        <div class="matrix-scroll">
          <table class="matrix">
            <thead>
              <tr>
                <th class="sticky-col">Permission</th>
                {#each roles as role}
                  <th>{role.name}</th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each groups as [group, perms]}
                <tr class="group-row">
                  <td colspan={roles.length + 1}>{group}</td>
                </tr>
                {#each perms as perm}
                  <tr>
                    <td class="sticky-col perm-label">{perm.label}</td>
                    {#each roles as role}
                      <td class="cell-check">
                        <label class="toggle" title={`${perm.label} · ${role.name}`}>
                          <input
                            type="checkbox"
                            checked={hasPerm(role, perm.key)}
                            onchange={() => togglePerm(role.id, perm.key)}
                          />
                          <span class="box" aria-hidden="true"></span>
                        </label>
                      </td>
                    {/each}
                  </tr>
                {/each}
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </GlassPanel>
</section>

<style>
  .page {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow: hidden;
  }

  :global(.page > .panel-glow.fill) {
    flex: 1;
    min-height: 0;
  }

  .split {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(240px, 320px) 1fr;
    gap: 16px;
    overflow: hidden;
  }

  h3 {
    margin: 0 0 10px;
    font-size: 0.82rem;
    font-weight: 750;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #8a8a90;
  }

  .role-list {
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding-right: 4px;
    border-right: 1px solid rgba(0, 0, 0, 0.06);
  }

  .role-cards {
    flex: 1;
    min-height: 0;
    overflow: auto;
    display: grid;
    gap: 10px;
    align-content: start;
    padding-right: 8px;
  }

  .role-card {
    padding: 12px 14px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.45);
    border: 1px solid rgba(0, 0, 0, 0.05);
  }

  .role-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 6px;
  }

  .role-head strong {
    font-size: 0.92rem;
    font-weight: 750;
    color: #1a1a1a;
  }

  .count {
    font-size: 0.68rem;
    font-weight: 700;
    color: #8a8a90;
    white-space: nowrap;
  }

  .role-card p {
    margin: 0 0 10px;
    font-size: 0.78rem;
    line-height: 1.45;
    color: #6b6b6b;
  }

  .perm-summary .chip {
    display: inline-block;
    padding: 0.2rem 0.55rem;
    border-radius: 999px;
    font-size: 0.68rem;
    font-weight: 750;
    background: rgba(196, 181, 230, 0.35);
    color: #5b4a8a;
  }

  .matrix-wrap {
    min-height: 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .hint {
    margin: 0 0 12px;
    font-size: 0.76rem;
    color: #8a8a90;
  }

  .matrix-scroll {
    flex: 1;
    min-height: 0;
    overflow: auto;
    margin: -2px;
    border-radius: 16px;
    border: 1px solid rgba(0, 0, 0, 0.05);
    background: rgba(255, 255, 255, 0.35);
  }

  .matrix {
    width: 100%;
    border-collapse: collapse;
    min-width: 640px;
  }

  .matrix th,
  .matrix td {
    padding: 0.65rem 0.75rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    text-align: center;
    vertical-align: middle;
    font-size: 0.82rem;
  }

  .matrix th {
    font-size: 0.72rem;
    font-weight: 750;
    color: #6b6b6b;
    background: rgba(255, 255, 255, 0.6);
    position: sticky;
    top: 0;
    z-index: 2;
  }

  .sticky-col {
    text-align: left !important;
    position: sticky;
    left: 0;
    z-index: 1;
    background: rgba(255, 255, 255, 0.92);
    min-width: 200px;
    font-weight: 600;
    color: #1a1a1a;
  }

  .perm-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: #3a3a3a;
  }

  .group-row td {
    text-align: left;
    font-size: 0.68rem;
    font-weight: 750;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #8e8e93;
    background: rgba(26, 26, 26, 0.04);
    padding: 0.5rem 0.75rem;
  }

  .cell-check {
    width: 72px;
  }

  .toggle {
    display: inline-grid;
    place-items: center;
    cursor: pointer;
    position: relative;
  }

  .toggle input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  .box {
    width: 22px;
    height: 22px;
    border-radius: 8px;
    border: 1.5px solid rgba(0, 0, 0, 0.12);
    background: rgba(255, 255, 255, 0.8);
    transition: background 0.15s ease, border-color 0.15s ease;
  }

  .toggle input:checked + .box {
    background: #1a1a1a;
    border-color: #1a1a1a;
    box-shadow: inset 0 0 0 2px #fff;
  }

  .toggle input:focus-visible + .box {
    outline: 2px solid rgba(26, 26, 26, 0.35);
    outline-offset: 2px;
  }

  @media (max-width: 960px) {
    .split {
      grid-template-columns: 1fr;
      overflow: auto;
    }

    .role-list {
      border-right: 0;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
      padding-bottom: 12px;
      max-height: 240px;
    }
  }
</style>
