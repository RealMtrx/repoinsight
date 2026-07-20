<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/RealMtrx/repolens/main/assets/repolens-dark.svg">
    <img alt="RepoLens" src="https://raw.githubusercontent.com/RealMtrx/repolens/main/assets/repolens-light.svg" width="400">
  </picture>
</p>

<p align="center">
  <strong>Understand any repository in seconds.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/repolens"><img src="https://img.shields.io/npm/v/repolens.svg?style=flat&logo=npm&label=version" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/repolens"><img src="https://img.shields.io/npm/dm/repolens.svg?style=flat&logo=npm" alt="npm downloads"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/RealMtrx/repolens.svg?style=flat" alt="MIT License"></a>
  <a href="https://github.com/RealMtrx/repolens/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/RealMtrx/repolens/ci.yml?style=flat&logo=github" alt="CI status"></a>
  <a href="https://codecov.io/gh/RealMtrx/repolens"><img src="https://img.shields.io/codecov/c/github/RealMtrx/repolens?style=flat&logo=codecov" alt="codecov"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/node/v/repolens?style=flat&logo=node.js" alt="node version"></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/types-TypeScript-3178C6.svg?style=flat&logo=typescript" alt="TypeScript"></a>
  <a href="https://github.com/RealMtrx/repolens/pulls"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat" alt="PRs welcome"></a>
</p>

---

RepoLens is a **production-grade CLI tool** that scans any local Git repository and produces a
detailed health report. It works **completely offline** — no API keys, no servers, no telemetry, no
analytics. Point it at any directory and get an instant, actionable breakdown of your project's
health.

---

## Why RepoLens?

Every codebase accumulates issues over time. Unused dependencies pile up, hardcoded secrets leak
into commits, documentation goes missing, and complexity spirals out of control. RepoLens gives
developers and teams an **instant, objective health assessment** of any repository — no
configuration, no setup, no signup.

**Use RepoLens to:**

- **Audit** a new project before contributing
- **Review** pull requests with automated insights
- **Monitor** codebase health over time via CI
- **Discover** security issues before they reach production
- **Improve** documentation, testing, and code quality standards
- **Onboard** developers faster with clear project snapshots

---

## Features

### Project Health Score

An overall score from 0–100 across eight weighted categories: Documentation, Testing, Structure,
Dependencies, Security, Maintainability, Performance, and Code Quality.

### Repository Scanning

- **Folder structure** — Visual directory tree with nesting
- **Language breakdown** — Detect 50+ programming languages used in the project
- **Biggest folders** — Identify folders consuming the most disk space
- **Biggest files** — Find the largest source files in the repository
- **Empty folders** — Detect and list directories with no content

### Git Analysis

- **Commit count** — Total number of commits in the current branch
- **Branch count** — Number of local branches
- **Contributors** — List of all contributors with commit counts
- **Largest commits** — Commits that touched the most files
- **First and last commit dates** — Project timeline information

### Security Scanning

- **Hardcoded secrets** — Detect private keys, AWS keys, GitHub tokens, Discord tokens, Google API
  keys, JWT secrets, and passwords
- **Committed `.env` files** — Flag environment files that should not be version-controlled

### Code Quality

- **Circular imports** — Detect dependency cycles between modules
- **Duplicate code** — Basic duplicate block detection across files
- **Code complexity** — Cyclomatic complexity, function count, and nesting depth per file
- **TODO/FIXME detection** — Scan for incomplete work markers throughout the codebase

### Dependency Analysis

- **Unused dependencies** — Packages installed but never imported
- **Missing dependencies** — Imports that resolve to no installed package
- **Outdated dependencies** — Locally available version information from lockfiles

### Documentation Audit

- **Missing README** — Check if a README file exists
- **Missing LICENSE** — Verify license presence
- **Missing `.gitignore`** — Ensure Git exclusion rules are set up
- **Missing tests** — Detect whether test files or directories exist
- **Missing CI** — Check for CI/CD configuration files

### Output Formats

