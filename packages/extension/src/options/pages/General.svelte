<script lang="ts">
  import { t } from '$lib/i18n.svelte';
  import optionsStore from '$lib/stores/options.svelte';
  import ProfileSelect from '$components/ProfileSelect.svelte';
  import Input from '$components/ui/Input.svelte';

  let startupProfile = $state(optionsStore.get('-startupProfileName') || '');
  let downloadInterval = $state(optionsStore.get('-downloadInterval') || 1440);
  let refreshOnChange = $state(optionsStore.get('-refreshOnProfileChange') || false);
  let enableQuickSwitch = $state(optionsStore.get('-enableQuickSwitch') || false);
  let showInspectMenu = $state(optionsStore.get('-showInspectMenu') ?? true);
  let revertProxyChanges = $state(optionsStore.get('-revertProxyChanges') || false);

  function handleStartupChange(name: string) {
    startupProfile = name;
    optionsStore.set({ '-startupProfileName': name });
  }

  function handleDownloadIntervalChange() {
    optionsStore.set({ '-downloadInterval': downloadInterval });
  }

  function handleCheckboxChange(key: keyof typeof optionsStore.options, value: boolean) {
    optionsStore.set({ [key]: value } as any);
  }
</script>

<div class="max-w-2xl">
  <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
    {t('nav_general')}
  </h2>

  <div class="space-y-6">
    <!-- Startup Profile -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {t('options_startupProfile')}
      </h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {t('options_startupProfileHelp')}
      </p>
      <ProfileSelect
        profiles={optionsStore.profiles}
        value={startupProfile}
        onchange={handleStartupChange}
        class="w-64"
      />
    </div>

    <!-- Download Interval -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {t('options_downloadInterval')}
      </h3>
      <div class="flex items-center gap-2">
        <Input
          type="number"
          bind:value={downloadInterval}
          min={0}
          class="w-32"
          onchange={handleDownloadIntervalChange}
        />
        <span class="text-sm text-gray-500 dark:text-gray-400">minutes (0 = disabled)</span>
      </div>
    </div>

    <!-- Toggles -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        Options
      </h3>

      <label class="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          bind:checked={enableQuickSwitch}
          onchange={() => handleCheckboxChange('-enableQuickSwitch', enableQuickSwitch)}
          class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
        />
        <span class="text-sm text-gray-700 dark:text-gray-300">
          {t('options_enableQuickSwitch')}
        </span>
      </label>

      <label class="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          bind:checked={refreshOnChange}
          onchange={() => handleCheckboxChange('-refreshOnProfileChange', refreshOnChange)}
          class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
        />
        <span class="text-sm text-gray-700 dark:text-gray-300">
          {t('options_refreshOnProfileChange')}
        </span>
      </label>

      <label class="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          bind:checked={showInspectMenu}
          onchange={() => handleCheckboxChange('-showInspectMenu', showInspectMenu)}
          class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
        />
        <span class="text-sm text-gray-700 dark:text-gray-300">
          {t('options_showInspectMenu')}
        </span>
      </label>

      <label class="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          bind:checked={revertProxyChanges}
          onchange={() => handleCheckboxChange('-revertProxyChanges', revertProxyChanges)}
          class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
        />
        <span class="text-sm text-gray-700 dark:text-gray-300">
          {t('options_revertProxyChanges')}
        </span>
      </label>
    </div>
  </div>
</div>
