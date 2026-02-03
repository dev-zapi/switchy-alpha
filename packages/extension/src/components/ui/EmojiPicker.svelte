<script lang="ts">
  import { profileEmojis } from '@anthropic-demo/switchyalpha-pac';

  interface Props {
    value?: string;
    label?: string;
    class?: string;
    onchange?: (emoji: string) => void;
  }

  let {
    value = $bindable(''),
    label = '',
    class: className = '',
    onchange,
  }: Props = $props();

  let isOpen = $state(false);
  let buttonId = $derived(`emoji-picker-${Math.random().toString(36).slice(2, 11)}`);

  function selectEmoji(emoji: string) {
    value = emoji;
    isOpen = false;
    onchange?.(emoji);
  }

  function handleKeyDown(e: KeyboardEvent, emoji: string) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      selectEmoji(emoji);
    }
  }

  function togglePicker() {
    isOpen = !isOpen;
  }

  function handleClickOutside(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest('.emoji-picker-container')) {
      isOpen = false;
    }
  }
</script>

<svelte:window onclick={handleClickOutside} />

<div class="emoji-picker-container relative {className}">
  {#if label}
    <label for={buttonId} class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
      {label}
    </label>
  {/if}

  <button
    id={buttonId}
    type="button"
    onclick={togglePicker}
    class="flex items-center justify-center w-12 h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-smooth text-xl"
    aria-label="Select emoji"
    aria-expanded={isOpen}
  >
    {value || '?'}
  </button>

  {#if isOpen}
    <div
      class="absolute z-50 mt-1 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 grid grid-cols-6 gap-1 w-52"
      role="listbox"
    >
      {#each profileEmojis as emoji}
        <button
          type="button"
          onclick={() => selectEmoji(emoji)}
          onkeydown={(e) => handleKeyDown(e, emoji)}
          class="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-lg transition-smooth {value === emoji ? 'bg-blue-100 dark:bg-blue-900/50 ring-2 ring-blue-500' : ''}"
          role="option"
          aria-selected={value === emoji}
        >
          {emoji}
        </button>
      {/each}
    </div>
  {/if}
</div>
