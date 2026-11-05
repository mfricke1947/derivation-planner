# Releases, signing and verification

How Derivation Planner's installers are made, signed and checked.

## macOS
The macOS installer (`.dmg`) is signed with an Apple Developer ID and **notarized by Apple**, so it opens normally on Apple-silicon and Intel Macs.

## Windows
**Microsoft Store (recommended).** Derivation Planner is published in the [Microsoft Store](https://apps.microsoft.com/detail/9n3cfwbp80nz). Store packages are signed by Microsoft
after certification, so Windows shows no security warning, and updates are delivered by the Store. The Store package is built from the source in this repository by
**GitHub Actions** (`.github/workflows/build.yml`), checked against the identity reserved in Microsoft Partner Center, and test-installed and started on a clean Windows machine
before it is submitted.

**Direct installer (alternative).** The direct installer on the [Releases](https://github.com/mfricke1947/derivation-planner/releases) page is built by the same workflow, and each build
installs it silently on a clean Windows machine, starts the program and checks that every part loads before it is published. It is **not signed with a code-signing certificate**:
such certificates cost money and, for free open-source programs, depend on an established public track record. As a result Windows SmartScreen may show
"Windows protected your PC" the first time you run it. This is normal for unsigned software. To continue, choose **More info**, then **Run anyway**. If you would rather not see
the warning, use the Microsoft Store version.

## How to check an installer is genuine
* Download only from the project's download page (https://softoption.us/node/887) or from this repository's
  [Releases](https://github.com/mfricke1947/derivation-planner/releases).
* Compare the file's **SHA-256 checksum** with the one given in the release notes. On Windows: `Get-FileHash .\<installer>.exe -Algorithm SHA256`
  (PowerShell). On macOS: `shasum -a 256 <file>.dmg`.
* The source code is public, and the Windows installer is built from it by the workflow above; the build logs are public on the repository's *Actions* page.

## Privacy
This program does not transfer any information to other networked systems unless specifically requested by the user. (The one network feature is
**File > Open from URL…**, which fetches a web address that the user types.) It collects no usage data and has no analytics or automatic update checks.

## Reporting a problem
If you think an installer is malicious or has been tampered with, do not run it, and write to **mfricke@arizona.edu** with the file's SHA-256 hash and where you downloaded it.
