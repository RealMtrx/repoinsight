# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Offline vulnerability lookup** — A local database of known package vulnerabilities
  (`vulnerabilities.ts`) is scanned during analysis. Installed versions are resolved from
  `package-lock.json` when available, otherwise declared semver ranges are checked for overlap, and
  matches surface as `VulnerabilityInfo` in the report with CVE id, patched version, and severity
- **Vulnerability-aware scoring, reporting, and CLI** — `calculateSecurityScore` deducts points for
  known vulnerabilities; Terminal/Markdown/HTML reporters render a "Known Vulnerabilities" section;
  the `security` command now surfaces both secrets and vulnerable packages; critical vulnerabilities
  count toward report issues and generate a recommendation to upgrade
- **Bundled semver utilities** — `src/utils/versions.ts` implements range parsing (`<`, `<=`, `>`,
  `>=`, `=`, `^`, `~`, `x`-wildcards, `||`, hyphen, combined constraints) with no external
  dependency, supporting both exact version checks and range-overlap detection
- **Configurable rule sets** — Custom severity thresholds (`scoreThresholds` for
  excellent/good/fair/ poor) in config files, applied consistently via `getScoreStatus()`
- **`.repoinsightignore` support** — Per-project exclusion patterns in gitignore style, merged with
  `excludePatterns` from config files
- **Config file loading** — `loadConfig()` now actually reads configuration from disk, honoring the
  documented sources: `repoinsight.json`, `.repoinsightrc`, and the `repoinsight` key in
  `package.json` (in that priority order)
- **Config-aware analysis** — `runAnalysis()` resolves config from the analyzed directory and merges
  `excludePatterns` and `maxFileSize` into analysis options, so user-defined ignore patterns and
  size limits now take effect
- **Scanner maxFileSize** — `Scanner` respects `options.maxFileSize` instead of always using the
  default constant
- **Directory-aware exclusion expansion** — `Scanner` expands `dir/**` patterns so the root
  directory itself is excluded, not just its descendants
- **Effective configuration display** — `config` command shows the resolved config source, active
  exclude patterns, max file size, and score weights instead of hardcoded defaults
- **10 new tests** for config file loading, ignore-file merging, and exclusion expansion
- **19 new tests** for semver range handling, vulnerability scanning, reporter rendering, and
  security-score deduction with vulnerabilities

### Changed

- **Unified score classification** — `HtmlReporter` now uses `getScoreStatus()` from `scoring.ts`
  instead of duplicated hardcoded thresholds (80/60/40/20), so custom thresholds apply everywhere

### Fixed

- **Version mismatch** — `APP_VERSION` in `constants/index.ts` was stale (`1.3.0`) while the package
  was at `1.4.0`; version output is now consistent

## [1.4.0] — 2026-07-28

### Added

- **Multi-path analysis workflow** — Sequential analysis across multiple targets with aggregate
  scoring and results
- **Multi-progress display** — Shows `Scanning (N / M)`, `Current`, `Remaining`, `Elapsed`, `ETA`
  during sequential analysis
- **Multi-results view** — Summary of repositories, folders, total files, average health score, best
  project, and needs-attention list
- **Renderer support for multi-path output** — `renderMulti()` method on all 4 reporters (Terminal,
  JSON, Markdown, HTML) with `renderMultiReport()` factory in `reporters/index.ts`
- **Shared CLI output module** — `src/commands/output.ts` with `renderOutput()`,
  `renderMultiOutput()`, and `detectFormat()`, removing 60 lines of duplicated if/else from
  `analyze.ts` and `report.ts`
- **22 new tests** for `renderMulti` on all 4 reporters (277 total)

### Changed

- **AnalyzeScopeScreen** — Shows detected‑drives list in Entire‑Computer warning; updated bottom
  navigation text
- **PathManagerScreen** — Simplified display (icon + path only, no type label); explicit
  `existsSync()` validation before `detectTarget()` to reject non‑existent paths; clearer error
  messages for permission/ENOENT
- **MultiProgressView** — Redesigned header to `Scanning (N / M)` format with Current, Remaining,
  Elapsed, ETA fields
- **MultiResultsView** — Simplified summary to show only repositories, folders, total files, average
  health score (letter grade), best project, and needs attention; per‑project detail via down arrow
- **DetectTarget** no longer throws for non‑existent paths (returns default `repository` type)

## [1.3.0] — 2026-07-21

### Added

- **Error boundary** — `ErrorBoundary` component wrapping the TUI to catch rendering errors
  gracefully
- **Keyboard shortcuts** — Comprehensive shortcut system with bottom‑bar hints
- **Polished views** — Refined layout, spacing, and visual consistency across all TUI screens

### Changed

- **Ink migration** — Migrated custom raw‑mode TUI to Ink (React-based CLI framework) for better
  rendering, component lifecycle, and hook support
- **Progress views** — Replaced chalk progress bars with Ink-native `Static` + `Text` components
- **Non‑TTY handling** — Graceful fallback when stdin is not a TTY instead of crashing with Ink raw
  mode error
- **Windows compatibility** — Fixed CRLF (\\r\\n) handling for Enter key in raw input decoding

## [1.2.0] — 2026-07-21

### Added

