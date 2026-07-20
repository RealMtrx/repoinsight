#!/usr/bin/env node

import { run } from "../dist/index.js";

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Error: ${message}\n`);
  process.exit(1);
});
