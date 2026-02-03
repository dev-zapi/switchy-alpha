<script lang="ts">
  interface Props {
    value?: string;
    label?: string;
    class?: string;
    onchange?: (color: string) => void;
  }

  let {
    value = $bindable('#5b9bd5'),
    label = '',
    class: className = '',
    onchange,
  }: Props = $props();

  let inputId = $derived(`color-picker-${Math.random().toString(36).slice(2, 11)}`);

  function handleChange(e: Event) {
    const target = e.target as HTMLInputElement;
    value = target.value;
    onchange?.(target.value);
  }
</script>

<div class="color-picker-container {className}">
  {#if label}
    <label for={inputId} class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
      {label}
    </label>
  {/if}

  <div class="flex items-center gap-2">
    <div
      class="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
      style="background-color: {value}"
    >
      <input
        id={inputId}
        type="color"
        {value}
        onchange={handleChange}
        class="w-full h-full opacity-0 cursor-pointer"
        aria-label="Choose color"
      />
    </div>
    <input
      type="text"
      {value}
      onchange={handleChange}
      class="w-24 px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 uppercase"
      placeholder="#000000"
      maxlength="7"
    />
  </div>
</div>
