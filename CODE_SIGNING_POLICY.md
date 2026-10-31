# Code signing policy

*Derivation Planner (Deriver) — Windows installer*

Windows releases of Derivation Planner are digitally signed so that you can check that the installer comes from this project's official
release process and has not been altered.

> **Free code signing provided by [SignPath.io](https://signpath.io), certificate by [SignPath Foundation](https://signpath.org).**

## How the signed installer is made
* The installer is built **from the source code in this public repository** (https://github.com/mfricke1947/derivation-planner) by GitHub Actions
  (`.github/workflows/build.yml`), on GitHub-hosted runners. Build scripts and workflow files are part of the source.
* SignPath verifies that each file submitted for signing was produced by that build from that repository (origin verification).
* **Every signing request is approved manually** by the project's approver before anything is signed.
* The signing keys are held by SignPath Foundation, not by the author; the publisher shown in the certificate is *SignPath Foundation*.
* Only this project's own binaries are signed. Third-party components are included as their authors distribute them.

## Team roles
| Role | Who | Responsibility |
|---|---|---|
| Author (committer) | Martin Frické — https://github.com/mfricke1947 | Maintains the source code |
| Reviewer | Martin Frické | Reviews any change made by someone else |
| Approver | Martin Frické | Approves each signing request |

All team members use multi-factor authentication for GitHub and for SignPath.

## Privacy
This program does not transfer any information to other networked systems unless specifically requested by the user or the person installing
or operating it. (The one network feature is **File > Open from URL…**, which fetches a web address that the user types.) The program collects no
usage data and has no analytics or automatic update checks.

## How to verify a signed installer
On Windows, right-click the installer, choose **Properties > Digital Signatures**, and check that the signer is *SignPath Foundation*. In PowerShell:
`Get-AuthenticodeSignature .\Derivation-Planner-<version>-win-x64.exe`. The release notes also give the SHA-256 checksum of each installer.

## Reporting a problem
If you think a signed file is malicious or has been tampered with, do not run it, and write to **mfricke@arizona.edu** with the file's SHA-256 hash and
where you downloaded it.

## Other platforms
The macOS build is signed with an Apple Developer ID and notarized by Apple.
