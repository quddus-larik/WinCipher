---
name: WinCipher
description: Fast, private, offline file conversion for Windows.
cover: https://raw.githubusercontent.com/quddus-larik/WinCipher/main/src/assets/ui.gif
---

WinCipher is a small desktop app for converting files without uploading them anywhere. There are no accounts, no cloud services, no telemetry, and no ads: you drop files into the window, choose an output format, convert, and save the result to a folder you pick.

Everything runs locally. The React frontend handles the file queue, format selection, progress, and errors, while the Rust backend performs the actual conversions in the background. Converted bytes are kept in memory only until you save or remove them. The interface supports single-file and batch workflows with a consistent two-step flow: **Convert** first, then **Save**.

WinCipher currently handles three families of files:

- **Images** — PNG, JPG/JPEG, and WEBP inputs, with outputs including PNG, JPG/JPEG, WEBP, BMP, GIF, and TIFF.
- **Audio** — MP3, WAV, FLAC, AAC, M4A/MP4A, OGG, AIFF, and CAF inputs, with outputs including WAV, FLAC, MP3, AAC, M4A, and AIFF.
- **Documents** — DOC and DOCX inputs, convertible to Markdown, HTML, DOCX, or (for DOCX) PDF.

Only formats the native engine can actually produce are offered in the UI. Native Windows dialogs handle file selection and saving, and the app includes a signed updater that only accepts newer, correctly signed releases.

[View the full README](README.md) for supported conversions and install instructions.

## Technologies

### Desktop and runtime

- **Tauri 2** — native application shell that pairs a Rust backend with a webview frontend.
- **WebView2** — Chromium-based rendering runtime used by Tauri on Windows.
- **Rust 2024** — implementation language for conversion commands, in-memory output storage, and native file writes.
- **tauri-plugin-updater** — checks for, downloads, and verifies signed updates.
- **tauri-plugin-opener** — opens external URLs through the operating system.
- **tauri-plugin-process** — supports process actions such as relaunching after an update.
- **rfd** — native Windows folder picker for choosing where converted files are saved.

### Frontend

- **React 19** — component-based UI and application state.
- **TypeScript 6** — static typing for the frontend codebase.
- **Vite 8** — development server and production bundler.
- **Tailwind CSS 4** — utility-first styling with theme tokens defined in `src/App.css`.
- **shadcn (`aria-mira` style)** — prebuilt, accessible UI component patterns.
- **react-aria-components** — accessible primitives for tables, tabs, buttons, and comboboxes.
- **Hugeicons** — icon set used throughout the interface.
- **Geist Variable** — variable font used for interface typography.
- **tw-animate-css** — animation utilities for interface transitions.
- **`cn`** — class-name composition helper used by UI primitives.
- **pnpm** — package manager used for all frontend dependency work.

### Build tooling

- **Tauri CLI** — runs the desktop app in development and builds Windows installers.
- **Cargo** — builds and checks the Rust backend.
- **TypeScript compiler** — type-checks the frontend before bundling.

## Availability

| Platform | Status |
| --- | --- |
| Windows 10 / 11 | Supported; NSIS and MSI installers are published on the [Releases page](https://github.com/quddus-larik/WinCipher/releases). |
| Windows portable build | Not currently published. |
| macOS | Not currently published. |
| Linux | Not currently published. |
| Web browser | Not applicable; WinCipher is a desktop application. |

The underlying stack is cross-platform, but current builds and file-drop handling target the Windows webview. WebView2 is required on Windows; it is included with Windows 11 and can be installed separately on Windows 10.

## License

WinCipher is open source and licensed under the [Apache License 2.0](LICENSE).
