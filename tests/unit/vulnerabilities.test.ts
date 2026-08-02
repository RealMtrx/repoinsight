import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { mkdirSync, writeFileSync, mkdtempSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { scanForVulnerabilities } from "../../src/core/vulnerabilities.js";

describe("scanForVulnerabilities", () => {
  let dir: string;
  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("flags known vulnerable packages from package.json ranges", async () => {
    dir = mkdtempSync(join(tmpdir(), "vuln-test-"));
    writeFileSync(
      join(dir, "package.json"),
      JSON.stringify({
        dependencies: {
          lodash: "^4.17.0",
          semver: "^7.5.1",
        },
      }),
    );

    const findings = await scanForVulnerabilities(dir);
    const lodash = findings.find((f) => f.package === "lodash");
    const semver = findings.find((f) => f.package === "semver");
    expect(lodash).toBeDefined();
    expect(lodash?.id).toBe("CVE-2021-23337");
    expect(semver).toBeDefined();
    expect(semver?.severity).toBe("warning");
    expect(lodash?.installedVersion).toBe("^4.17.0");
  });

  it("uses installed version from package-lock.json when present", async () => {
    dir = mkdtempSync(join(tmpdir(), "vuln-test-"));
    writeFileSync(join(dir, "package.json"), JSON.stringify({ dependencies: { minimist: "^1.2.0" } }));
    writeFileSync(
      join(dir, "package-lock.json"),
      JSON.stringify({
        lockfileVersion: 3,
        packages: { "node_modules/minimist": { version: "1.2.5" } },
      }),
    );

    const findings = await scanForVulnerabilities(dir);
    const minimist = findings.find((f) => f.package === "minimist");
    expect(minimist).toBeDefined();
    expect(minimist?.installedVersion).toBe("1.2.5");
  });

  it("does not flag patched versions from lock file", async () => {
    dir = mkdtempSync(join(tmpdir(), "vuln-test-"));
    writeFileSync(join(dir, "package.json"), JSON.stringify({ dependencies: { semver: "^7.5.2" } }));
    writeFileSync(
      join(dir, "package-lock.json"),
      JSON.stringify({
        lockfileVersion: 3,
        packages: { "node_modules/semver": { version: "7.6.0" } },
      }),
    );

    const findings = await scanForVulnerabilities(dir);
    expect(findings.filter((f) => f.package === "semver")).toHaveLength(0);
  });

  it("returns empty for unknown or safe dependencies", async () => {
    dir = mkdtempSync(join(tmpdir(), "vuln-test-"));
    writeFileSync(
      join(dir, "package.json"),
      JSON.stringify({ dependencies: { "not-a-real-dep": "^1.0.0" } }),
    );
    const findings = await scanForVulnerabilities(dir);
    expect(findings).toHaveLength(0);
  });
});