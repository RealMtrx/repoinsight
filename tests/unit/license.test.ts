import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  findLicenseFile,
  detectSpdxLicense,
  findLicenseInPackageJson,
  getProjectLicense,
} from "../../src/utils/license.js";

let tmpDir: string;

beforeAll(() => {
  tmpDir = mkdtempSync(path.join(tmpdir(), "ri-license-test-"));
});

afterAll(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe("findLicenseFile", () => {
  it("returns null when no license file exists", () => {
    expect(findLicenseFile(tmpDir)).toBeNull();
  });

  it("finds a standard LICENSE file", () => {
    const dir = path.join(tmpDir, "standard");
    require("node:fs").mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, "LICENSE"), "MIT License");
    expect(path.basename(findLicenseFile(dir) ?? "")).toBe("LICENSE");
  });

  it("finds LICENSE.md", () => {
    const dir = path.join(tmpDir, "md");
    require("node:fs").mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, "LICENSE.md"), "MIT License");
    expect(path.basename(findLicenseFile(dir) ?? "")).toBe("LICENSE.md");
  });

  it("matches lower-case license file", () => {
    const dir = path.join(tmpDir, "lower");
    require("node:fs").mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, "license"), "ISC License");
    const found = findLicenseFile(dir);
    expect(found).toBeTruthy();
    expect(path.basename(found ?? "").toLowerCase()).toBe("license");
  });
});

describe("detectSpdxLicense", () => {
  it("detects MIT from text", () => {
    const file = path.join(tmpDir, "mit.txt");
    writeFileSync(
      file,
      "Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the Software), to deal in the Software without restriction",
    );
    expect(detectSpdxLicense(file)).toEqual({ spdx: "MIT", name: "MIT License" });
  });

  it("detects Apache-2.0", () => {
    const file = path.join(tmpDir, "apache.txt");
    writeFileSync(file, "Licensed under the Apache License, Version 2.0 (the License)");
    expect(detectSpdxLicense(file).spdx).toBe("Apache-2.0");
  });

  it("returns nulls for unknown content", () => {
    const file = path.join(tmpDir, "unknown.txt");
    writeFileSync(file, "all rights reserved, no license defined here");
    expect(detectSpdxLicense(file)).toEqual({ spdx: null, name: null });
  });

  it("returns nulls for unreadable file", () => {
    expect(detectSpdxLicense(path.join(tmpDir, "does-not-exist.txt"))).toEqual({
      spdx: null,
      name: null,
    });
  });
});

describe("findLicenseInPackageJson", () => {
  it("reads a string SPDX license", () => {
    const dir = path.join(tmpDir, "pkg-string");
    require("node:fs").mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, "package.json"), JSON.stringify({ license: "ISC" }));
    expect(findLicenseInPackageJson(dir)).toEqual({ spdx: "ISC", name: "ISC" });
  });

  it("reads an object license type", () => {
    const dir = path.join(tmpDir, "pkg-object");
    require("node:fs").mkdirSync(dir, { recursive: true });
    writeFileSync(
      path.join(dir, "package.json"),
      JSON.stringify({ license: { type: "MIT", url: "https://opensource.org/licenses/MIT" } }),
    );
    expect(findLicenseInPackageJson(dir)).toEqual({ spdx: "MIT", name: "MIT" });
  });

  it("returns nulls when missing", () => {
    const dir = path.join(tmpDir, "pkg-none");
    require("node:fs").mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, "package.json"), JSON.stringify({}));
    expect(findLicenseInPackageJson(dir)).toEqual({ spdx: null, name: null });
  });
});

describe("getProjectLicense", () => {
  it("prefers the LICENSE file over package.json", () => {
    const dir = path.join(tmpDir, "prefer-file");
    require("node:fs").mkdirSync(dir, { recursive: true });
    writeFileSync(
      path.join(dir, "LICENSE"),
      "Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the Software), to deal in the Software without restriction",
    );
    writeFileSync(path.join(dir, "package.json"), JSON.stringify({ license: "MIT" }));
    const license = getProjectLicense(dir);
    expect(license.file).toBe("LICENSE");
    expect(license.spdx).toBe("MIT");
  });

  it("falls back to package.json license", () => {
    const dir = path.join(tmpDir, "fallback-pkg");
    require("node:fs").mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, "package.json"), JSON.stringify({ license: "Apache-2.0" }));
    const license = getProjectLicense(dir);
    expect(license.file).toBeNull();
    expect(license.spdx).toBe("Apache-2.0");
  });

  it("returns empty when nothing found", () => {
    const dir = path.join(tmpDir, "nothing");
    require("node:fs").mkdirSync(dir, { recursive: true });
    expect(getProjectLicense(dir)).toEqual({ file: null, spdx: null, name: null });
  });
});
