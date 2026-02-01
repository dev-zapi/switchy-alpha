<script lang="ts">
  import type { Snippet } from 'svelte';
  import { onMount } from 'svelte';
  import i18nStore, { t } from '$lib/i18n.svelte';
  import optionsStore from '$lib/stores/options.svelte';
  import themeStore from '$lib/stores/theme.svelte';
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

  // Make navItems reactive so it updates when language changes
  let navItems = $derived<NavItem[]>([
    { id: 'profiles', label: t('options_navHeader_profiles') || 'Profiles', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
    { id: 'general', label: t('options_tab_general') || 'General', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
    { id: 'import-export', label: t('options_tab_importExport') || 'Import/Export', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
    { id: 'about', label: t('about_title') || 'About', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  ]);

  // Theme icons
  const themeIcons = {
    light: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z',
    dark: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z',
    system: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  };

  // Theme labels - make reactive with proper fallback
  let themeLabels = $derived({
    light: (t('theme_light') === 'theme_light') ? 'Light' : t('theme_light'),
    dark: (t('theme_dark') === 'theme_dark') ? 'Dark' : t('theme_dark'),
    system: (t('theme_system') === 'theme_system') ? 'System' : t('theme_system'),
  });

  // Language dropdown state
  let showLangDropdown = $state(false);

  onMount(() => {
    themeStore.init();
  });

  function navigate(page: string) {
    onnavigate?.(page);
  }

  async function handleApply() {
    await optionsStore.applyChanges();
  }

  async function handleRevert() {
    await optionsStore.revertChanges();
  }

  function handleThemeCycle() {
    themeStore.cycle();
  }

  function handleLanguageSelect(lang: typeof i18nStore.language) {
    i18nStore.setLanguage(lang);
    showLangDropdown = false;
  }

  function toggleLangDropdown() {
    showLangDropdown = !showLangDropdown;
  }

  function closeLangDropdown() {
    showLangDropdown = false;
  }
</script>

<div class="flex h-screen bg-gray-100/50 dark:bg-gray-900">
  <!-- Sidebar -->
  <aside class="w-64 glass dark:glass-dark flex flex-col">
    <!-- Logo -->
    <div class="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
      <h1 class="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
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
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-smooth {currentPage === item.id ? 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' : 'text-gray-600 hover:bg-gray-500/10 dark:text-gray-400 dark:hover:bg-gray-500/10'}"
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
    <div class="p-4 border-t border-gray-200/50 dark:border-gray-700/50">
      <h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
        Profiles
      </h3>
      <div class="space-y-0.5 max-h-48 overflow-y-auto">
        {#each optionsStore.sortedProfiles as profile}
          <button
            type="button"
            class="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-left text-gray-600 hover:bg-gray-500/10 dark:text-gray-400 dark:hover:bg-gray-500/10 transition-smooth"
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

    <!-- Theme switcher -->
    <div class="p-4 border-t border-gray-200/50 dark:border-gray-700/50">
      <button
        type="button"
        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-500/10 dark:text-gray-400 dark:hover:bg-gray-500/10 transition-smooth"
        onclick={handleThemeCycle}
        aria-label="Toggle theme"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={themeIcons[themeStore.mode]} />
        </svg>
        {themeLabels[themeStore.mode]}
      </button>
    </div>

    <!-- Language switcher -->
    <div class="p-4 border-t border-gray-200/50 dark:border-gray-700/50 relative">
      <button
        type="button"
        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-500/10 dark:text-gray-400 dark:hover:bg-gray-500/10 transition-smooth"
        onclick={toggleLangDropdown}
        aria-label="Change language"
        aria-expanded={showLangDropdown}
        aria-haspopup="listbox"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
        {i18nStore.currentLanguageInfo?.nativeLabel || 'English'}
        <svg class="w-4 h-4 ml-auto transition-transform {showLangDropdown ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {#if showLangDropdown}
        <!-- Backdrop to close dropdown -->
        <button
          type="button"
          class="fixed inset-0 z-10"
          onclick={closeLangDropdown}
          aria-label="Close language menu"
        ></button>

        <!-- Dropdown menu -->
        <div class="absolute bottom-full left-4 right-4 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 overflow-hidden" role="listbox">
          {#each i18nStore.languages as lang}
            <button
              type="button"
              class="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-smooth
                {i18nStore.language === lang.code 
                  ? 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' 
                  : 'text-gray-600 hover:bg-gray-500/10 dark:text-gray-400 dark:hover:bg-gray-500/10'}"
              onclick={() => handleLanguageSelect(lang.code)}
              role="option"
              aria-selected={i18nStore.language === lang.code}
            >
              <span>{lang.nativeLabel}</span>
              <span class="text-xs text-gray-400 dark:text-gray-500">({lang.label})</span>
              {#if i18nStore.language === lang.code}
                <svg class="w-4 h-4 ml-auto text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              {/if}
            </button>
          {/each}
        </div>
      {/if}
    </div>
  </aside>

  <!-- Main content -->
  <main class="flex-1 flex flex-col overflow-hidden">
    <!-- Top bar with actions -->
    {#if optionsStore.isDirty}
      <div class="bg-amber-500/10 border-b border-amber-500/20 px-6 py-3 flex items-center justify-between">
        <span class="text-sm text-amber-700 dark:text-amber-300">
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
