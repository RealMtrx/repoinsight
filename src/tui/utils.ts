import { icons } from "./symbols.js";

export function terminalWidth(): number {
  return process.stdout.columns ?? 80;
}

export function terminalHeight(): number {
  return process.stdout.rows ?? 24;
}

export function wrapText(text: string, maxWidth: number): string[] {
  if (maxWidth <= 0) {
    return [text];
  }
  const lines: string[] = [];
  const words = text.split(" ");
  let current = "";
  for (const word of words) {
    if (current && (current + " " + word).trim().length > maxWidth) {
      lines.push(current.trim());
      current = "";
    }
    if (word.length > maxWidth) {
      if (current) {
        lines.push(current.trim());
        current = "";
      }
      let remaining = word;
      while (remaining.length > maxWidth) {
        lines.push(remaining.slice(0, maxWidth));
        remaining = remaining.slice(maxWidth);
      }
      current = remaining;
    } else if (current) {
      current += " " + word;
    } else {
      current = word;
    }
  }
  if (current.trim()) {
    lines.push(current.trim());
  }
  return lines;
}

export function repeat(char: string, count: number): string {
  return char.repeat(Math.max(0, count));
}

export function padCenter(text: string, width: number): string {
  const pad = Math.max(0, width - text.length);
  const left = Math.floor(pad / 2);
  const right = pad - left;
  return repeat(" ", left) + text + repeat(" ", right);
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  if (maxLength <= 0) {
    return "";
  }
  const keep = Math.max(0, maxLength - icons.ellipsis.length);
  return text.slice(0, keep) + icons.ellipsis;
}

export function stripAnsi(str: string): string {
  return str.replace(/\x1B\[[0-9;]*m/g, "");
}

export function visibleLength(str: string): number {
  return stripAnsi(str).length;
}

export function dividerLine(char: string = icons.horizontal): string {
  return repeat(char, terminalWidth());
}

export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}m ${s}s`;
}
