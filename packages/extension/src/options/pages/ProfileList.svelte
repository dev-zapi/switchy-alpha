<script lang="ts">
  import { t } from '$lib/i18n.svelte';
  import optionsStore from '$lib/stores/options.svelte';
  import ProfileIcon from '$components/ProfileIcon.svelte';
  import Button from '$components/ui/Button.svelte';
  import type { Profile } from '@anthropic-demo/switchyalpha-pac';

  interface Props {
    onedit?: (profile: Profile) => void;
    oncreate?: () => void;
  }

  let { onedit, oncreate }: Props = $props();

  // Profile type display names
  const profileTypeLabels: Record<string, string> = {
    FixedProfile: 'Proxy',
    PacProfile: 'PAC',
    SwitchProfile: 'Auto Switch',
    RuleListProfile: 'Rule List',
    VirtualProfile: 'Virtual',
  };

  function handleEdit(profile: Profile) {
    onedit?.(profile);
  }

  function handleCreate() {
    oncreate?.();
  }

  async function handleDelete(profile: Profile) {
    if (confirm(`Delete profile "${profile.name}"?`)) {
      optionsStore.deleteProfile(profile.name);
    }
  }

  async function handleApply(profile: Profile) {
    await optionsStore.applyProfile(profile.name);
  }
</script>

<div>
  <div class="flex items-center justify-between mb-6">
    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
      Profiles
    </h2>
    <Button variant="primary" onclick={handleCreate}>
      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      {t('options_newProfile')}
    </Button>
  </div>

  <!-- Built-in profiles -->
  <div class="mb-8">
    <h3 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
      Built-in
    </h3>
    <div class="grid gap-3">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <svg class="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h4 class="font-medium text-gray-900 dark:text-white">{t('profile_direct')}</h4>
            <p class="text-sm text-gray-500 dark:text-gray-400">Direct connection</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onclick={() => optionsStore.applyProfile('direct')}>
          Apply
        </Button>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <svg class="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h4 class="font-medium text-gray-900 dark:text-white">{t('profile_system')}</h4>
            <p class="text-sm text-gray-500 dark:text-gray-400">Use system proxy settings</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onclick={() => optionsStore.applyProfile('system')}>
          Apply
        </Button>
      </div>
    </div>
  </div>

  <!-- Custom profiles -->
  <div>
    <h3 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
      Custom Profiles
    </h3>

    {#if optionsStore.sortedProfiles.length === 0}
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
        <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p class="text-gray-500 dark:text-gray-400 mb-4">No custom profiles yet</p>
        <Button variant="primary" onclick={handleCreate}>
          Create your first profile
        </Button>
      </div>
    {:else}
      <div class="grid gap-3">
        {#each optionsStore.sortedProfiles as profile}
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center justify-between group">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <ProfileIcon {profile} size="md" />
              </div>
              <div>
                <h4 class="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                  {profile.name}
                  {#if optionsStore.currentProfileName === profile.name}
                    <span class="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  {/if}
                </h4>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {profileTypeLabels[profile.profileType] || profile.profileType}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="sm" onclick={() => handleApply(profile)}>
                Apply
              </Button>
              <Button variant="ghost" size="sm" onclick={() => handleEdit(profile)}>
                Edit
              </Button>
              <Button variant="ghost" size="sm" onclick={() => handleDelete(profile)}>
                <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </Button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
