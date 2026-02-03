<script lang="ts">
  import Button from '$components/ui/Button.svelte';
  import Input from '$components/ui/Input.svelte';
  import { t } from '$lib/i18n.svelte';

  interface Props {
    onSave: (profile: { name: string; profileType: string }) => void;
    onCancel: () => void;
  }

  let { onSave, onCancel }: Props = $props();

  let name = $state('');
  let profileType = $state('FixedProfile');
  let nameError = $state('');

  const profileTypes = [
    { value: 'FixedProfile', label: 'Proxy Profile', description: 'Use a specific proxy server' },
    { value: 'SwitchProfile', label: 'Switch Profile', description: 'Switch between profiles based on rules' },
    { value: 'PacProfile', label: 'PAC Script', description: 'Use a PAC (Proxy Auto-Config) script' },
    { value: 'RuleListProfile', label: 'Rule List', description: 'Use an online rule list (e.g., GFWList)' },
  ];

  function validateName() {
    if (!name.trim()) {
      nameError = 'Profile name is required';
      return false;
    }
    if (name.includes('+') || name.includes('-')) {
      nameError = 'Profile name cannot contain + or -';
      return false;
    }
    nameError = '';
    return true;
  }

  function handleSubmit() {
    if (!validateName()) return;
    
    onSave({
      name: name.trim(),
      profileType
    });
  }
</script>

<div class="bg-white dark:bg-gray-800 rounded-lg shadow">
  <!-- Header -->
  <div class="flex items-center gap-4 p-6 border-b border-gray-200 dark:border-gray-700">
    <button
      type="button"
      class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-colors"
      onclick={onCancel}
      aria-label="Go back"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
    </button>
    <h2 class="text-lg font-medium text-gray-900 dark:text-white">
      {t('options_newProfile')}
    </h2>
  </div>

  <!-- Form -->
  <div class="p-6 space-y-6">
    <!-- Profile Name -->
    <div>
      <Input
        label={t('options_newProfileName')}
        bind:value={name}
        placeholder="Enter profile name"
        error={nameError}
        oninput={() => nameError = ''}
      />
    </div>

    <!-- Profile Type -->
    <fieldset>
      <legend class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        {t('options_profileType')}
      </legend>
      <div class="space-y-3">
        {#each profileTypes as type}
          <label class="flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors
            {profileType === type.value 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'}">
            <input
              type="radio"
              name="profileType"
              value={type.value}
              bind:group={profileType}
              class="mt-1"
            />
            <div>
              <div class="font-medium text-gray-900 dark:text-white">
                {type.label}
              </div>
              <div class="text-sm text-gray-500 dark:text-gray-400">
                {type.description}
              </div>
            </div>
          </label>
        {/each}
      </div>
    </fieldset>

    <!-- Actions -->
    <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
      <Button variant="outline" onclick={onCancel}>
        {t('dialog_cancel')}
      </Button>
      <Button variant="primary" onclick={handleSubmit}>
        {t('dialog_save')}
      </Button>
    </div>
  </div>
</div>
