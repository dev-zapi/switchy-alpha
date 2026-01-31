<script lang="ts">
  import type { Profile } from '@anthropic-demo/onemega-pac';
  import { t } from '$lib/i18n';

  interface Props {
    profile: Profile;
    size?: 'sm' | 'md' | 'lg';
    class?: string;
  }

  let { profile, size = 'md', class: className = '' }: Props = $props();

  // Profile type icons (using Lucide-style SVG paths)
  const iconPaths: Record<string, string> = {
    FixedProfile: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9',
    PacProfile: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
    SwitchProfile: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
    RuleListProfile: 'M4 6h16M4 10h16M4 14h16M4 18h16',
    VirtualProfile: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
    DirectProfile: 'M13 10V3L4 14h7v7l9-11h-7z',
    SystemProfile: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  };

  // Profile type colors
  const typeColors: Record<string, string> = {
    FixedProfile: 'text-blue-600 dark:text-blue-400',
    PacProfile: 'text-purple-600 dark:text-purple-400',
    SwitchProfile: 'text-green-600 dark:text-green-400',
    RuleListProfile: 'text-orange-600 dark:text-orange-400',
    VirtualProfile: 'text-pink-600 dark:text-pink-400',
    DirectProfile: 'text-gray-600 dark:text-gray-400',
    SystemProfile: 'text-gray-500 dark:text-gray-500',
  };

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const iconPath = $derived(iconPaths[profile.profileType] || iconPaths.FixedProfile);
  const colorClass = $derived(typeColors[profile.profileType] || typeColors.FixedProfile);
</script>

<svg
  class="{sizeClasses[size]} {colorClass} {className}"
  fill="none"
  stroke="currentColor"
  viewBox="0 0 24 24"
  aria-label={t(`profile_${profile.profileType}`)}
>
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={iconPath} />
</svg>
