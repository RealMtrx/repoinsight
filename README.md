<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/RealMtrx/repoinsight/main/assets/repoinsight-dark.svg">
    <img alt="repoinsight" src="https://raw.githubusercontent.com/RealMtrx/repoinsight/main/assets/repoinsight-light.svg" width="400">
  </picture>
  <br>
  <strong>Cross-platform repository analysis CLI</strong>
  <br>
  <sub>Understand any repository in seconds</sub>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/repoinsight"><img src="https://img.shields.io/npm/v/repoinsight.svg" alt="npm version"></a>
  <a href="https://github.com/RealMtrx/repoinsight/actions"><img src="https://github.com/RealMtrx/repoinsight/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/RealMtrx/repoinsight/blob/main/LICENSE"><img src="https://img.shields.io/github/license/RealMtrx/repoinsight" alt="license"></a>
</p>

---

## Features

- **Interactive TUI** — keyboard-navigable terminal interface with scope-aware analysis
- **14 Commands** — analyze, doctor, report, init, config, fix, stats, graph, deps, licenses,
  security, cache, update, help
- **Path-Aware Analysis** — auto-detects whether the target is a file, directory, or repository root
  and scopes the analysis accordingly CI/CD, linters, and more
- **4 Report Formats** — terminal (ANSI), HTML (dark theme), Markdown, JSON
- **Performance** — parallel file scanning, smart caching, incremental analysis
- **Scoring** — 8-category health score with actionable recommendations
- **Offline Vulnerability Scan** — local database of known package vulnerabilities checked against
  resolved dependency versions (`security` command, and included in every report/scoring)
- **Zero Config** — works out of the box, no configuration needed

## Install

```bash
npm install -g repoinsight
# or
pnpm add -g repoinsight
# or
yarn global add repoinsight
# or
bun add -g repoinsight
```

## Quick Start

```bash
# Analyze the current repository
repoinsight analyze

# Analyze a specific path (file, directory, or repository)
repoinsight analyze ./path/to/project
repoinsight analyze ./src
repoinsight analyze ./src/index.ts

# Generate HTML report
repoinsight analyze --html

# Generate Markdown report
repoinsight analyze --md

# Doctor checkup
repoinsight doctor

# Disable cache for fresh analysis
repoinsight analyze --no-cache

# Start interactive TUI
repoinsight
```

## Commands

| Command    | Aliases        | Description                          |
| ---------- | -------------- | ------------------------------------ |
| `analyze`  | `a`, `inspect` | Path-aware repository analysis       |
| `doctor`   | `d`, `checkup` | Repository health checkup            |
| `report`   | `r`            | Generate report from cached analysis |
| `init`     | `i`            | Initialize a new analysis            |
| `config`   | `c`            | View or edit configuration           |
| `fix`      | `f`, `repair`  | Fix common repository issues         |
| `stats`    | `s`            | Show repository statistics           |
| `graph`    | `g`            | Generate dependency graph            |
| `deps`     | `dep`          | Analyze dependencies                 |
| `licenses` | `l`, `license` | Check dependency licenses            |
| `security` | `sec`, `vuln`  | Security vulnerability scan          |
| `cache`    | `c`            | Manage analysis cache                |
| `update`   | `u`, `upgrade` | Check for updates                    |
| `help`     | `h`, `?`       | Show help                            |

## Configuration

repoinsight works out of the box with zero configuration. Optional config is loaded from:

- `repoinsight.json` in project root
- `.repoinsightrc` in project root
- `repoinsight` key in `package.json`

### Per-project ignore patterns

Create a `.repoinsightignore` file in your project root to exclude files and folders from analysis,
using gitignore-style patterns. Lines starting with `#` are comments, and blank lines are skipped.

```gitignore
# exclude build artifacts and generated code
dist/**
coverage/**
generated/**

# exclude by extension anywhere in the tree
*.min.js
*.map
```

Patterns from `.repoinsightignore` are merged with `excludePatterns` from your config file.

### Example `repoinsight.json`

```json
{
  "excludePatterns": ["dist/**", "build/**"],
  "maxFileSize": 5242880,
  "scoreWeights": {
    "documentation": 15,
    "testing": 15,
    "structure": 12,
    "dependencies": 10,
    "security": 15,
    "maintainability": 12,
    "performance": 8,
    "codeQuality": 13
  }
}
```

## Smart Detection

repoinsight automatically detects these technologies in your repository:

### Package Managers

npm, pnpm, yarn, bun — detected from lock files and `packageManager` field

### Monorepo Tools

Turborepo, Nx, Lerna, npm/pnpm/yarn workspaces

### Frameworks

Next.js, React, Vue, Svelte, Angular, Astro, Nuxt, Express, NestJS, Fastify

### Test Frameworks

Vitest, Jest, Mocha, Playwright, Cypress

### Linters & Formatters

ESLint, Prettier, Biome

### CI/CD

GitHub Actions, GitLab CI, Azure Pipelines, CircleCI, Travis CI, Jenkins

### Git Hooks

Husky, Commitlint, Changesets

### Other

Docker, Docker Compose, TypeScript, Node.js version (from engines, .nvmrc, volta)

## Reports

### Terminal (default)

Color-coded output with progress bars, tables, and severity indicators using the original
amber/teal/coral design system.

### HTML

Standalone dark-themed report with cards, bars, and responsive grid layout.

### Markdown

Plain-text tables with visual badges and progress bars for GitHub/README embedding.