| Format       | Description                                                                            |
| ------------ | -------------------------------------------------------------------------------------- |
| **Terminal** | Beautiful CLI output with progress spinners, colored tables, and summary cards         |
| **JSON**     | Machine-readable output for CI/CD pipelines and tooling                                |
| **Markdown** | Clean report format ideal for pull requests and documentation                          |
| **HTML**     | Modern responsive report with dark/light mode, progress bars, and interactive elements |

---

## Installation

### Global install (recommended)

```bash
npm install -g repolens
```

### Local development dependency

```bash
npm install --save-dev repolens
```

### Run without installing

```bash
npx repolens scan
```

### System requirements

- **Node.js** 20 or later
- **Git** (for repository analysis features)
- Windows, macOS, or Linux

---

## Usage

### Quick start

```bash
# Scan the current directory
repolens scan

# Scan a specific project
repolens scan ./path/to/project
```

### Generate a health report

```bash
# Detailed terminal report
repolens report

# Run diagnostics (focused on issues)
repolens doctor
```

### Export reports

```bash
# JSON format
repolens json ./project report.json

# Markdown format
repolens markdown ./project report.md

# HTML format (opens a full-page report)
repolens html ./project report.html
```

### Help and version

```bash
repolens --help
repolens --version
```

---

## CLI Examples

### Basic scan output

```bash
$ repolens scan ./my-project
```

Displays a header with the project name and path, a summary card with file/folder/commit counts and
the overall score, a category score grid, language breakdown, Git statistics, a list of any detected
issues (secrets, TODOs, circular imports), and recommendations.

### HTML report

```bash
$ repolens html ./my-project
✓ HTML report saved to repolens-report.html
```

Open the generated HTML file in any browser for a full interactive report with dark/light mode
toggle.

### CI integration

```bash
$ repolens json ./project > report.json
```

The JSON output can be parsed in CI pipelines to enforce quality gates (e.g., fail the build if the
score drops below 60).

---

## Screenshots

<p align="center">
  <em>Terminal output</em>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/RealMtrx/repolens/main/assets/screenshot-terminal.png" alt="Terminal report screenshot" width="700">
</p>

<p align="center">
  <em>HTML report</em>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/RealMtrx/repolens/main/assets/screenshot-html.png" alt="HTML report screenshot" width="700">
</p>

---

## Architecture

RepoLens follows a clean layered architecture that separates concerns into distinct modules:

```
src/
├── commands/        # CLI command implementations (scan, report, doctor, etc.)
├── core/            # Scanner (file system walk) and AnalyzerEngine (all analysis logic)
├── reporters/       # Output formatters: Terminal, JSON, Markdown, HTML
├── models/          # Data models with Zod validation
├── types/           # TypeScript type definitions and Zod schemas
├── utils/           # File utilities, Git integration, scoring engine
├── config/          # User configuration management
└── constants/       # App-wide constants, language detection maps, thresholds
```

### Key design decisions

- **Offline-first** — No external API calls or network requests
- **Composable analyzers** — Each analysis dimension is a separate module
- **Pluggable reporters** — Adding a new output format requires only a new reporter class
- **Zod validation** — All user inputs and configuration are validated at the boundary
- **Score weighting** — Category weights are configurable via `repolens.config.json`

---

## Score Categories

| Category        | Weight | Description                                                |
| --------------- | ------ | ---------------------------------------------------------- |
| Documentation   | 15%    | README, LICENSE, inline documentation quality              |
| Testing         | 15%    | Presence and coverage of test files                        |
| Structure       | 12%    | Folder organization, naming conventions, empty directories |
| Dependencies    | 12%    | Dependency management, unused or missing packages          |
| Security        | 15%    | Hardcoded secrets, committed environment files             |
| Maintainability | 12%    | TODO/FIXME density, code duplication                       |
| Performance     | 9%     | Large assets, binary file bloat                            |
| Code Quality    | 10%    | Cyclomatic complexity, circular imports, CI configuration  |

---

## Roadmap

### v1.0 — Current

