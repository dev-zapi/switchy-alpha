<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'ghost' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    class?: string;
    onclick?: (e: MouseEvent) => void;
    children: Snippet;
  }

  let {
    variant = 'secondary',
    size = 'md',
    disabled = false,
    type = 'button',
    class: className = '',
    onclick,
    children,
  }: Props = $props();

  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-lg transition-smooth disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses: Record<string, string> = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-soft hover:shadow-soft-lg',
    secondary: 'bg-gray-100/80 text-gray-700 hover:bg-gray-200/80 dark:bg-gray-700/80 dark:text-gray-200 dark:hover:bg-gray-600/80',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-soft',
    warning: 'bg-amber-600 text-white hover:bg-amber-700 shadow-soft',
    ghost: 'bg-transparent text-gray-700 dark:text-gray-200 hover:bg-gray-500/10 dark:hover:bg-gray-500/10',
    outline: 'border border-gray-300 dark:border-gray-600 bg-transparent hover:bg-gray-500/10 text-gray-700 dark:text-gray-300',
  };

  const sizeClasses: Record<string, string> = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-base',
  };

  const classes = $derived(`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`);
</script>

<button {type} {disabled} class={classes} onclick={onclick}>
  {@render children()}
</button>
