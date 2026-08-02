import { theme, styles } from "./colors.js";
import { icons } from "./symbols.js";
import { visibleLength, repeat } from "./utils.js";

export interface BoxOptions {
  title?: string;
  width?: number;
  padding?: number;
  borderColor?: (s: string) => string;
  titleColor?: (s: string) => string;
  align?: "left" | "center";
}

export function createBox(lines: (string | string[])[], opts: BoxOptions = {}): string {
  const width = opts.width ?? 72;
  const pad = opts.padding ?? 1;
  const border = opts.borderColor ?? theme.border;
  const titleColor = opts.titleColor ?? styles.subheading;
  const align = opts.align ?? "left";

  const contentWidth = width - pad * 2 - 2;
  const result: string[] = [];

  const topLeft = border(icons.topLeft);
  const topRight = border(icons.topRight);
  const bottomLeft = border(icons.bottomLeft);
  const bottomRight = border(icons.bottomRight);
  const hLine = border(icons.horizontal);
  const vLine = border(icons.vertical);

  if (opts.title) {
    const titleText = ` ${titleColor(opts.title)} `;
    const leftPad = Math.max(0, width - visibleLength(titleText) - 2);
    result.push(topLeft + hLine + titleText + hLine.repeat(leftPad) + topRight);
  } else {
    result.push(topLeft + repeat(hLine, width) + topRight);
  }

  const padLine = vLine + repeat(" ", width) + vLine;

  if (pad > 0) {
    result.push(padLine);
  }

  for (const line of lines) {
    const lineArray = Array.isArray(line) ? line : [line];
    for (const l of lineArray) {
      const vLen = visibleLength(l);
      if (align === "center") {
        const leftPad = Math.max(0, Math.floor((contentWidth - vLen) / 2));
        const rightPad = Math.max(0, contentWidth - vLen - leftPad);
        result.push(
          vLine +
            repeat(" ", pad) +
            repeat(" ", leftPad) +
            l +
            repeat(" ", rightPad) +
            repeat(" ", pad) +
            vLine,
        );
      } else {
        const rightPad = Math.max(0, contentWidth - vLen);
        result.push(vLine + repeat(" ", pad) + l + repeat(" ", rightPad + pad) + vLine);
      }
    }
  }

  if (pad > 0) {
    result.push(padLine);
  }

  result.push(bottomLeft + repeat(hLine, width) + bottomRight);
  return result.join("\n");
}

export function createBadge(text: string, color: (s: string) => string = styles.label): string {
  return color(` ${text} `);
}

export function createTag(text: string, color: (s: string) => string = styles.keyword): string {
  return color(icons.diamond + " " + text);
}
