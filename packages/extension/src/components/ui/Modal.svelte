<script lang="ts">
  import type { Snippet } from 'svelte';

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
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    onclick={handleBackdropClick}
  >
    <div
      class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col {className}"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {#if title}
        <div class="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
          <h2 id="modal-title" class="text-lg font-semibold">{title}</h2>
          <button
            type="button"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
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
        <div class="px-6 py-4 border-t dark:border-gray-700 flex justify-end gap-2">
          {@render footer()}
        </div>
      {/if}
    </div>
  </div>
{/if}
