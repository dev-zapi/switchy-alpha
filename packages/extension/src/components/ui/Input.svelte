<script lang="ts">
  interface Props {
    type?: 'text' | 'number' | 'url' | 'email' | 'password';
    value?: string | number;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    min?: number;
    max?: number;
    class?: string;
    oninput?: (e: Event) => void;
    onchange?: (e: Event) => void;
  }

  let {
    type = 'text',
    value = $bindable(''),
    placeholder = '',
    disabled = false,
    required = false,
    min,
    max,
    class: className = '',
    oninput,
    onchange,
  }: Props = $props();

  const baseClasses =
    'block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100';

  const classes = $derived(`${baseClasses} ${className}`);
</script>

<input
  {type}
  bind:value
  {placeholder}
  {disabled}
  {required}
  {min}
  {max}
  class={classes}
  oninput={oninput}
  onchange={onchange}
/>
