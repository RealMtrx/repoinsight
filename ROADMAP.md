# Roadmap

This document outlines the planned direction for repoinsight. Items are organized by release
milestone and are subject to change based on community feedback and maintainer availability.

---

## v1.1 — Released

- [x] Interactive TUI with keyboard navigation
- [x] 14 CLI commands with aliases and categorized help
- [x] Comprehensive smart detection (package managers, monorepo tools, frameworks, CI/CD, linters,
      test runners, Docker, git hooks, and more)
- [x] Custom amber/teal/coral TUI design system
- [x] All 4 reporters redesigned with detected technologies display
- [x] Analysis cache for fast re-runs
- [x] Performance optimizations (parallel scanning, safe regex, incremental analysis)
- [x] 255+ tests across 11 test files
- [x] Config system (repoinsight.json, .repoinsightrc)
- [x] Plugin system architecture

## v1.2 — In progress

- [ ] **Configurable rule sets** — Custom severity thresholds and ignore patterns
- [ ] **Offline vulnerability lookup** — Local database of known vulnerabilities
- [ ] **GitHub Actions annotations** — PR comment annotations from analysis
- [x] **`.repoinsightignore` file** — Per-project exclusion patterns
- [ ] **Performance profiling** — Detect slow functions, large bundles, import bottlenecks
- [ ] **Monorepo-aware analysis** — Analyze individual packages within monorepos

## v2.0 — Future

### Plugin system

- [ ] Custom analyzer plugins (Python, Ruby, Rust, etc.)
- [ ] Custom reporter plugins (PDF, Slack, Discord webhooks)
- [ ] Plugin marketplace and discovery

### Historical tracking

- [ ] Store scan results locally for trend analysis
- [ ] Track score changes over time
- [ ] Visualize trends in the HTML report

### Repository comparison

- [ ] Compare two repositories side by side
- [ ] Compare a repository against organizational baselines
- [ ] Diff-based analysis for pull requests

### IDE integration

- [ ] **VS Code extension** with inline annotations and real-time analysis
- [ ] **JetBrains plugin** for IntelliJ IDEs

### Collaboration features

- [ ] **Web dashboard** — Hosted dashboard for team-wide project monitoring
- [ ] **Team reports** — Aggregate scores across multiple repositories
- [ ] **Quality gates** — Define score thresholds that block PRs or deployments
