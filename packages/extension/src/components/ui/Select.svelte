<script lang="ts">
  interface Option {
    value: string;
    label: string;
    group?: string;
  }

  interface Props {
    value?: string;
    options: Option[];
    placeholder?: string;
    disabled?: boolean;
    class?: string;
    onchange?: (e: Event) => void;
  }

  let {
    value = $bindable(''),
    options,
    placeholder = '',
    disabled = false,
    class: className = '',
    onchange,
  }: Props = $props();

  const baseClasses =
    'block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100';

  const classes = $derived(`${baseClasses} ${className}`);

  // Group options if they have group property
  const groupedOptions = $derived(() => {
    const groups = new Map<string, Option[]>();
    const ungrouped: Option[] = [];

    for (const opt of options) {
      if (opt.group) {
        if (!groups.has(opt.group)) {
          groups.set(opt.group, []);
        }
        groups.get(opt.group)!.push(opt);
      } else {
        ungrouped.push(opt);
      }
    }

    return { groups, ungrouped };
  });
</script>

<select bind:value {disabled} class={classes} onchange={onchange}>
  {#if placeholder}
    <option value="" disabled>{placeholder}</option>
  {/if}

  {#each groupedOptions().ungrouped as opt}
    <option value={opt.value}>{opt.label}</option>
  {/each}

  {#each [...groupedOptions().groups.entries()] as [groupName, groupOptions]}
    <optgroup label={groupName}>
      {#each groupOptions as opt}
        <option value={opt.value}>{opt.label}</option>
      {/each}
    </optgroup>
  {/each}
</select>
