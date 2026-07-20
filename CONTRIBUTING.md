# Contributing to repoinsight

Thank you for considering contributing to repoinsight. This document outlines the guidelines for
contributing, the development workflow, and the standards we uphold.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Project Architecture](#project-architecture)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)

---

## Code of Conduct

This project and everyone participating in it is governed by the
[Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.
Please report unacceptable behavior to the maintainers.

---

## How Can I Contribute?

### Reporting Bugs

Before submitting a bug report, check the
[issue tracker](https://github.com/RealMtrx/repoinsight/issues) to see if the issue has already been
reported. If not, open a new issue using the
[bug report template](https://github.com/RealMtrx/repoinsight/issues/new?template=bug_report.yml).

**A great bug report includes:**

- A clear, descriptive title
- Steps to reproduce the issue
- Expected and actual behavior
- Environment details (OS, Node.js version, repoinsight version)
- Screenshots or error logs if applicable

### Suggesting Features

Open a new issue using the
[feature request template](https://github.com/RealMtrx/repoinsight/issues/new?template=feature_request.yml).
Describe the feature, why it's useful, and how it should work.

### Improving Documentation

Documentation improvements are always welcome. This includes fixing typos, clarifying explanations,
adding examples, and translating content.

### Writing Code

Check the issue tracker for issues labeled `good-first-issue` or `help-wanted`. If you plan to work
on a significant feature, please open an issue first to discuss it.

---

## Development Setup

### Prerequisites

- **Node.js** 20 or later
- **Git**

### Getting started

```bash
# Fork and clone the repository
git clone https://github.com/your-username/repoinsight.git
cd repoinsight

# Add the upstream remote
git remote add upstream https://github.com/RealMtrx/repoinsight.git

# Install dependencies
npm install

# Build the project
npm run build

# Run the full validation suite
npm run all
```

---

## Project Architecture

repoinsight follows a clean layered architecture:

```
src/
├── commands/        # CLI command implementations (Commander)
├── core/            # Scanner (filesystem traversal), AnalyzerEngine (analysis orchestration)
├── reporters/       # Output formatters: Terminal, JSON, Markdown, HTML
├── models/          # Data models with Zod validation
├── types/           # TypeScript type definitions and schemas
├── utils/           # File system helpers, Git integration, scoring logic
├── config/          # User configuration management
└── constants/       # App-wide constants, language maps, thresholds
```

### Adding a new analyzer

1. Add the analysis logic to `src/core/AnalyzerEngine.ts`
2. Add any new types to `src/types/index.ts`
3. Add the score contribution to `src/utils/scoring.ts`
4. Update the report display in each reporter under `src/reporters/`

### Adding a new output format

1. Create a new reporter class in `src/reporters/` implementing the format
2. Add it to `src/reporters/index.ts`
3. Add the corresponding CLI command in `src/commands/scan.ts`

---

## Coding Standards

### Language and runtime

- **TypeScript** with strict mode (`strict: true` in tsconfig)
- **ESM** modules only (no CommonJS)
- **Node.js 20** target

### Style guide

- **Indentation:** 2 spaces, no tabs
- **Quotes:** Double quotes for strings
- **Semicolons:** Required
- **Trailing commas:** Always
- **Line length:** 100 characters maximum

The project uses ESLint and Prettier to enforce code style. Run `npm run format` and `npm run lint`
before committing.

### TypeScript conventions

- Avoid `any` — use `unknown` when the type is truly unknown
- Prefer `interface` over `type` for object shapes
- Use `type` for unions, intersections, and utility types
- All public functions and methods must have typed parameters and return types
- Use `readonly` for immutable properties
- Use `as const` for literal types
- Prefer nullish coalescing (`??`) over logical OR (`||`)

### Naming conventions

| Element    | Convention                                  | Example                    |
| ---------- | ------------------------------------------- | -------------------------- |
| Variables  | camelCase                                   | `fileCount`                |
| Functions  | camelCase                                   | `calculateScore()`         |
| Classes    | PascalCase                                  | `AnalyzerEngine`           |
| Interfaces | PascalCase                                  | `AnalysisReport`           |
| Types      | PascalCase                                  | `ScoreStatus`              |
| Constants  | UPPER_SNAKE                                 | `DEFAULT_EXCLUDE_PATTERNS` |
| Files      | PascalCase (classes), camelCase (utilities) | `Scanner.ts`, `scoring.ts` |
| Tests      | `.test.ts` suffix                           | `scanner.test.ts`          |

### Imports

- Use explicit file extensions for local imports: `import { Foo } from "./foo.js"`
- Group imports: standard library → external dependencies → internal modules
- No barrel imports (`import *`) for external packages

---

## Testing

We use [Vitest](https://vitest.dev) for testing.

### Running tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

### Test guidelines

- Write tests for all new features
- Aim for at least 80% code coverage
- Tests should be deterministic and isolated
- Use descriptive test names following the pattern: `"does X when Y"`
- Place unit tests in `tests/unit/` and integration tests in `tests/integration/`

### Example test structure

```typescript
import { describe, it, expect } from "vitest";
import { formatFileSize } from "../../src/utils/file.js";

describe("formatFileSize", () => {
  it("formats bytes correctly", () => {
    expect(formatFileSize(500)).toBe("500.00 B");
  });

  it("formats kilobytes correctly", () => {
    expect(formatFileSize(2048)).toBe("2.00 KB");
  });
});
```

---

## Pull Request Process

1. **Create a branch** from `main` with a descriptive name: `feat/add-csharp-analyzer`,
   `fix/secret-detection-typo`, `docs/improve-readme`
2. **Make your changes** following the coding standards above
3. **Write or update tests** to cover your changes
4. **Ensure all checks pass**: `npm run all` (format, lint, typecheck, test, build)
5. **Update documentation** if your changes affect the API or user-facing behavior
6. **Open a pull request** using the [PR template](PULL_REQUEST_TEMPLATE.md)
7. **Address review feedback** — maintainers may request changes before merging

### Pull request guidelines

- Keep PRs focused on a single concern. Split large changes into multiple PRs.
- Write a clear PR description explaining what and why.
- Reference related issues: `Closes #123`.
- Ensure your branch is up to date with `main` before submitting.

---

## Release Process

Releases are automated via GitHub Actions. When a maintainer pushes a tag matching `v*`, the
[release workflow](.github/workflows/release.yml) automatically:

1. Builds the project
2. Publishes to npm
3. Creates a GitHub Release with release notes

### Versioning

This project follows [Semantic Versioning](https://semver.org/):

- **MAJOR** — Breaking API changes
- **MINOR** — New features (backward compatible)
- **PATCH** — Bug fixes (backward compatible)

---

## Questions?

If you have questions about contributing, open a
[Discussion](https://github.com/RealMtrx/repoinsight/discussions) or reach out to the maintainers on
the issue tracker.
