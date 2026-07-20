# Roadmap

This document outlines the planned direction for repoinsight. Items are organized by release
milestone and are subject to change based on community feedback and maintainer availability.

---

## v1.0 — Released

The initial release focuses on comprehensive local repository analysis with multiple output formats.

- [x] Full repository scanning and analysis
- [x] Language detection for 50+ programming languages
- [x] Git statistics and contributor analysis
- [x] Security scanning (secrets, tokens, keys)
- [x] Code quality metrics (complexity, duplication, circular imports)
- [x] Dependency analysis (unused dependencies)
- [x] Documentation audit (README, LICENSE, .gitignore, CI)
- [x] Multiple output formats: Terminal, JSON, Markdown, HTML
- [x] Project health scoring across 8 categories

## v1.1 — Up next

- [ ] **Configurable rule sets** — Allow users to define custom severity thresholds and ignore
      patterns via `.repoinsightrc` or `repoinsight.config.json`
- [ ] **Offline vulnerability lookup** — Local database of known vulnerabilities for common packages
      (updated via periodic `repoinsight update` command)
- [ ] **GitHub Actions annotations** — Output report annotations directly in pull request diffs
- [ ] **`.repoinsightignore` file** — Per-project exclusion patterns similar to `.gitignore`
- [ ] **Performance profiling** — Detect slow functions, large bundles, and import bottlenecks
- [ ] **Incremental scanning** — Only analyze changed files since the last scan for large monorepos

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

---

## How to influence the roadmap

- **Vote on issues** — Add a thumbs-up reaction on GitHub issues you want to see prioritized
- **Submit feature requests** — Use the
  [feature request template](https://github.com/RealMtrx/repoinsight/issues/new?template=feature_request.yml)
- **Open a discussion** — Start a conversation in
  [GitHub Discussions](https://github.com/RealMtrx/repoinsight/discussions)
- **Contribute code** — PRs are welcome for any unplanned feature; open an issue first to discuss
  scope
