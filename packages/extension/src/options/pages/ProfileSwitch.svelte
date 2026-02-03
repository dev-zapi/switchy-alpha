<script lang="ts">
  import type { Profile, Condition, SwitchRule } from '@anthropic-demo/switchyalpha-pac';
  import { t } from '$lib/i18n.svelte';
  import optionsStore from '$lib/stores/options.svelte';
  import Button from '$components/ui/Button.svelte';
  import ProfileSelect from '$components/ProfileSelect.svelte';
  import EmojiPicker from '$components/ui/EmojiPicker.svelte';
  import ColorPicker from '$components/ui/ColorPicker.svelte';

  interface Props {
    profile: Profile;
    onback?: () => void;
  }

  let { profile, onback }: Props = $props();

  // Profile appearance state
  let profileIcon = $derived(profile.icon || '');
  let profileColor = $derived(profile.color || '#ed7d31');

  function handleIconChange(emoji: string) {
    profile.icon = emoji;
    optionsStore.setProfile(profile);
  }

  function handleColorChange(color: string) {
    profile.color = color;
    optionsStore.setProfile(profile);
  }

  // Condition types grouped by category
  const conditionTypes = [
    { type: 'HostWildcardCondition', group: 'Host' },
    { type: 'HostRegexCondition', group: 'Host' },
    { type: 'HostLevelsCondition', group: 'Host' },
    { type: 'UrlWildcardCondition', group: 'URL' },
    { type: 'UrlRegexCondition', group: 'URL' },
    { type: 'KeywordCondition', group: 'URL' },
    { type: 'IpCondition', group: 'Special' },
    { type: 'BypassCondition', group: 'Special' },
    { type: 'WeekdayCondition', group: 'Time' },
    { type: 'TimeCondition', group: 'Time' },
  ];

  // Get rules from profile
  let rules = $state<SwitchRule[]>([]);
  let defaultProfileName = $state('direct');

  $effect(() => {
    const switchProfile = profile as any;
    rules = [...(switchProfile.rules || [])];
    defaultProfileName = switchProfile.defaultProfileName || 'direct';
  });

  function addRule() {
    const newRule: SwitchRule = {
      condition: {
        conditionType: 'HostWildcardCondition',
        pattern: '*.example.com',
      } as Condition,
      profileName: 'direct',
    };
    rules = [...rules, newRule];
    saveRules();
  }

  function removeRule(index: number) {
    rules = rules.filter((_, i) => i !== index);
    saveRules();
  }

  function cloneRule(index: number) {
    const clone = JSON.parse(JSON.stringify(rules[index]));
    rules = [...rules.slice(0, index + 1), clone, ...rules.slice(index + 1)];
    saveRules();
  }

  function moveRule(index: number, direction: 'up' | 'down') {
    if (direction === 'up' && index > 0) {
      [rules[index], rules[index - 1]] = [rules[index - 1], rules[index]];
    } else if (direction === 'down' && index < rules.length - 1) {
      [rules[index], rules[index + 1]] = [rules[index + 1], rules[index]];
    }
    rules = [...rules];
    saveRules();
  }

  function updateConditionType(index: number, type: string) {
    const rule = rules[index];
    rule.condition = {
      conditionType: type,
      pattern: '',
    } as Condition;

    // Set defaults for special condition types
    if (type === 'HostLevelsCondition') {
      (rule.condition as any).minValue = 1;
      (rule.condition as any).maxValue = 10;
    } else if (type === 'TimeCondition') {
      (rule.condition as any).startHour = 9;
      (rule.condition as any).endHour = 17;
    }

    rules = [...rules];
    saveRules();
  }

  function updateConditionPattern(index: number, pattern: string) {
    rules[index].condition.pattern = pattern;
    rules = [...rules];
    saveRules();
  }

  function updateRuleProfile(index: number, profileName: string) {
    rules[index].profileName = profileName;
    rules = [...rules];
    saveRules();
  }

  function updateDefaultProfile(name: string) {
    defaultProfileName = name;
    (profile as any).defaultProfileName = name;
    optionsStore.setProfile(profile);
  }

  function saveRules() {
    (profile as any).rules = rules;
    optionsStore.setProfile(profile);
  }

  function handleBack() {
    onback?.();
  }

  // Get condition input placeholder
  function getPlaceholder(type: string): string {
    switch (type) {
      case 'HostWildcardCondition':
        return '*.example.com';
      case 'HostRegexCondition':
        return '^.*\\.example\\.com$';
      case 'UrlWildcardCondition':
        return '*://example.com/*';
      case 'UrlRegexCondition':
        return '^https?://.*\\.example\\.com/.*$';
      case 'KeywordCondition':
        return 'keyword';
      case 'IpCondition':
        return '192.168.0.0/16';
      case 'BypassCondition':
        return '<local>';
      default:
        return '';
    }
  }

  // Check if condition type needs special input
  function isSpecialCondition(type: string): boolean {
    return ['HostLevelsCondition', 'TimeCondition', 'WeekdayCondition'].includes(type);
  }
</script>

