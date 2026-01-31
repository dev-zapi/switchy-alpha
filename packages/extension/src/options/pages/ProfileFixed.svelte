<script lang="ts">
  import type { Profile, Proxy } from '@anthropic-demo/onemega-pac';
  import { t } from '$lib/i18n';
  import optionsStore from '$lib/stores/options.svelte';
  import Button from '$components/ui/Button.svelte';
  import Input from '$components/ui/Input.svelte';
  import Select from '$components/ui/Select.svelte';

  interface Props {
    profile: Profile;
    onback?: () => void;
  }

  let { profile, onback }: Props = $props();

  // URL schemes that can have proxies
  const urlSchemes = ['', 'http', 'https', 'ftp'];
  const schemeLabels: Record<string, string> = {
    '': t('options_scheme_default'),
    http: 'HTTP',
    https: 'HTTPS',
    ftp: 'FTP',
  };

  // Proxy protocol options
  const proxyProtocols = [
    { value: '', label: '(same as above)' },
    { value: 'http', label: 'HTTP' },
    { value: 'https', label: 'HTTPS' },
    { value: 'socks4', label: 'SOCKS4' },
    { value: 'socks5', label: 'SOCKS5' },
  ];

  // Initialize proxy editors from profile
  type ProxyEditor = {
    scheme: string;
    host: string;
    port: number;
  };

  let proxyEditors = $state<Record<string, ProxyEditor>>({});
  let bypassList = $state('');
  let showAdvanced = $state(false);

  // Initialize from profile
  $effect(() => {
    const editors: Record<string, ProxyEditor> = {};
    
    for (const scheme of urlSchemes) {
      const key = scheme || 'fallbackProxy';
      const proxy = (profile as any)[key === 'fallbackProxy' ? 'fallbackProxy' : `proxyFor${scheme.charAt(0).toUpperCase() + scheme.slice(1)}`] as Proxy | undefined;
      
      editors[scheme] = {
        scheme: proxy?.scheme || (scheme === '' ? 'http' : ''),
        host: proxy?.host || '',
        port: proxy?.port || (scheme === '' ? 8080 : 0),
      };
    }
    
    proxyEditors = editors;
    bypassList = ((profile as any).bypassList || []).join('\n');
  });

  function handleProxyChange(scheme: string) {
    const editor = proxyEditors[scheme];
    if (!editor) return;

    const proxy: Proxy | null = editor.scheme && editor.host ? {
      scheme: editor.scheme as any,
      host: editor.host,
      port: editor.port || 80,
    } : null;

    if (scheme === '') {
      (profile as any).fallbackProxy = proxy;
    } else {
      const key = `proxyFor${scheme.charAt(0).toUpperCase() + scheme.slice(1)}`;
      (profile as any)[key] = proxy;
    }

    optionsStore.setProfile(profile);
  }

  function handleBypassChange() {
    const list = bypassList
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    (profile as any).bypassList = list;
    optionsStore.setProfile(profile);
  }

  function handleBack() {
    onback?.();
  }
</script>

<div class="max-w-4xl">
  <!-- Header -->
  <div class="flex items-center gap-4 mb-6">
    <button
      type="button"
      class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
      onclick={handleBack}
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
    </button>
    <div>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
        {profile.name}
      </h2>
      <p class="text-sm text-gray-500 dark:text-gray-400">Proxy Profile</p>
    </div>
  </div>

  <!-- Proxy Servers -->
  <section class="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
    <div class="px-6 py-4 border-b dark:border-gray-700">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white">
        {t('options_group_proxyServers')}
      </h3>
    </div>
    
    <div class="p-6">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-gray-500 dark:text-gray-400">
              <th class="pb-3 pr-4 font-medium">{t('options_proxy_scheme')}</th>
              <th class="pb-3 pr-4 font-medium">{t('options_proxy_protocol')}</th>
              <th class="pb-3 pr-4 font-medium">{t('options_proxy_server')}</th>
              <th class="pb-3 pr-4 font-medium">{t('options_proxy_port')}</th>
            </tr>
          </thead>
          <tbody class="divide-y dark:divide-gray-700">
            {#each urlSchemes as scheme}
              {#if scheme === '' || showAdvanced}
                <tr>
                  <td class="py-3 pr-4">
                    <span class="text-gray-900 dark:text-white font-medium">
                      {schemeLabels[scheme]}
                    </span>
                  </td>
                  <td class="py-3 pr-4">
                    <select
                      class="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                      bind:value={proxyEditors[scheme].scheme}
                      onchange={() => handleProxyChange(scheme)}
                    >
                      {#each proxyProtocols as proto}
                        {#if scheme === '' || proto.value !== ''}
                          <option value={proto.value}>{proto.label}</option>
                        {/if}
                      {/each}
                    </select>
                  </td>
                  <td class="py-3 pr-4">
                    {#if proxyEditors[scheme].scheme || scheme === ''}
                      <input
                        type="text"
                        class="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        bind:value={proxyEditors[scheme].host}
                        placeholder={scheme === '' ? 'proxy.example.com' : proxyEditors[''].host || ''}
                        disabled={scheme !== '' && !proxyEditors[scheme].scheme}
                        onchange={() => handleProxyChange(scheme)}
                      />
                    {:else}
                      <input
                        type="text"
                        class="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-600"
                        placeholder={proxyEditors[''].host || ''}
                        disabled
                      />
                    {/if}
                  </td>
                  <td class="py-3 pr-4">
                    {#if proxyEditors[scheme].scheme || scheme === ''}
                      <input
                        type="number"
                        class="block w-24 rounded-md border border-gray-300 px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        bind:value={proxyEditors[scheme].port}
                        min="1"
                        max="65535"
                        placeholder={scheme === '' ? '8080' : String(proxyEditors[''].port || '')}
                        disabled={scheme !== '' && !proxyEditors[scheme].scheme}
                        onchange={() => handleProxyChange(scheme)}
                      />
                    {:else}
                      <input
                        type="number"
                        class="block w-24 rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-600"
                        placeholder={String(proxyEditors[''].port || '')}
                        disabled
                      />
                    {/if}
                  </td>
                </tr>
              {/if}
            {/each}
          </tbody>
        </table>
      </div>

      {#if !showAdvanced}
        <button
          type="button"
          class="mt-4 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
          onclick={() => showAdvanced = true}
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
          {t('options_proxy_expand')}
        </button>
      {/if}
    </div>
  </section>

  <!-- Bypass List -->
  <section class="bg-white dark:bg-gray-800 rounded-lg shadow">
    <div class="px-6 py-4 border-b dark:border-gray-700">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white">
        {t('options_group_bypassList')}
      </h3>
    </div>
    
    <div class="p-6">
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">
        {t('options_bypassListHelp')}
      </p>
      <p class="text-sm mb-4">
        <a
          href="https://developer.chrome.com/extensions/proxy#bypass_list"
          target="_blank"
          rel="noopener noreferrer"
          class="text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          {t('options_bypassListHelpLinkText')}
        </a>
      </p>
      <textarea
        class="w-full h-48 font-mono text-sm rounded-md border border-gray-300 px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        bind:value={bypassList}
        onchange={handleBypassChange}
        placeholder="localhost&#10;127.0.0.1&#10;*.local"
      ></textarea>
    </div>
  </section>
</div>