### JSON

Machine-readable output for CI/CD pipelines and tooling.

## Performance

- **Parallel scanning** — files are read concurrently with configurable batch size
- **Smart caching** — `.repoinsight-cache.json` stores file content hashes, skipped on subsequent
  runs for unchanged files
- **Incremental analysis** — `--incremental` flag only re-analyzes changed files
- **Optimized regex** — backtracking-safe secret detection patterns
- **Memory efficient** — binary files are skipped, large files are stream-capped

## Scoring

The health score (0–100) is calculated from 8 categories:

| Category        | Default Weight | Description                         |
| --------------- | -------------- | ----------------------------------- |
| Documentation   | 15%            | README, inline docs, API docs       |
| Testing         | 15%            | Test files, coverage config         |
| Structure       | 12%            | Project organization, naming        |
| Dependencies    | 10%            | Up-to-date deps, no unused deps     |
| Security        | 15%            | Secrets, env files, vulnerabilities |
| Maintainability | 12%            | Code complexity, duplication        |
| Performance     | 8%             | Large files, asset sizes            |
| Code Quality    | 13%            | Linting, formatting, conventions    |

## Interactive TUI

Run `repoinsight` without arguments to enter the Ink-based interactive terminal interface:

```
repoinsight
```

### Analysis Target

The TUI automatically detects what you're analyzing and displays it clearly:

| Target Type    | Icon | Example                |
| -------------- | ---- | ---------------------- |
| **File**       | 📄   | `./src/index.ts`       |
| **Directory**  | 📁   | `./src`                |
| **Repository** | 📦   | `.` or `/path/to/repo` |

Scores and recommendations are scoped to the analyzed target. A single file analysis reports metrics
for just that file; a directory analysis covers only that subtree.

### Keyboard Shortcuts

| Key               | Action                       |
| ----------------- | ---------------------------- |
| `↑`/`↓`           | Navigate menu / items        |
| `Enter`           | Select / launch              |
| `Ctrl+K`          | Open command palette         |
| `Ctrl+C`          | Quit                         |
| `Esc`             | Back / close                 |
| `Tab`             | Cycle through menu items     |
| `PageUp`/`PageDn` | Jump to first / last item    |
| `Q`               | Quit / back to dashboard     |
| `R`               | Re-scan repository           |
| `←`/`→`           | Navigate results sections    |
| `A`               | Add path (path manager)      |
| `D`               | Remove path (path manager)   |
| `Space`           | Toggle path enabled/disabled |

### Views

The TUI guides you through a structured analysis workflow:

1. **Dashboard** — project metadata, detected technologies, and action menu
2. **Analyze Scope** — choose scan target:
   - **Entire Computer** — scans all connected drives (shows warning + drive list before starting)
   - **Custom Paths** — open the Path Manager to select specific folders and repositories
3. **Path Manager** — manage unlimited analysis targets:
   - Add any number of paths; types auto-detected (📦 Repository / 📁 Folder)
   - Toggle paths on/off, remove selected, preview detected types
   - Paths validated on entry with friendly error messages
4. **Multi-Progress** — sequential analysis with live status:
   - Shows current target, remaining count, elapsed time, and ETA
   - Results so far listed as each completes
   - Parallel mode architecture ready for future use
5. **Multi-Results** — aggregate summary of all analyzed targets:
   - Total repositories, folders, and files scanned
   - Average health score (letter grade)
   - Best project and project needing attention
   - Per-project detail view (scores, files, duration, languages)
6. **Progress** — animated scan indicator for single-target analysis
7. **Results** — six-section detailed report (Summary, Scores, Languages, Technologies, Files &
   Folders, Recommendations)
8. **Stats** — repository statistics with Git data
9. **Command Palette** — fuzzy-searchable quick commands (`Ctrl+K`)

> The TUI includes a React error boundary that catches render crashes gracefully and displays a
> user-friendly error message without crashing the terminal.

## API

```typescript
import { AnalyzerEngine } from "repoinsight/core/AnalyzerEngine";
import { Detector } from "repoinsight/detection";

// Programmatic analysis
const engine = new AnalyzerEngine({ useCache: true });
const report = await engine.analyze("./my-project");

// Technology detection
const detector = new Detector("./my-project");
const tech = detector.detect();
console.log(tech.packageManager); // "npm" | "pnpm" | "yarn" | "bun" | null
console.log(tech.frameworks); // ["react", "next"]
```

## Development

```bash
git clone https://github.com/RealMtrx/repoinsight.git
cd repoinsight
npm install
npm run build
npm run test        # 255+ tests
npm run lint        # zero errors
npm run typecheck   # strict TypeScript
```

### Project Structure

```
src/
  commands/     — 14 CLI commands with Commander
  config/       — Config loading (repoinsight.json, .repoinsightrc)
  constants/    — App constants, defaults
  core/         — AnalyzerEngine, Scanner, Cache
  detection/    — Technology detection engine
  models/       — Data models (AnalysisOptions, Report)
  reporters/    — Terminal, HTML, Markdown, JSON reporters
  tui/          — Interactive Ink TUI (App, Dashboard, ResultsView, etc.)
  types/        — TypeScript types and Zod schemas
  utils/        — File, git, scoring utilities
tests/
  unit/         — Unit tests (vitest)
  integration/  — Integration tests
  fixtures/     — Test fixtures
```

## License

MIT © [Mtrx](https://github.com/RealMtrx)
