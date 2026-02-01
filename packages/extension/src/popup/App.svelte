<script lang="ts">
  import { onMount } from 'svelte';
  import type { Profile } from '@anthropic-demo/switchyalpha-pac';
  import { t } from '$lib/i18n.svelte';
  import i18nStore from '$lib/i18n.svelte';
  import themeStore from '$lib/stores/theme.svelte';

  // Built-in profiles
  const builtinProfiles: Profile[] = [
    { name: 'direct', profileType: 'DirectProfile' } as Profile,
    { name: 'system', profileType: 'SystemProfile' } as Profile,
  ];

  let profiles = $state<Profile[]>([]);
  let currentProfileName = $state('system');
  let isLoading = $state(true);

  // Profile type icons
  const iconPaths: Record<string, string> = {
    FixedProfile: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9',
    SwitchProfile: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
    PacProfile: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
    RuleListProfile: 'M4 6h16M4 10h16M4 14h16M4 18h16',
    DirectProfile: 'M13 10V3L4 14h7v7l9-11h-7z',
    SystemProfile: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  };

  // Profile type colors
  const typeColors: Record<string, string> = {
    FixedProfile: 'bg-blue-500',
    SwitchProfile: 'bg-green-500',
    PacProfile: 'bg-purple-500',
    RuleListProfile: 'bg-orange-500',
    DirectProfile: 'bg-gray-500',
    SystemProfile: 'bg-gray-400',
  };

  onMount(async () => {
    // Initialize theme and language
    await Promise.all([
      themeStore.init(),
      i18nStore.init()
    ]);

    try {
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        const response = await chrome.runtime.sendMessage({ action: 'getOptions' });
        if (response?.options) {
          // Extract profiles from options
          const customProfiles: Profile[] = [];
          for (const [key, value] of Object.entries(response.options)) {
            if (key.startsWith('+') && typeof value === 'object' && value !== null) {
              customProfiles.push(value as Profile);
            }
          }
          profiles = customProfiles.sort((a, b) => a.name.localeCompare(b.name));
          currentProfileName = response.currentProfileName || 'system';
        }
      }
    } catch (e) {
      console.error('Failed to load options:', e);
    } finally {
      isLoading = false;
    }
  });

  async function selectProfile(name: string) {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        await chrome.runtime.sendMessage({
          action: 'applyProfile',
          profileName: name,
        });
      }
      currentProfileName = name;
    } catch (e) {
      console.error('Failed to apply profile:', e);
    }
  }

  function openOptions() {
    chrome.runtime.openOptionsPage();
  }

  function getDisplayName(profile: Profile): string {
    if (profile.profileType === 'DirectProfile') return t('profile_direct');
    if (profile.profileType === 'SystemProfile') return t('profile_system');
    return profile.name;
  }

  const allProfiles = $derived([...builtinProfiles, ...profiles]);
</script>

<div class="w-72 bg-white dark:bg-gray-900 overflow-hidden">
  <!-- Header -->
  <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200/50 dark:border-gray-700/50">
    <div class="flex items-center gap-2">
      <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
      <h1 class="font-semibold text-gray-900 dark:text-white">{t('appNameShort')}</h1>
    </div>
    <button
      class="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-500/10 rounded-lg transition-smooth"
      onclick={openOptions}
      title={t('popup_openOptions')}
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </button>
  </div>

  <!-- Profile list -->
  <div class="py-2 max-h-80 overflow-y-auto">
    {#if isLoading}
      <div class="flex items-center justify-center py-8">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    {:else}
      {#each allProfiles as profile}
        <button
          class="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-500/10 transition-smooth {currentProfileName === profile.name ? 'bg-blue-500/10' : ''}"
          onclick={() => selectProfile(profile.name)}
        >
          <div class="w-8 h-8 rounded-lg {typeColors[profile.profileType] || 'bg-gray-500'} flex items-center justify-center shadow-soft">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={iconPaths[profile.profileType] || iconPaths.FixedProfile} />
            </svg>
          </div>
          <span class="flex-1 font-medium text-gray-900 dark:text-white truncate">
            {getDisplayName(profile)}
          </span>
          {#if currentProfileName === profile.name}
            <svg class="w-5 h-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          {/if}
        </button>
      {/each}

      {#if profiles.length === 0}
        <div class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
          No custom profiles yet
        </div>
      {/if}
    {/if}
  </div>
</div>
