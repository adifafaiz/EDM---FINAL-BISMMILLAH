<script>
  import Router from 'svelte-spa-router'
  import Layout from './lib/Layout.svelte'
  import Home from './pages/Home.svelte'
  import Login from './pages/Login.svelte'
  import TaskBoard from './pages/TaskBoard.svelte'
  import TaskList from './pages/TaskList.svelte'
  import TaskDetail from './pages/TaskDetail.svelte'
  import Registry from './pages/Registry.svelte'
  import RegistryDetail from './pages/RegistryDetail.svelte'
  import RegistryDetailGate from './pages/RegistryDetailGate.svelte'
  import ActivityLog from './pages/ActivityLog.svelte'
  import ActivityLogDetail from './pages/ActivityLogDetail.svelte'
  import AccessUserList from './pages/AccessUserList.svelte'
  import AccessRoleManagement from './pages/AccessRoleManagement.svelte'
  import SettingsProfile from './pages/SettingsProfile.svelte'

  const routes = {
    '/login': Login,
    '/': Home,
    '/tasks': TaskBoard,
    '/tasks/board': TaskBoard,
    '/tasks/list': TaskList,
    '/tasks/new': TaskBoard,
    '/tasks/detail': TaskBoard,
    '/tasks/:id': TaskDetail,
    '/registry': Registry,
    '/registry/list': Registry,
    '/registry/detail': RegistryDetailGate,
    '/registry/:id': RegistryDetail,
    '/activity-log': ActivityLog,
    '/activity-log/:id': ActivityLogDetail,
    '/access': AccessUserList,
    '/access/users': AccessUserList,
    '/access/roles': AccessRoleManagement,
    '/access/profile': SettingsProfile,
  }
</script>

<Layout>
  <Router {routes} />
</Layout>

<style>
  :global(.stage-body > *) {
    flex: 1;
    min-height: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
</style>
