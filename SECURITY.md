# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of repoinsight seriously. If you believe you have found a security
vulnerability, please report it to us through coordinated disclosure.

**Please do not report security vulnerabilities through public GitHub issues, discussions, or pull
requests.**

Instead, send a detailed report to the maintainers via email, or use GitHub's private vulnerability
reporting feature at:

[https://github.com/RealMtrx/repoinsight/security/advisories](https://github.com/RealMtrx/repoinsight/security/advisories)

### What to include

- Type of vulnerability (e.g., path traversal, code execution, data exposure)
- Full paths of source files related to the issue
- Steps to reproduce the vulnerability
- Proof of concept if available
- Impact assessment

### What to expect

- **Acknowledgement** within 72 hours of your report
- **Validation** of the reported issue within 5 business days
- **Remediation** timeline based on severity
- **Credit** in the release notes if you are the first to report

## Scope

Security vulnerabilities in repoinsight itself (the CLI tool and its source code) are in scope. This
includes:

- Code execution vulnerabilities
- Path traversal issues that could read unintended files
- Exposure of sensitive data through tool output
- Supply chain vulnerabilities in dependencies

## Out of scope

- Vulnerabilities in repositories analyzed by repoinsight
- Social engineering of project maintainers
- Attacks requiring physical access to the machine running repoinsight

## Safe Harbor

We consider security research conducted in accordance with this policy as:

- Authorized under the Computer Fraud and Abuse Act (and similar laws)
- Not subject to our standard bug bounty terms (since this project does not operate a bug bounty
  program)
- Protected safe harbor for good-faith security research
