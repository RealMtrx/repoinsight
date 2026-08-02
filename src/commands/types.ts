import type { Command } from "commander";

export interface CommandExample {
  usage: string;
  description: string;
}

export interface CommandDefinition {
  name: string;
  aliases: string[];
  description: string;
  helpText: string;
  examples: CommandExample[];
  category: string;
  setup: (cmd: Command) => void;
}
