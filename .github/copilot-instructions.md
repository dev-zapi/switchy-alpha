# Copilot Instructions for ZeroOmega

## Overview

ZeroOmega is a modern browser extension for proxy management. Built with TypeScript, Svelte 5, and Vite.

## Quick Reference

```bash
pnpm install              # Install dependencies
pnpm -r test              # Run all tests (84 tests)
cd packages/extension && pnpm build   # Build extension
```

## Project Structure

```
packages/
├── pac/           # PAC script generation (TypeScript library)
│   ├── src/
│   │   ├── types.ts        # All type definitions
│   │   ├── conditions.ts   # 12 condition types for URL matching
│   │   ├── profiles.ts     # Profile management logic
│   │   ├── rule-list.ts    # AutoProxy/Switchy format parsing
│   │   ├── utils.ts        # General utilities
│   │   └── shexp-utils.ts  # Shell expression matching
│   └── tests/              # 45 tests
│
├── core/          # Options management (TypeScript library)
│   ├── src/
│   │   ├── options.ts        # Profile CRUD operations
│   │   ├── storage.ts        # Abstract Storage interface
│   │   ├── browser-storage.ts # Chrome storage implementation
│   │   ├── log.ts            # Logging utility
│   │   └── errors.ts         # Custom error classes
│   └── tests/                # 39 tests
│
└── extension/     # Browser extension (Svelte 5)
    ├── src/
    │   ├── background/       # Service worker (proxy API)
    │   ├── popup/            # Quick profile switch UI
    │   ├── options/          # Settings pages
    │   │   └── pages/        # ProfileList, ProfileFixed, ProfileSwitch, etc.
    │   ├── components/       # Reusable UI (Button, Input, Modal, etc.)
    │   └── lib/
    │       ├── stores/       # Svelte 5 runes-based state
    │       └── i18n.ts       # Internationalization
    ├── manifest.json         # Chrome extension manifest (MV3)
    └── vite.config.ts        # Vite + @crxjs/vite-plugin
```

## Tech Stack

| Category | Technology |
|----------|------------|
| Language | TypeScript |
| UI | Svelte 5 (runes API) |
| Build | Vite + @crxjs/vite-plugin |
| CSS | Tailwind CSS v4 |
| Testing | Vitest |
| Package Manager | pnpm workspaces |

## Svelte 5 Conventions

### Runes API (Required)

```typescript
// State
let count = $state(0);

// Derived (computed) values
let doubled = $derived(count * 2);

// Side effects
$effect(() => {
  console.log('count changed:', count);
});

// Component props
interface Props {
  value: string;
  onChange?: (v: string) => void;
}
let { value, onChange }: Props = $props();

// Two-way binding
let { value = $bindable() }: Props = $props();
```

### Component Patterns

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';
  
  interface Props {
    title: string;
    children: Snippet;
  }
  let { title, children }: Props = $props();
</script>

<div>
  <h1>{title}</h1>
  {@render children()}
</div>
```

### Key Rules

- Use `$props()` with TypeScript interface for all component props
- Use `$derived()` for any reactive computed values from props
- Use `{@render children()}` instead of `<slot>`
- Event handlers: `onclick` not `on:click`

## Profile Types

| Type | Description |
|------|-------------|
| `DirectProfile` | No proxy (DIRECT connection) |
| `SystemProfile` | Use system proxy settings |
| `FixedProfile` | Static proxy server with bypass rules |
| `SwitchProfile` | Condition-based profile switching |
| `PacProfile` | Custom PAC script or URL |
| `RuleListProfile` | Online rule list (e.g., GFWList) |

## Storage Keys Convention

```typescript
// Profiles: prefixed with '+'
'+myProfile'     // Profile named "myProfile"

// Settings: prefixed with '-'
'-startupProfileName'    // Startup profile setting
'-quickSwitchProfiles'   // Quick switch list
'-downloadInterval'      // Rule list update interval

// State
'currentProfileName'     // Currently active profile
'isSystemProfile'        // Whether using system profile
```

## Background Service Worker API

Messages sent via `chrome.runtime.sendMessage`:

```typescript
// Get all options
{ action: 'getOptions' }
// Returns: { options: OmegaOptions, currentProfileName: string }

// Save options
{ action: 'setOptions', options: OmegaOptions }

// Apply a profile
{ action: 'applyProfile', profileName: string }

// Import options
{ action: 'importOptions', data: object }

// Reset to defaults
{ action: 'resetOptions' }
```

## Condition Types (for SwitchProfile rules)

1. `HostWildcardCondition` - Wildcard host matching (*.example.com)
2. `HostRegexCondition` - Regex host matching
3. `UrlWildcardCondition` - Wildcard URL matching
4. `UrlRegexCondition` - Regex URL matching
5. `KeywordCondition` - URL contains keyword
6. `BypassCondition` - Bypass patterns (like `<local>`)
7. `IpCondition` - IP address/CIDR matching
8. `WeekdayCondition` - Day of week
9. `TimeCondition` - Time range
10. `FalseCondition` - Always false (disabled rule)
11. `TrueCondition` - Always true
12. `ConditionGroup` - Logical group (AND/OR)

## Testing

```bash
# Run all tests
pnpm -r test

# Run specific package tests
cd packages/pac && pnpm test
cd packages/core && pnpm test

# Watch mode
cd packages/pac && pnpm test:watch
```

## Build & Load Extension

```bash
# Build
cd packages/extension && pnpm build

# Output: packages/extension/dist/chrome/

# Load in Chrome:
# 1. Go to chrome://extensions
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select dist/chrome folder
```

## Legacy Code (v3.x)

Old CoffeeScript/AngularJS code is in `omega-*` folders (deprecated):

```bash
cd omega-build
npm run deps
npm run build
```

## Common Tasks

### Add a new profile type

1. Add type to `packages/pac/src/types.ts`
2. Add matching logic to `packages/pac/src/profiles.ts`
3. Create editor component in `packages/extension/src/options/pages/`
4. Add route in `packages/extension/src/options/App.svelte`

### Add a new condition type

1. Add type to `packages/pac/src/types.ts`
2. Add matching function to `packages/pac/src/conditions.ts`
3. Add tests to `packages/pac/tests/conditions.test.ts`
4. Update `ProfileSwitch.svelte` condition editor

### Add a new UI component

1. Create in `packages/extension/src/components/ui/`
2. Use Svelte 5 runes API
3. Use Tailwind CSS for styling
4. Export from component file