- **Action dispatcher** — Centralized action handling with `actions.ts` for TUI event dispatch
- **Results viewer** — `ResultsViewer` component for browsing analysis results interactively
- **Dashboard rewrite** — Full analysis integration with ASCII logo and enhanced scan screen

### Fixed

- `doctor` command registered with CLI registry so it appears in command help

## [1.1.0] — 2026-07-21

### Added

- **Interactive TUI** — Keyboard-navigable terminal interface with logo, repository info, and menu
- **14 CLI commands** — `analyze`, `doctor`, `report`, `init`, `config`, `fix`, `stats`, `graph`,
  `deps`, `licenses`, `security`, `cache`, `update`, `help` — each with aliases, examples, and
  categorized help
- **Smart detection engine** — Centralized `Detector` class detects package managers
  (npm/pnpm/yarn/bun), monorepo tools (Turborepo/Nx/Lerna/workspaces), frameworks
  (Next.js/React/Vue/Svelte/Angular/Astro/Nuxt/Express/NestJS/Fastify), test frameworks
  (Vitest/Jest/Mocha/Playwright/Cypress), linters (ESLint/Prettier/Biome), CI/CD (GitHub
  Actions/GitLab CI/Azure Pipelines/CircleCI/Travis CI/Jenkins), Docker, git hooks
  (Husky/Commitlint), Changesets, Node.js version, TypeScript, npm package type, and documentation
  files
- **Detected technologies display** — Shown in interactive TUI and all 4 report formats
- **Custom TUI design system** — Original amber/teal/coral palette, unicode symbols, component
  library (Box, Menu, Progress, Spinner, Prompt, Layout)
- **Config system** — `repoinsight.json`, `.repoinsightrc`, and `package.json` `repoinsight` key
  support
- **Plugin system architecture** — Scaffolded plugin interface and registry
- **Analysis cache** — `.repoinsight-cache.json` persisting file content hashes; skipped on
  unchanged files; `--no-cache` flag to disable
- **Incremental analysis** — `--incremental` flag for re-analyzing only changed files
- **Performance optimizations** — Parallel file reading with Promise.all batching, backtracking-safe
  regex patterns, memory-efficient binary file skipping
- **Command registry** — Declarative `register()`/`getAll()`/`createHelpPage()` pattern for commands

### Changed

- **Entry point** — Running `repoinsight` without arguments launches interactive TUI instead of
  default scan
- **TerminalReporter redesign** — Uses the new `theme`/`styles`/`icons`/`severity` design system
  instead of raw chalk/boxen
- **HtmlReporter redesign** — Amber/teal/coral dark theme, cleaner card layout, responsive grid
- **MarkdownReporter redesign** — Visual badges, progress bars, biggest files and complexity
  sections
- **Secret regex patterns** — Fixed catastrophic backtracking in password/generic-secret/JWT regexes
  by using explicit character classes
- **AnalysisOptions** — Added `useCache` and `incremental` options to schema

### Removed

- **Old `scan` command** — Replaced by `analyze` command and command registry

## [1.0.0] — 2026-07-20

### Added

- **Repository scanning** — Recursive file and folder traversal with configurable exclusions
- **Language detection** — Automatic identification of 50+ programming languages based on file
  extensions
- **Git statistics** — Commit count, branch count, contributor analysis, and largest commit
  detection
- **Security scanning** — Detection of hardcoded secrets including AWS keys, GitHub tokens, Discord
  tokens, Google API keys, JWT secrets, passwords, and private keys
- **Code quality metrics** — Cyclomatic complexity calculation, function counting, and nesting depth
  analysis per file
- **Circular import detection** — DFS-based cycle detection across TypeScript/JavaScript module
  graphs
- **Duplicate code detection** — Basic hash-based similar block detection across files
- **Duplicate file names** — Identification of files with the same name in different directories
- **Empty folder detection** — Reporting of directories that contain no files
- **Dependency analysis** — Basic unused dependency detection from package.json
- **TODO/FIXME comment detection** — Regex-based scanning for TODO, FIXME, HACK, and XXX markers
- **Documentation audit** — Detection of missing README, LICENSE, .gitignore, test directories, and
  CI configuration
- **Large asset detection** — Identification of binary assets exceeding 100 KB
- **Environment file detection** — Flagging of committed `.env` files
- **Project health scoring** — 0–100 score across eight weighted categories: documentation, testing,
  structure, dependencies, security, maintainability, performance, code quality
- **Terminal reporter** — Colorful CLI output with spinners, tables, progress bars, and summary
  cards
- **JSON reporter** — Machine-readable output for CI/CD integration
- **Markdown reporter** — Clean markdown format suitable for pull requests and documentation
- **HTML reporter** — Full interactive report with dark/light mode, progress bars, and responsive
  design
- **Six CLI commands** — `scan`, `report`, `doctor`, `json`, `markdown`, `html`
- **CLI framework** — Built on Commander with Zod validation for all inputs
- **Architecture** — Clean separation with Scanner, AnalyzerEngine, Reporters, Models, and Utilities
- **Developer tooling** — TypeScript strict mode, ESLint, Prettier, Husky + lint-staged, Vitest,
  tsup

### Tooling

- **tsup** for ESM bundling
- **Vitest** for unit and integration testing with coverage reporting
- **TypeDoc** for API documentation generation
- **GitHub Actions** for CI with lint, typecheck, test, and build stages
- **Dependabot** configuration for automated dependency updates
