# Security Policy

## Reporting a Vulnerability

If you believe you've found a security vulnerability in this project,
please report it privately rather than opening a public issue:

- Open a private security advisory:
  <https://github.com/rliessum/flashcard-generator/security/advisories/new>

Please include:

- A description of the issue and its impact.
- Reproduction steps or a proof-of-concept.
- The affected version or commit hash.

We aim to acknowledge reports within 72 hours and will keep you updated
as we triage and remediate. Once a fix is released, we'll credit you in
the advisory unless you prefer to remain anonymous.

## Supported Versions

Only the latest commit on `main` (and the currently deployed Netlify
site) receive security updates.

## Scope

In scope:

- The web application served from this repository.
- Build, dev, and CI tooling listed in `package.json`.

Out of scope:

- Findings that require a compromised local machine, browser extension,
  or physical access to a user's device.
- Issues affecting the unmaintained `catalyst-ui-kit/` demo apps
  (untracked from this repository).
- Denial-of-service via abusive request volume against Netlify.

## Hardening Already in Place

- Strict Content-Security-Policy with `script-src 'self'` (no
  `unsafe-inline` or `unsafe-eval`).
- HSTS with `preload`, `Permissions-Policy` denying camera, microphone,
  geolocation, payment, USB, serial, bluetooth, and FLoC.
- `X-Frame-Options: DENY` + CSP `frame-ancestors 'none'`.
- All user-supplied card text is rendered via React (auto-escaped) or
  `escapeHtml()` in the print HTML path.
- Dependabot watches npm and GitHub Actions weekly; the `Security`
  workflow runs `npm audit` and CodeQL on every push and weekly.
