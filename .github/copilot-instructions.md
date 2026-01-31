# Copilot Instructions for ZeroOmega

## Build Commands (New v4.0+)

The project uses pnpm workspaces with three packages:

```bash
# Install all dependencies
pnpm install

# Run all tests
pnpm -r test

# Build extension
cd packages/extension
pnpm build

# Development mode (watch)
pnpm dev

# Type checking
pnpm typecheck
```

## Testing

Tests use Vitest and are written in TypeScript.

```bash
# Run all tests
pnpm -r test

# Run tests for a specific package
cd packages/pac && pnpm test
cd packages/core && pnpm test

# Watch mode
pnpm test:watch
```

## Architecture (v4.0+)

### Package Structure

```
packages/
├── pac/          # @onemega/pac - PAC script generation
├── core/         # @onemega/core - Options management  
└── extension/    # Browser extension UI
```

### @onemega/pac

Core PAC generation module (TypeScript):

- **types.ts**: All type definitions (Profile, Condition, Proxy, etc.)
- **conditions.ts**: 12 condition types for URL matching
- **profiles.ts**: Profile management and matching logic
- **rule-list.ts**: Rule list parsing (AutoProxy, Switchy formats)
- **utils.ts**: General utilities
- **shexp-utils.ts**: Shell expression matching

### @onemega/core

Browser-independent options management:

- **options.ts**: Options class with profile CRUD operations
- **storage.ts**: Abstract Storage interface
- **browser-storage.ts**: Chrome storage implementation
- **log.ts**: Logging utility
- **errors.ts**: Custom error classes

### @onemega/extension

Svelte 5 browser extension:

- **src/background/**: Service worker for proxy control
- **src/popup/**: Quick profile switching popup
- **src/options/**: Full configuration interface
- **src/lib/stores/**: Svelte 5 runes-based state
- **src/components/**: Reusable UI components

## Tech Stack

| Category | Technology |
|----------|-----------|
| Language | TypeScript |
| UI Framework | Svelte 5 (runes API) |
| Build Tool | Vite + @crxjs/vite-plugin |
| CSS | Tailwind CSS v4 |
| Testing | Vitest |
| Package Manager | pnpm |

## Svelte 5 Patterns

### Runes API

```typescript
// State
let count = $state(0);

// Derived values  
let doubled = $derived(count * 2);

// Effects
$effect(() => {
  console.log(count);
});

// Props
interface Props {
  value: string;
  onchange?: (v: string) => void;
}
let { value, onchange }: Props = $props();
```

### Component Conventions

- Use `$props()` for component props with TypeScript interface
- Use `$derived()` for reactive computed values
- Use `$bindable()` for two-way binding props
- Use `{@render children()}` instead of `<slot>`

## Profile Types

- **DirectProfile**: No proxy (DIRECT)
- **SystemProfile**: Use system proxy settings
- **FixedProfile**: Static proxy with bypass rules
- **SwitchProfile**: Condition-based profile switching
- **PacProfile**: Custom PAC script or URL
- **RuleListProfile**: Online rule list-based switching

## Storage Conventions

- Profile keys prefixed with `+` (e.g., `+profileName`)
- Settings keys prefixed with `-` (e.g., `-startupProfileName`)
- Current profile stored as `currentProfileName`

## Legacy Build (v3.x)

The legacy Grunt/CoffeeScript build is still available:

```bash
cd omega-build
npm run deps
npm run build
npm run release
```
