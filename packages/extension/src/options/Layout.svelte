<script lang="ts">
  import type { Snippet } from 'svelte';
  import { t } from '$lib/i18n';
  import optionsStore from '$lib/stores/options.svelte';
  import Button from '$components/ui/Button.svelte';
  import Alert from '$components/ui/Alert.svelte';

  interface NavItem {
    id: string;
    label: string;
    icon: string;
  }

  interface Props {
    currentPage?: string;
    onnavigate?: (page: string) => void;
    children: Snippet;
  }

  let { currentPage = 'profiles', onnavigate, children }: Props = $props();

  const navItems: NavItem[] = [
    { id: 'profiles', label: 'Profiles', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
    { id: 'general', label: t('nav_general'), icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
    { id: 'import-export', label: t('nav_importExport'), icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
    { id: 'about', label: t('nav_about'), icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  ];

  function navigate(page: string) {
    onnavigate?.(page);
  }

  async function handleApply() {
    await optionsStore.applyChanges();
  }

  async function handleRevert() {
    await optionsStore.revertChanges();
  }
</script>

<div class="flex h-screen bg-gray-50 dark:bg-gray-900">
  <!-- Sidebar -->
  <aside class="w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col">
    <!-- Logo -->
    <div class="p-4 border-b dark:border-gray-700">
      <h1 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
        {t('appNameShort')}
      </h1>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 p-4 space-y-1">
      {#each navItems as item}
        <button
          type="button"
          class="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors {currentPage === item.id ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}"
          onclick={() => navigate(item.id)}
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.icon} />
          </svg>
          {item.label}
        </button>
      {/each}
    </nav>

    <!-- Profiles list -->
    <div class="p-4 border-t dark:border-gray-700">
      <h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
        Profiles
      </h3>
      <div class="space-y-1 max-h-48 overflow-y-auto">
        {#each optionsStore.sortedProfiles as profile}
          <button
            type="button"
            class="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            onclick={() => navigate(`profile:${profile.name}`)}
          >
            <span class="w-2 h-2 rounded-full bg-blue-500"></span>
            <span class="truncate">{profile.name}</span>
          </button>
        {/each}
      </div>
      <Button variant="ghost" size="sm" class="w-full mt-2" onclick={() => navigate('new-profile')}>
        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        {t('options_newProfile')}
      </Button>
    </div>
  </aside>

  <!-- Main content -->
  <main class="flex-1 flex flex-col overflow-hidden">
    <!-- Top bar with actions -->
    {#if optionsStore.isDirty}
      <div class="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-6 py-3 flex items-center justify-between">
        <span class="text-sm text-yellow-800 dark:text-yellow-200">
          You have unsaved changes
        </span>
        <div class="flex gap-2">
          <Button variant="ghost" size="sm" onclick={handleRevert}>
            {t('options_revert')}
          </Button>
          <Button variant="primary" size="sm" onclick={handleApply}>
            {t('options_apply')}
          </Button>
        </div>
      </div>
    {/if}

    {#if optionsStore.error}
      <div class="px-6 py-3">
        <Alert type="error" dismissible>
          {optionsStore.error}
        </Alert>
      </div>
    {/if}

    <!-- Page content -->
    <div class="flex-1 overflow-y-auto p-6">
      {@render children()}
    </div>
  </main>
</div>
