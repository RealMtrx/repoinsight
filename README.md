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

- **Interactive TUI** — keyboard-navigable terminal interface with repository overview
- **14 Commands** — analyze, doctor, report, init, config, fix, stats, graph, deps, licenses,
  security, cache, update, help
- **Smart Detection** — auto-detects package manager, monorepo tools, frameworks, test runners,
  CI/CD, linters, and more
- **4 Report Formats** — terminal (ANSI), HTML (dark theme), Markdown, JSON
- **Performance** — parallel file scanning, smart caching, incremental analysis
- **Scoring** — 8-category health score with actionable recommendations
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
# Analyze the current directory
repoinsight analyze

# Analyze a specific path
repoinsight analyze ./path/to/project

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
| `analyze`  | `a`, `inspect` | Full repository analysis             |
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

### Keyboard Shortcuts

| Key               | Action                    |
| ----------------- | ------------------------- |
| `↑`/`↓`           | Navigate menu             |
| `Enter`           | Select / launch command   |
| `Ctrl+K`          | Open command palette      |
| `Ctrl+C`          | Quit (safety prompt)      |
| `Esc`             | Back / close palette      |
| `Tab`             | Cycle through menu items  |
| `PageUp`/`PageDn` | Jump to first / last item |
| `Q`               | Quit / back to dashboard  |
| `R`               | Re-scan repository        |
| `←`/`→`           | Navigate results sections |

### Views

- **Dashboard** — repository metadata, detected technologies, and action menu
- **Progress** — animated scan indicator while analysis runs
- **Results** — six-section detailed report (Summary, Scores, Languages, Technologies, Files &
  Folders, Recommendations)
- **Stats** — repository statistics with Git data
- **Command Palette** — fuzzy-searchable quick commands (`Ctrl+K`)

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
