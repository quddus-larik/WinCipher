# Contributing to WinCipher

Thanks for taking the time to improve WinCipher. This guide covers the development setup, coding conventions, and pull request process.

WinCipher is a small, offline-first Windows image converter. Contributions that keep it fast, private, and focused are very welcome.

## Ways to contribute

- **Report a bug** — include steps to reproduce, expected and actual behavior, your Windows version, and the WinCipher version.
- **Suggest a feature** — explain the problem it solves and why it belongs in a minimal offline converter.
- **Improve documentation** — fixes to the README, this guide, or inline docs are appreciated.
- **Submit code** — bug fixes, performance improvements, accessibility work, and well-scoped features.

Before starting a larger change, open an issue so we can agree on the approach. Small fixes can go straight to a pull request.

## Code of conduct

Be respectful, constructive, and patient. Harassment, personal attacks, and discriminatory language are not welcome. Maintainers may remove comments or contributions that do not meet this standard.

## Development setup

### Prerequisites

- Windows 10 or 11
- [Node.js](https://nodejs.org/) 20.19+ or 22.12+ and [pnpm](https://pnpm.io/) 9+
- [Rust](https://www.rust-lang.org/tools/install) with the stable toolchain
- [Tauri 2 Windows prerequisites](https://v2.tauri.app/start/prerequisites/) (WebView2 and the MSVC build tools)

### Run the app

```bash
git clone https://github.com/quddus-larik/WinCipher.git
cd WinCipher
pnpm install
pnpm tauri dev
```

`pnpm tauri dev` starts both the Vite frontend and the Rust backend. Do not run `pnpm dev` at the same time — the Vite server uses the fixed port `1420` and will fail if the port is already taken.

## Useful commands

| Command | What it does |
| --- | --- |
| `pnpm tauri dev` | Run the full desktop app |
| `pnpm dev` | Run only the Vite frontend, without the Rust backend |
| `pnpm build` | Type-check and build the frontend into `dist/` |
| `pnpm exec tsc --noEmit` | Type-check without emitting files |
| `pnpm exec vite build` | Build the frontend without type-checking |
| `pnpm tauri build` | Build the Windows executable and installers |

Build output is written to `src-tauri/target/release/bundle/`.

There are currently no automated test, lint, or formatter scripts. If you add one, wire it into `package.json` and document it here.

## Project structure

```text
src/                        React frontend
  components/               UI, file table, title bar
  hooks/                    File upload and drag/drop state
  lib/                      Image format and conversion helpers
src-tauri/                  Rust backend
  src/lib.rs                Conversion, save, and cleanup commands
  capabilities/             Tauri permissions
  icons/                    App icons and logo
  tauri.conf.json           Tauri window and bundle configuration
```

## Coding guidelines

### General

- Use **pnpm**. Do not switch the project to npm or yarn.
- Keep changes focused. Avoid unrelated refactors in the same pull request.
- Match the existing naming, formatting, and component patterns.
- Preserve the offline-first model: conversion must never upload files or require an account.

### Frontend

- Use React function components and hooks.
- Use the existing shadcn `aria-vega` primitives, which are built on `react-aria-components` — not Radix.
- Use React Aria Component props such as `isDisabled`, `isRowHeader`, `defaultSelectedKey`, and `onSelectionChange` where appropriate.
- Use **Hugeicons** for icons.
- Style with Tailwind CSS 4 utilities and the theme tokens in `src/App.css` (`@theme`). There is no `tailwind.config` file; do not add one.
- Import `cn` from `"cn"` directly, matching the existing UI primitives.
- Keep accessibility in mind: labels, focus states, keyboard navigation, and disabled states should keep working.

### Rust

- Keep Tauri commands in `src-tauri/src/lib.rs` unless a module split is clearly justified.
- Run CPU-heavy work such as image decoding and encoding inside `tauri::async_runtime::spawn_blocking`.
- Return user-friendly error strings from commands; do not panic on bad input.
- Avoid blocking the UI thread with file dialogs or disk writes.

## Platform gotchas

- `src-tauri/tauri.conf.json` sets `"dragDropEnabled": false`. This is required for HTML5 drag and drop in the Windows webview. If you re-enable it, migrate file dropping to Tauri's native `onDragDropEvent` first.
- Vite does not watch `src-tauri/`. Restart or rebuild the app after changing Rust code or Tauri configuration.
- The Vite dev server uses port `1420` with `strictPort: true`.
- Tauri configuration changes require a restart of `pnpm tauri dev`.

## Testing your change

Because the project has no automated test suite yet, manual verification matters:

1. Run `pnpm exec tsc --noEmit`.
2. Start the app with `pnpm tauri dev`.
3. Test at least PNG, JPG, and WEBP inputs against a couple of output formats.
4. Test single-file and batch flows: **Convert**, **Convert all**, **Save**, and **Save all**.
5. Check drag and drop, the file picker, removing files, and disabled controls while work is in progress.
6. Verify that conversion errors are shown clearly and do not leave the UI stuck.
7. Include screenshots or a short recording for visible UI changes.

## Commit and pull request guidelines

1. Branch from `main` using a descriptive prefix such as `feat/`, `fix/`, `docs/`, or `chore/`.
2. Write clear, imperative commit messages, for example `fix: keep save button disabled while writing`.
3. Keep pull requests small and focused on one concern.
4. In the pull request description, explain **what** changed, **why**, and **how you tested it**. Link related issues.
5. Do not commit generated output or dependencies such as `dist/`, `node_modules/`, or `src-tauri/target/`.
6. Be ready to make follow-up changes from review.

## Security and secrets

- Never commit private code-signing keys, passwords, `.env` files, or files such as `*.key` and `*.key.password`.
- Do not paste secrets into issues, pull requests, screenshots, or logs.
- If you find a security issue, report it privately to the maintainers instead of opening a public issue.

## License

WinCipher is licensed under the [Apache License 2.0](LICENSE). By submitting a contribution, you agree that it may be distributed under the same license.
