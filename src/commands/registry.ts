import type { CommandDefinition } from "./types.js";
import { theme, styles, icons } from "../tui/index.js";

const definitions = new Map<string, CommandDefinition>();

export function register(def: CommandDefinition): void {
  definitions.set(def.name, def);
}

export function getAll(): CommandDefinition[] {
  return Array.from(definitions.values());
}

export function get(name: string): CommandDefinition | undefined {
  return definitions.get(name);
}

export function createHelpPage(def: CommandDefinition): string {
  const lines: string[] = [];

  lines.push("");
  lines.push(theme.primary.bold(` ${icons.diamond} ${def.name}`));
  lines.push(theme.muted(` ${def.description}`));
  lines.push("");

  if (def.examples.length > 0) {
    lines.push(styles.subheading(` ${icons.arrow} Examples`));
    for (const ex of def.examples) {
      lines.push(`   ${styles.code("$ " + ex.usage)}`);
      lines.push(`   ${styles.dim(ex.description)}`);
      lines.push("");
    }
  }

  if (def.aliases.length > 0) {
    lines.push(styles.subheading(` ${icons.arrow} Aliases`));
    lines.push(`   ${def.aliases.map((a) => styles.code(a)).join(", ")}`);
    lines.push("");
  }

  lines.push(styles.subheading(` ${icons.arrow} Category`));
  lines.push(`   ${styles.label(def.category)}`);
  lines.push("");

  return lines.join("\n");
}
