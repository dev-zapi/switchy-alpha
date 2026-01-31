<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    type?: 'info' | 'success' | 'warning' | 'error';
    dismissible?: boolean;
    class?: string;
    ondismiss?: () => void;
    children: Snippet;
  }

  let {
    type = 'info',
    dismissible = false,
    class: className = '',
    ondismiss,
    children,
  }: Props = $props();

  let visible = $state(true);

  const typeClasses = {
    info: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
    success: 'bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800',
    error: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
  };

  const iconPaths = {
    info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    error: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
  };

  function dismiss() {
    visible = false;
    ondismiss?.();
  }
</script>

{#if visible}
  <div
    class="flex items-start gap-3 px-4 py-3 rounded-md border {typeClasses[type]} {className}"
    role="alert"
  >
    <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={iconPaths[type]} />
    </svg>

    <div class="flex-1 text-sm">
      {@render children()}
    </div>

    {#if dismissible}
      <button
        type="button"
        class="flex-shrink-0 hover:opacity-70"
        onclick={dismiss}
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    {/if}
  </div>
{/if}
