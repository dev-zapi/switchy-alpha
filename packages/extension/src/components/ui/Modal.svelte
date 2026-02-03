<script lang="ts">
  import type { Snippet } from 'svelte';
  import { fly, fade } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';

  interface Props {
    open?: boolean;
    title?: string;
    class?: string;
    onclose?: () => void;
    children: Snippet;
    footer?: Snippet;
  }

  let {
    open = $bindable(false),
    title = '',
    class: className = '',
    onclose,
    children,
    footer,
  }: Props = $props();

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      open = false;
      onclose?.();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      open = false;
      onclose?.();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
    onclick={handleBackdropClick}
    transition:fade={{ duration: 200, easing: cubicOut }}
  >
    <div
      class="glass dark:glass-dark rounded-xl shadow-soft-lg max-w-lg w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col {className}"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      transition:fly={{ y: 20, duration: 300, easing: cubicOut }}
    >
      {#if title}
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50">
          <h2 id="modal-title" class="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
          <button
            type="button"
            class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-500/10 rounded-lg transition-smooth"
            onclick={() => {
              open = false;
              onclose?.();
            }}
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      {/if}

      <div class="px-6 py-4 overflow-y-auto flex-1">
        {@render children()}
      </div>

      {#if footer}
        <div class="px-6 py-4 border-t border-gray-200/50 dark:border-gray-700/50 flex justify-end gap-2">
          {@render footer()}
        </div>
      {/if}
    </div>
  </div>
{/if}