<div class="max-w-full">
  <!-- Header -->
  <div class="flex items-center gap-4 mb-6">
    <button
      type="button"
      class="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-smooth"
      onclick={handleBack}
      aria-label="Back"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
    </button>
    <div class="flex-1">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
        {profile.name}
      </h2>
      <p class="text-sm text-gray-500 dark:text-gray-400">Auto Switch Profile</p>
    </div>
    <div class="flex items-center gap-3">
      <EmojiPicker bind:value={profileIcon} onchange={handleIconChange} />
      <ColorPicker bind:value={profileColor} onchange={handleColorChange} />
    </div>
  </div>

  <!-- Switch Rules -->
  <section class="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
    <div class="px-6 py-4 border-b dark:border-gray-700 flex items-center justify-between">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white">
        {t('options_group_switchRules')}
      </h3>
      <Button variant="primary" size="sm" onclick={addRule}>
        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        {t('options_addCondition')}
      </Button>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
            <th class="px-4 py-3 font-medium w-20">{t('options_sort')}</th>
            <th class="px-4 py-3 font-medium w-48">{t('options_conditionType')}</th>
            <th class="px-4 py-3 font-medium">{t('options_conditionDetails')}</th>
            <th class="px-4 py-3 font-medium w-48">{t('options_resultProfile')}</th>
            <th class="px-4 py-3 font-medium w-32">{t('options_conditionActions')}</th>
          </tr>
        </thead>
        <tbody class="divide-y dark:divide-gray-700">
          {#each rules as rule, index}
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <!-- Sort -->
              <td class="px-4 py-3">
                <div class="flex flex-col gap-1">
                  <button
                    type="button"
                    class="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    onclick={() => moveRule(index, 'up')}
                    disabled={index === 0}
                    aria-label="Move up"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    onclick={() => moveRule(index, 'down')}
                    disabled={index === rules.length - 1}
                    aria-label="Move down"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </td>

              <!-- Condition Type -->
              <td class="px-4 py-3">
                <select
                  class="block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  value={rule.condition.conditionType}
                  onchange={(e) => updateConditionType(index, (e.target as HTMLSelectElement).value)}
                >
                  {#each conditionTypes as ct}
                    <option value={ct.type}>
                      {t(`condition_${ct.type}`)}
                    </option>
                  {/each}
                </select>
              </td>

              <!-- Condition Details -->
              <td class="px-4 py-3">
                {#if rule.condition.conditionType === 'HostLevelsCondition'}
                  <div class="flex items-center gap-2">
                    <input
                      type="number"
                      class="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600"
                      value={(rule.condition as any).minValue || 1}
                      min="1"
                      max="99"
                      onchange={(e) => {
                        (rule.condition as any).minValue = parseInt((e.target as HTMLInputElement).value);
                        saveRules();
                      }}
                    />
                    <span class="text-gray-500">{t('options_hostLevelsBetween')}</span>
                    <input
                      type="number"
                      class="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600"
                      value={(rule.condition as any).maxValue || 10}
                      min="1"
                      max="99"
                      onchange={(e) => {
                        (rule.condition as any).maxValue = parseInt((e.target as HTMLInputElement).value);
                        saveRules();
                      }}
                    />
                  </div>
                {:else if rule.condition.conditionType === 'TimeCondition'}
                  <div class="flex items-center gap-2">
                    <input
                      type="number"
                      class="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600"
                      value={(rule.condition as any).startHour || 0}
                      min="0"
                      max="23"
                      onchange={(e) => {
                        (rule.condition as any).startHour = parseInt((e.target as HTMLInputElement).value);
                        saveRules();
                      }}
                    />
                    <span class="text-gray-500">{t('options_hourBetween')}</span>
                    <input
                      type="number"
                      class="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600"
                      value={(rule.condition as any).endHour || 23}
                      min="0"
                      max="23"
                      onchange={(e) => {
                        (rule.condition as any).endHour = parseInt((e.target as HTMLInputElement).value);
                        saveRules();
                      }}
                    />
                  </div>
                {:else if rule.condition.conditionType === 'WeekdayCondition'}
                  <div class="flex gap-1">
                    {#each ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as day, dayIndex}
                      <label class="inline-flex items-center">
                        <input
                          type="checkbox"
                          class="rounded border-gray-300 text-blue-600"
                          checked={((rule.condition as any).days || []).includes(dayIndex)}
                          onchange={(e) => {
                            const days = (rule.condition as any).days || [];
                            if ((e.target as HTMLInputElement).checked) {
                              (rule.condition as any).days = [...days, dayIndex].sort();
                            } else {
                              (rule.condition as any).days = days.filter((d: number) => d !== dayIndex);
                            }
                            saveRules();
                          }}
                        />
                        <span class="ml-1 text-xs">{day}</span>
                      </label>
                    {/each}
                  </div>
                {:else}
                  <input
                    type="text"
                    class="block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                    value={rule.condition.pattern || ''}
                    placeholder={getPlaceholder(rule.condition.conditionType)}
                    oninput={(e) => updateConditionPattern(index, (e.target as HTMLInputElement).value)}
                  />
                {/if}
              </td>

              <!-- Result Profile -->
              <td class="px-4 py-3">
                <ProfileSelect
                  profiles={optionsStore.profiles}
                  value={rule.profileName}
                  excludeNames={[profile.name]}
                  onchange={(name) => updateRuleProfile(index, name)}
                  class="w-full"
                />
              </td>

              <!-- Actions -->
              <td class="px-4 py-3">
                <div class="flex gap-1">
                  <button
                    type="button"
                    class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                    onclick={() => cloneRule(index)}
                    title={t('options_cloneRule')}
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                    onclick={() => removeRule(index)}
                    title={t('options_deleteRule')}
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          {/each}

          {#if rules.length === 0}
            <tr>
              <td colspan="5" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                No rules yet. Click "Add condition" to create one.
              </td>
            </tr>
          {/if}
        </tbody>
      </table>
    </div>

    <!-- Default Profile -->
    <div class="px-6 py-4 border-t dark:border-gray-700 flex items-center gap-4">
      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
        {t('options_switchDefaultProfile')}:
      </span>
      <ProfileSelect
        profiles={optionsStore.profiles}
        value={defaultProfileName}
        excludeNames={[profile.name]}
        onchange={updateDefaultProfile}
        class="w-48"
      />
      <span class="text-sm text-gray-500 dark:text-gray-400">
        (used when no rules match)
      </span>
    </div>
  </section>
</div>
