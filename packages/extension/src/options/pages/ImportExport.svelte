<script lang="ts">
  import { t } from '$lib/i18n.svelte';
  import optionsStore from '$lib/stores/options.svelte';
  import Button from '$components/ui/Button.svelte';
  import Alert from '$components/ui/Alert.svelte';

  let importError = $state<string | null>(null);
  let importSuccess = $state(false);
  let exportSuccess = $state(false);

  function handleExport() {
    try {
      const json = optionsStore.options
        ? JSON.stringify(optionsStore.options, null, 2)
        : '{}';

      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zeroomega-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      exportSuccess = true;
      setTimeout(() => (exportSuccess = false), 3000);
    } catch (e) {
      console.error('Export failed:', e);
    }
  }

  function handleImportClick() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.bak';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const options = JSON.parse(text);

        // Validate basic structure
        if (!options['-schemaVersion']) {
          throw new Error('Invalid backup file: missing schema version');
        }

        // Import via store
        if (typeof chrome !== 'undefined' && chrome.runtime) {
          await chrome.runtime.sendMessage({
            action: 'importOptions',
            options,
          });
        }

        // Reload
        await optionsStore.init();

        importSuccess = true;
        importError = null;
        setTimeout(() => (importSuccess = false), 3000);
      } catch (e) {
        importError = e instanceof Error ? e.message : 'Import failed';
        importSuccess = false;
      }
    };
    input.click();
  }

  async function handleReset() {
    if (!confirm('Are you sure you want to reset all options to defaults? This cannot be undone.')) {
      return;
    }

    try {
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        await chrome.runtime.sendMessage({ action: 'resetOptions' });
      }
      await optionsStore.init();
    } catch (e) {
      console.error('Reset failed:', e);
    }
  }
</script>

<div class="max-w-2xl">
  <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
    {t('nav_importExport')}
  </h2>

  {#if importError}
    <div class="mb-6">
      <Alert type="error" dismissible ondismiss={() => (importError = null)}>
        {importError}
      </Alert>
    </div>
  {/if}

  {#if importSuccess}
    <div class="mb-6">
      <Alert type="success" dismissible ondismiss={() => (importSuccess = false)}>
        Options imported successfully!
      </Alert>
    </div>
  {/if}

  {#if exportSuccess}
    <div class="mb-6">
      <Alert type="success" dismissible ondismiss={() => (exportSuccess = false)}>
        Backup file downloaded!
      </Alert>
    </div>
  {/if}

  <!-- Export -->
  <section class="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
    <div class="px-6 py-4 border-b dark:border-gray-700">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white">
        {t('options_exportOptions')}
      </h3>
    </div>
    <div class="p-6">
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {t('options_exportHelp')}
      </p>
      <Button variant="primary" onclick={handleExport}>
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        {t('options_makeBackup')}
      </Button>
    </div>
  </section>

  <!-- Import -->
  <section class="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
    <div class="px-6 py-4 border-b dark:border-gray-700">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white">
        {t('options_importOptions')}
      </h3>
    </div>
    <div class="p-6">
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {t('options_importHelp')}
      </p>
      <Button variant="secondary" onclick={handleImportClick}>
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        {t('options_restoreLocal')}
      </Button>
    </div>
  </section>

  <!-- Reset -->
  <section class="bg-white dark:bg-gray-800 rounded-lg shadow border-2 border-red-200 dark:border-red-900">
    <div class="px-6 py-4 border-b border-red-200 dark:border-red-900">
      <h3 class="text-lg font-medium text-red-700 dark:text-red-400">
        Danger Zone
      </h3>
    </div>
    <div class="p-6">
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Reset all options to their default values. This will delete all profiles and settings.
      </p>
      <Button variant="danger" onclick={handleReset}>
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        Reset to Defaults
      </Button>
    </div>
  </section>
</div>
