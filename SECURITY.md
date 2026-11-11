# Security Policy

WinCipher is free and open source under the [Apache License 2.0](LICENSE). The complete source code is available at [github.com/quddus-larik/WinCipher](https://github.com/quddus-larik/WinCipher), and anyone can inspect, audit, build, or contribute to it.

Security issues are tracked in the public repository so that users, contributors, and maintainers can all see the discussion and the fix.

WinCipher is a local, offline-first Windows app. We take security reports seriously and appreciate responsible disclosure.

## Supported versions

Only the latest published release receives security fixes.

| Version | Supported |
| --- | --- |
| 1.1.x (latest) | ✅ |
| Older releases | ❌ |

## Reporting a vulnerability

Open an issue in the [GitHub issue tracker](https://github.com/quddus-larik/WinCipher/issues) with a clear description, the affected version, and reproduction steps. Label the issue as a security problem if GitHub offers a suitable label.

Please avoid attaching real personal, financial, or confidential documents. If a document is needed to reproduce the issue, sanitize it and include only the smallest sample that triggers the problem.

### What to include

- Affected WinCipher version and installer type (NSIS or MSI)
- Windows version and architecture
- A description of the vulnerability and its impact
- Steps to reproduce, or a minimal proof-of-concept file
- Any known mitigations or workarounds

Please use your own test files.

## Scope

Examples of issues that are in scope:

- Memory-safety bugs or crashes that can lead to code execution while parsing or converting files
- Writing files outside the folder the user selected
- Bypassing update signature verification, or tampering with the update process
- Webview or content-security issues that allow code execution or unauthorized local file access
- Installer issues that cross a privilege boundary

Examples of issues that are generally out of scope:

- Attacks that require an already-compromised machine, administrator access, or physical access
- Vulnerabilities in Windows, WebView2, or third-party dependencies that have no WinCipher-specific exploit path (these can still be reported and may be forwarded upstream)
- Social engineering or UI spoofing that does not involve a WinCipher vulnerability
- Missing security features that do not affect the app's actual threat model

## Security and privacy design

- All file processing happens locally on your computer.
- WinCipher does not upload files, require an account, or include telemetry or analytics.
- Network access is used only to check for and download updates from the project's GitHub releases.
- Updates are cryptographically signed and verified against a public key embedded in the app. A release is accepted only when its signature is valid and its version is newer than the installed version.
- Converted files are kept in memory only until you save or remove them.

## Disclosure

Security reports, fixes, and advisories are handled publicly in the repository. Once a fix is released, details can be added to the release notes or a public advisory. Credit can be included in the release notes if you would like it.
