<script lang="ts">
  import type { Profile } from '@dev-zapi/switchyalpha-pac';
  import ProfileIcon from './ProfileIcon.svelte';
  import { t } from '$lib/i18n.svelte';

  interface Props {
    profiles: Profile[];
    value?: string;
    placeholder?: string;
    disabled?: boolean;
    excludeTypes?: string[];
    excludeNames?: string[];
    showBuiltin?: boolean;
    class?: string;
    onchange?: (name: string) => void;
  }

  let {
    profiles,
    value = $bindable(''),
    placeholder = '',
    disabled = false,
    excludeTypes = [],
    excludeNames = [],
    showBuiltin = true,
    class: className = '',
    onchange,
  }: Props = $props();

  // Built-in profiles
  const builtinProfiles: Profile[] = [
    { name: 'direct', profileType: 'DirectProfile' } as Profile,
    { name: 'system', profileType: 'SystemProfile' } as Profile,
  ];

  // Filter and sort profiles
  const filteredProfiles = $derived(() => {
    let result = profiles.filter((p) => {
      if (excludeTypes.includes(p.profileType)) return false;
      if (excludeNames.includes(p.name)) return false;
      return true;
    });

    // Sort by name
    result.sort((a, b) => a.name.localeCompare(b.name));

    return result;
  });

  // Get display name for a profile
  function getDisplayName(profile: Profile): string {
    if (profile.profileType === 'DirectProfile') {
      return t('profile_direct');
    }
    if (profile.profileType === 'SystemProfile') {
      return t('profile_system');
    }
    return profile.name;
  }

  // Find current profile for display
  const currentProfile = $derived(() => {
    if (!value) return null;
    const all = showBuiltin ? [...builtinProfiles, ...filteredProfiles()] : filteredProfiles();
    return all.find((p) => p.name === value) || null;
  });

  function handleChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    value = target.value;
    onchange?.(value);
  }
</script>

<div class="relative inline-flex items-center {className}">
  {#if currentProfile()}
    <div class="absolute left-2 pointer-events-none">
      <ProfileIcon profile={currentProfile()!} size="sm" />
    </div>
  {/if}

  <select
    class="block w-full rounded-md border border-gray-300 pl-8 pr-3 py-2 text-sm shadow-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:disabled:text-gray-400 appearance-none bg-no-repeat bg-right"
    style="background-image: url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 24 24%27 stroke=%27%236b7280%27%3E%3Cpath stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%272%27 d=%27M19 9l-7 7-7-7%27/%3E%3C/svg%3E'); background-size: 1.25rem; background-position: right 0.5rem center;"
    {disabled}
    onchange={handleChange}
  >
    {#if placeholder}
      <option value="" disabled selected={!value}>{placeholder}</option>
    {/if}

    {#if showBuiltin}
      <optgroup label="Built-in">
        {#each builtinProfiles as profile}
          <option value={profile.name} selected={value === profile.name}>
            {getDisplayName(profile)}
          </option>
        {/each}
      </optgroup>
    {/if}

    {#if filteredProfiles().length > 0}
      <optgroup label="Custom">
        {#each filteredProfiles() as profile}
          <option value={profile.name} selected={value === profile.name}>
            {getDisplayName(profile)}
          </option>
        {/each}
      </optgroup>
    {/if}
  </select>
</div>
