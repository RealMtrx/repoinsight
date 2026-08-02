import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

export interface ProjectLicense {
  file: string | null;
  spdx: string | null;
  name: string | null;
}

const LICENSE_FILE_NAMES = [
  "LICENSE",
  "LICENSE.md",
  "LICENSE.txt",
  "LICENSE.markdown",
  "LICENSE-MIT",
  "LICENSE-MIT.txt",
  "LICENSE-MIT.md",
  "LICENSE-APACHE",
  "LICENSE-APACHE.txt",
  "LICENSE-APACHE.md",
  "COPYING",
  "COPYING.md",
  "COPYING.txt",
  "UNLICENSE",
  "UNLICENSE.txt",
];

const SPDX_EXPRESSIONS = new Set([
  "MIT",
  "Apache-2.0",
  "ISC",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "GPL-2.0-only",
  "GPL-3.0-only",
  "LGPL-2.1-only",
  "LGPL-3.0-only",
  "MPL-2.0",
  "Unlicense",
  "WTFPL",
  "CC0-1.0",
  "UNLICENSED",
]);

const SPDX_PATTERNS: { regex: RegExp; spdx: string; name: string }[] = [
  {
    regex: /Permission is hereby granted, free of charge[\s\S]{0,400}?the Software/im,
    spdx: "MIT",
    name: "MIT License",
  },
  {
    regex: /Apache License[\s\S]{0,600}?Version 2\.0/i,
    spdx: "Apache-2.0",
    name: "Apache License 2.0",
  },
  {
    regex: /GNU (?:AFFERO )?GENERAL PUBLIC LICENSE[\s\S]{0,800}?Version 3/i,
    spdx: "AGPL-3.0-only",
    name: "GNU AGPL v3",
  },
  {
    regex: /GNU GENERAL PUBLIC LICENSE[\s\S]{0,800}?Version 3/i,
    spdx: "GPL-3.0-only",
    name: "GNU GPL v3",
  },
  {
    regex: /GNU GENERAL PUBLIC LICENSE[\s\S]{0,800}?Version 2/i,
    spdx: "GPL-2.0-only",
    name: "GNU GPL v2",
  },
  {
    regex: /GNU LESSER GENERAL PUBLIC LICENSE[\s\S]{0,800}?Version 3/i,
    spdx: "LGPL-3.0-only",
    name: "GNU LGPL v3",
  },
  {
    regex: /GNU LESSER GENERAL PUBLIC LICENSE[\s\S]{0,800}?Version 2/i,
    spdx: "LGPL-2.1-only",
    name: "GNU LGPL v2.1",
  },
  {
    regex: /Redistribution and use in source and binary forms,[\s\S]{0,900}?Neither the name of?/im,
    spdx: "BSD-3-Clause",
    name: "BSD 3-Clause",
  },
  {
    regex:
      /Redistribution and use in source and binary forms,[\s\S]{0,900}?All advertising materials?/im,
    spdx: "BSD-4-Clause",
    name: "BSD 4-Clause",
  },
  {
    regex:
      /Redistribution and use in source and binary forms,[\s\S]{0,600}?Redistributions in binary form must/i,
    spdx: "BSD-2-Clause",
    name: "BSD 2-Clause",
  },
  {
    regex: /Permission to use, copy, modify, and\/or distribute this software/im,
    spdx: "ISC",
    name: "ISC License",
  },
  {
    regex: /Mozilla Public License[\s\S]{0,400}?Version 2/i,
    spdx: "MPL-2.0",
    name: "Mozilla Public License 2.0",
  },
  {
    regex: /DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE/i,
    spdx: "WTFPL",
    name: "WTFPL",
  },
  {
    regex: /This is free and unencumbered software released into the public domain/im,
    spdx: "Unlicense",
    name: "The Unlicense",
  },
];

export function findLicenseFile(directory: string): string | null {
  for (const name of LICENSE_FILE_NAMES) {
    if (existsSync(path.join(directory, name))) {
      return path.join(directory, name);
    }
  }
  try {
    const entries = readdirSync(directory);
    for (const entry of entries) {
      if (/^license(\.md|\.txt|\.markdown)?$/i.test(entry)) {
        return path.join(directory, entry);
      }
    }
  } catch {
    /* directory unreadable */
  }
  return null;
}

export function detectSpdxLicense(filePath: string): {
  spdx: string | null;
  name: string | null;
} {
  let text: string;
  try {
    text = readFileSync(filePath, "utf-8");
  } catch {
    return { spdx: null, name: null };
  }
  const head = text.slice(0, 5000);
  for (const { regex, spdx, name } of SPDX_PATTERNS) {
    if (!spdx) {
      continue;
    }
    regex.lastIndex = 0;
    if (regex.test(head)) {
      return { spdx, name };
    }
  }
  return { spdx: null, name: null };
}

export function findLicenseInPackageJson(root: string): {
  spdx: string | null;
  name: string | null;
} {
  try {
    const pkgPath = path.join(root, "package.json");
    if (!existsSync(pkgPath)) {
      return { spdx: null, name: null };
    }
    const parsed = JSON.parse(readFileSync(pkgPath, "utf-8")) as Record<string, unknown>;
    const raw = parsed.license;
    if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (SPDX_EXPRESSIONS.has(trimmed)) {
        return { spdx: trimmed, name: trimmed };
      }
      return { spdx: null, name: trimmed };
    }
    if (raw && typeof raw === "object") {
      const type = (raw as Record<string, unknown>).type;
      if (typeof type === "string") {
        const trimmed = type.trim();
        if (SPDX_EXPRESSIONS.has(trimmed)) {
          return { spdx: trimmed, name: trimmed };
        }
        return { spdx: null, name: trimmed };
      }
    }
  } catch {
    /* unreadable or invalid package.json */
  }
  return { spdx: null, name: null };
}

export function getProjectLicense(root: string): ProjectLicense {
  const file = findLicenseFile(root);
  if (file) {
    const detected = detectSpdxLicense(file);
    return {
      file: path.basename(file),
      spdx: detected.spdx,
      name: detected.name ?? path.basename(file).replace(/\.(md|txt|markdown)$/i, ""),
    };
  }
  const fromPkg = findLicenseInPackageJson(root);
  if (fromPkg.spdx || fromPkg.name) {
    return { file: null, spdx: fromPkg.spdx, name: fromPkg.name };
  }
  return { file: null, spdx: null, name: null };
}
