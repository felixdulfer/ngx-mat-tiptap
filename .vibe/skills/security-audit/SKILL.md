---
name: security-audit
description: Load when the user asks for a dependency security audit, vulnerability scan of packages, or wants to check the project's dependencies for known CVEs/advisories. Runs pnpm audit + lockfile checks and produces a severity-ranked findings report.
---

# Security Audit (Dependencies)

Run a dependency-focused security audit for this project (pnpm-based Angular
library) and produce a findings report. Do not modify dependencies — report
only.

## Steps

1. **Confirm the package manager.** This repo uses pnpm (`pnpm-lock.yaml`,
   `packageManager` in `package.json`). Always use `pnpm`, never `npm`/`yarn`,
   so results match the real lockfile.

2. **Run the vulnerability audit:**
   ```bash
   pnpm audit --json
   ```
   Parse the JSON: `metadata.vulnerabilities` gives counts by severity
   (critical/high/moderate/low), and `advisories` maps each advisory to
   `module_name`, `severity`, `title`, `url`, ` vulnerable_versions`,
   `patched_versions`, `recommendation`, and `findings[].paths` (which direct
   or transitive dependency pulls it in).

3. **Check for outdated packages** (context for upgrade planning):
   ```bash
   pnpm outdated --json
   ```
   Flag direct dependencies that are behind their latest version, noting
   whether the gap crosses major versions.

4. **Lockfile hygiene checks:**
   - Verify `pnpm-lock.yaml` exists and is committed (not gitignored).
   - Check `pnpm audit` exit behavior: non-zero exit means vulnerabilities
     were found; treat that as expected signal, not a command failure.
   - If `package.json` has an `engines` field, note whether the installed
     Node satisfies it.

5. **Classify findings by severity** using the advisory severities, and for
   each finding note: affected package, severity, CVE/GHSA id + link, how it
   is reached (direct dep vs transitive, with the path from `findings[].paths`),
   patched version, and whether a fix is a patch/minor/major bump.

6. **Write the report** to the user as markdown (see `report-template.md`),
   severity-ranked, most severe first. Include a summary table of counts per
   severity and an overall verdict (e.g. "no action needed" vs "upgrade
   required"). Do NOT paste the raw JSON.

## Gotchas

- `pnpm audit --json` exits non-zero when vulnerabilities exist — capture
  stdout anyway; the JSON is still emitted.
- Transitive-only vulnerabilities may be fixed by upgrading an intermediate
  direct dependency; say so when the advisory path shows it.
- `pnpm outdated` can be slow on large trees; if it fails, skip it and note
  that in the report rather than blocking the audit.
- Dev-only dependencies still matter if they run in CI (e.g. semantic-release,
  puppeteer); mark each finding as `runtime` vs `dev` based on whether the
  package appears in `devDependencies`.
- Never run `pnpm update` or edit the lockfile as part of the audit — this
  skill reports, it does not fix.
