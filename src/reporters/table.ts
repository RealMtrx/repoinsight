import Table from "cli-table3";
import { icons } from "../tui/symbols.js";

const THEME_CHARS = {
  top: icons.horizontal,
  "top-mid": icons.teeDown,
  "top-left": icons.topLeft,
  "top-right": icons.topRight,
  bottom: icons.horizontal,
  "bottom-mid": icons.teeUp,
  "bottom-left": icons.bottomLeft,
  "bottom-right": icons.bottomRight,
  left: icons.vertical,
  "left-mid": icons.teeRight,
  mid: icons.horizontal,
  "mid-mid": icons.crossLine,
  right: icons.vertical,
  "right-mid": icons.teeLeft,
  middle: " ",
} as const;

type BorderColor = "grey" | "yellow" | "red";

export function createTable(head: string[], borderColor: BorderColor = "grey"): Table.Table {
  return new Table({
    head,
    style: { head: [], border: [borderColor] },
    chars: { ...THEME_CHARS },
  });
}
