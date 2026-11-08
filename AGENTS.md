# AGENTS.md

## Stack
- Tauri 2 desktop app: React 19 + TypeScript 6 + Vite 8 frontend, Rust backend in `src-tauri/`.
- Use `pnpm` (lockfile and Tauri `before*Command` use it). Do not switch to npm/yarn.
- Tailwind CSS v4 via `@tailwindcss/vite`. Theme tokens live in `src/App.css` (`@theme`); there is no `tailwind.config` file.
- UI components are shadcn `aria-vega` style, built on `react-aria-components` — not Radix. Icons are Hugeicons.
- `@/*` maps to `src/*` in both Vite and TypeScript.

## Commands
- `pnpm dev` — Vite only, fixed port `1420` with `strictPort`.
- `pnpm tauri dev` — full desktop app; starts `pnpm dev` automatically. Do not run `pnpm dev` at the same time.
- `pnpm exec tsc --noEmit --ignoreDeprecations 6.0` — typecheck workaround. Plain `tsc`/`pnpm build` currently fails on TS5101 because `baseUrl` is deprecated in TS 6.
- `pnpm exec vite build` — frontend build without typechecking.
- `pnpm tauri build` — desktop bundle; runs `pnpm build`, so it is blocked by the same TS5101 issue until `tsconfig.json` is updated.
- No test, lint, or formatter scripts are configured.

## Architecture
- Web entry: `index.html` -> `src/main.tsx` -> `src/App.tsx`.
- File-upload state and drag/drop logic: `src/hooks/use-file-upload.ts`; prompt/table UI: `src/components/`.
- Tauri entry: `src-tauri/src/main.rs` calls `win_cipher_lib::run()` in `src-tauri/src/lib.rs`.
- Tauri window config: `src-tauri/tauri.conf.json`; permissions/capabilities: `src-tauri/capabilities/default.json` (scoped to window `main`).

## Gotchas
- `src-tauri/tauri.conf.json` sets `"dragDropEnabled": false`. This is required for HTML5 drag/drop in the webview on Windows. Re-enabling it breaks `dragenter`/`dragover`/`drop` unless file dropping is migrated to Tauri's native `onDragDropEvent`.
- `src-tauri` is excluded from Vite watching; Rust or Tauri config changes need a Tauri restart/rebuild.
- `react-aria-components` tables differ from shadcn defaults: `TableHeader` contains `TableHead` columns; `TableBody` contains `TableRow`/`TableCell`. Use RAC props (`isRowHeader`, `defaultSelectedKey`, `isDisabled`) rather than Radix-style props.
- UI primitives import `{ cn } from "cn"` directly; `src/lib/utils.ts` only re-exports that same `cn`.