- [x] Full repository scanning and analysis
- [x] Language detection for 50+ programming languages
- [x] Git statistics and contributor analysis
- [x] Security scanning (secrets, tokens, keys)
- [x] Code quality metrics (complexity, duplication, circular imports)
- [x] Dependency analysis (unused Dependencies)
- [x] Documentation audit (README, LICENSE, .gitignore, CI)
- [x] Multiple output formats: Terminal, JSON, Markdown, HTML
- [x] Project health scoring across 8 categories

### v1.1 — Up next

- [ ] Configurable rule sets and ignore patterns
- [ ] Offline dependency vulnerability lookup (local database)
- [ ] GitHub Actions annotation output
- [ ] `.repolensignore` file support
- [ ] Performance profiling and bottleneck detection

### v2.0 — Future

- [ ] Plugin system for custom analyzers and reporters
- [ ] Historical tracking and trend charts
- [ ] Repository comparison mode
- [ ] VS Code extension
- [ ] Web dashboard with team reports
- [ ] Incremental analysis for large monorepos

---

## Configuration

Create a `repolens.config.json` file in your project root to customize behavior:

```json
{
  "excludePatterns": ["**/generated/**", "**/vendor/**"],
  "maxFileSize": 5242880,
  "scoreWeights": {
    "documentation": 10,
    "security": 20,
    "testing": 15,
    "structure": 10,
    "dependencies": 10,
    "maintainability": 15,
    "performance": 10,
    "codeQuality": 10
  }
}
```

---

## Contributing

We welcome contributions of all sizes. Please see [CONTRIBUTING.md](CONTRIBUTING.md) for detailed
guidelines.

### Quick start for contributors

```bash
# Clone the repository
git clone https://github.com/RealMtrx/repolens.git
cd repolens

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run linting
npm run lint
```

### Development scripts

| Command             | Description                                  |
| ------------------- | -------------------------------------------- |
| `npm run build`     | Build the project with tsup                  |
| `npm run dev`       | Watch mode for development                   |
| `npm test`          | Run test suite with Vitest                   |
| `npm run lint`      | Run ESLint                                   |
| `npm run format`    | Format code with Prettier                    |
| `npm run typecheck` | TypeScript type checking                     |
| `npm run all`       | Run format, lint, typecheck, test, and build |

---

## FAQ

### Does RepoLens send any data over the network?

No. RepoLens is fully offline. No API calls, no telemetry, no analytics, no phoning home. Your code
never leaves your machine.

### Does RepoLens require API keys or authentication?

No. Everything runs locally against your local file system.

### Can RepoLens analyze remote GitHub repositories?

Not directly. Clone the repository first, then run `repolens scan` against the local clone. RepoLens
analyzes whatever filesystem path you give it.

### What formats does RepoLens support for output?

Terminal (default), JSON, Markdown, and HTML. Use the corresponding subcommand to choose the format.

### Can I use RepoLens in CI/CD pipelines?

Yes. The JSON output format is designed for CI integration. Pipe the output to a file and parse it
to enforce quality gates.

### How is the project score calculated?

The score is a weighted average of eight category scores (documentation, testing, structure,
dependencies, security, maintainability, performance, and code quality). Each category is scored
from 0–100 based on heuristics and weighted according to the configuration.

---

## License

[MIT](LICENSE) &copy; 2026 RepoLens Contributors

---

## Support

| Resource         | Link                                                                   |
| ---------------- | ---------------------------------------------------------------------- |
| Documentation    | [README](README.md)                                                    |
| Issue Tracker    | [GitHub Issues](https://github.com/RealMtrx/repolens/issues)           |
| Feature Requests | [GitHub Discussions](https://github.com/RealMtrx/repolens/discussions) |
| Security         | [SECURITY.md](SECURITY.md)                                             |
| Changelog        | [CHANGELOG.md](CHANGELOG.md)                                           |

---

<p align="center">
  <sub>Built with care by the RepoLens team &middot; Star us on <a href="https://github.com/RealMtrx/repolens">GitHub</a></sub>
</p>
