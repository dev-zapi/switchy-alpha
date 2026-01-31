ZeroOmega, forked from SwitchyOmega compatible with manifest v3
============

[Chrome Web Store](https://chromewebstore.google.com/detail/pfnededegaaopdmhkdmcofjmoldfiped)

[Microsoft Edge Addons](https://microsoftedge.microsoft.com/addons/detail/zeroomegaproxy-switchy-/dmaldhchmoaaopdmhkdmcofjmoldfiped)

[Firefox Addon](https://addons.mozilla.org/en-US/firefox/addon/zeroomega/)

Manage and switch between multiple proxies quickly & easily.

[![Translation status](https://hosted.weblate.org/widgets/switchyomega/-/svg-badge.svg)](https://hosted.weblate.org/engage/switchyomega/?utm_source=widget)

## Tech Stack (v4.0+)

| Category | Technology |
|----------|-----------|
| Language | TypeScript |
| UI Framework | Svelte 5 |
| Build Tool | Vite |
| CSS | Tailwind CSS v4 |
| Testing | Vitest |
| Package Manager | pnpm |

## Project Structure

```
onemega/
├── packages/
│   ├── pac/          # @onemega/pac - PAC script generation
│   ├── core/         # @onemega/core - Options management
│   └── extension/    # Browser extension (Chrome/Firefox)
├── omega-*/          # Legacy modules (deprecated)
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## Development

### Prerequisites

- Node.js 20+
- pnpm 9+

### Setup

```bash
# Install dependencies
pnpm install

# Run tests
pnpm -r test

# Build extension
cd packages/extension
pnpm build

# Development mode (watch)
pnpm dev
```

### Loading the Extension

After building, load the extension from `packages/extension/dist/chrome/` as an unpacked extension in Chrome.

## Legacy Build (v3.x)

The legacy build system using Grunt/Bower is still available in the `omega-build/` directory:

```bash
cd omega-build
npm run deps
npm run build
```

Chromium Extension
------------------
The project is available as a Chromium Extension.

You can try it on [Chrome Web Store](https://chromewebstore.google.com/detail/pfnededegaaopdmhkdmcofjmoldfiped),
or grab a packaged extension file (CRX) for offline installation on the [Releases page](https://github.com/zero-peak/ZeroOmega/releases).

Please [report issues on the issue tracker](https://github.com/zero-peak/ZeroOmega/issues).

Firefox Addon
----------------------------

There is also a WebExtension port, which allows installing in Firefox. Compatibility with Firefox has increased significantly recently.

You can try it on [Mozilla Add-ons](https://addons.mozilla.org/en-US/firefox/addon/zeroomega/),
or grab a packaged extension file (XPI) for offline installation on the [Releases page](https://github.com/zero-peak/ZeroOmega/releases).

Please [report issues on the issue tracker](https://github.com/zero-peak/ZeroOmega/issues), browser-specific bugs are possible.

## Architecture

### @onemega/pac
PAC generating module that handles profiles and compiles them into PAC scripts.

- **profiles.ts** - Profile management and matching
- **conditions.ts** - 12 condition types for URL matching
- **rule-list.ts** - Rule list parsing (AutoProxy, Switchy formats)

### @onemega/core
Browser-independent options management.

- **options.ts** - CRUD operations for profiles and settings
- **storage.ts** - Abstract storage interface
- **browser-storage.ts** - Chrome storage implementation

### @onemega/extension
Browser extension with Svelte 5 UI.

- **background/** - Service worker for proxy control
- **popup/** - Quick profile switching popup
- **options/** - Full configuration interface

## Translation

Translation is hosted on Weblate. If you want to help improve the translated
text or start translation for your language, please follow the link of the picture
below.

本项目翻译由Weblate托管。如果您希望帮助改进翻译，或将本项目翻译成一种新的语言，请
点击下方图片链接进入翻译。

[![Translation status](https://hosted.weblate.org/widgets/switchyomega/-/287x66-white.png)](https://hosted.weblate.org/engage/switchyomega/?utm_source=widget)

License
-------
![GPLv3](https://www.gnu.org/graphics/gplv3-127x51.png)

ZeroOmega is licensed under [GNU General Public License](https://www.gnu.org/licenses/gpl.html) Version 3 or later.

ZeroOmega is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

ZeroOmega is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with ZeroOmega.  If not, see <http://www.gnu.org/licenses/>.

Notice
------


ZeroOmega currently does not have a dedicated project homepage. Please refer to this Github repository and wiki for official information.

ZeroOmega is not cooperating with any proxy providers, VPN providers or ISPs at the moment. No advertisement is displayed in ZeroOmega project or software. Proxy providers are welcome to recommend ZeroOmega as part of the solution in tutorials, but it must be made clear that ZeroOmega is an independent project, is not affiliated with the provider and therefore cannot provide any support on network connections or proxy technology.

重要声明
--------

ZeroOmega 目前没有专门的项目主页。一切信息请以 Github 上的项目和 wiki 为准。

ZeroOmega 目前未与任何代理提供商、VPN提供商或 ISP 达成任何合作协议，项目或软件中不包含任何此类广告。欢迎代理提供商在教程或说明中推荐 ZeroOmega ，但请明确说明此软件是独立项目，与代理提供商无关，且不提供任何关于网络连接或代理技术的支持。
