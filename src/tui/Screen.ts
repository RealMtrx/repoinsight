import { stdin as processStdin, stdout as processStdout } from "node:process";

type RawListener = (key: string, ctrl: boolean, meta: boolean, shift: boolean) => void;

export interface ScreenOptions {
  title?: string;
  onKey?: RawListener;
  onResize?: () => void;
}

export class Screen {
  private stdin: typeof processStdin;
  private stdout: typeof processStdout;
  private raw = false;
  private listeners: RawListener[] = [];
  private resizeListeners: (() => void)[] = [];
  private dataHandler: ((chunk: Buffer) => void) | null = null;

  constructor() {
    this.stdin = processStdin;
    this.stdout = processStdout;
  }

  enter(): void {
    if (this.raw) {
      return;
    }
    if (this.stdin.isTTY) {
      this.stdin.setRawMode(true);
      this.stdin.resume();
      this.raw = true;
    }
    this.hideCursor();
    this.dataHandler = (chunk: Buffer) => this.handleInput(chunk);
    this.stdin.on("data", this.dataHandler);
    this.stdin.on("resize", this.handleResize);
    this.stdout.write("\x1b[?1049h"); // alternate screen buffer
  }

  exit(): void {
    if (!this.raw) {
      return;
    }
    this.stdout.write("\x1b[?1049l"); // restore main screen
    this.showCursor();
    if (this.stdin.isTTY) {
      this.stdin.setRawMode(false);
      this.stdin.pause();
      this.raw = false;
    }
    if (this.dataHandler) {
      this.stdin.off("data", this.dataHandler);
      this.dataHandler = null;
    }
    this.stdin.off("resize", this.handleResize);
  }

  onKey(listener: RawListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  onResize(listener: () => void): () => void {
    this.resizeListeners.push(listener);
    return () => {
      this.resizeListeners = this.resizeListeners.filter((l) => l !== listener);
    };
  }

  render(content: string): void {
    this.stdout.write("\x1b[H" + content);
  }

  clear(): void {
    this.stdout.write("\x1b[2J\x1b[H");
  }

  get width(): number {
    return this.stdout.columns || 80;
  }

  get height(): number {
    return this.stdout.rows || 24;
  }

  write(text: string): void {
    this.stdout.write(text);
  }

  private handleInput(chunk: Buffer): void {
    const str = chunk.toString();

    if (str === "\x03") {
      this.exit();
      process.exit(130);
    }

    let key = "";
    let ctrl = false;
    let meta = false;
    let shift = false;

    if (str === "\r" || str === "\n" || str === "\r\n") {
      key = "Enter";
    } else if (str === "\t") {
      key = "Tab";
    } else if (str === "\x7f" || str === "\b") {
      key = "Backspace";
    } else if (str.length === 1) {
      const code = str.charCodeAt(0);
      if (code < 32) {
        ctrl = true;
        key = String.fromCharCode(code + 64);
        if (key === "[") {
          key = "Escape";
        }
      } else {
        key = str;
      }
    } else if (str === "\x1b[A") {
      key = "Up";
    } else if (str === "\x1b[B") {
      key = "Down";
    } else if (str === "\x1b[C") {
      key = "Right";
    } else if (str === "\x1b[D") {
      key = "Left";
    } else if (str === "\x1b[H") {
      key = "Home";
    } else if (str === "\x1b[F") {
      key = "End";
    } else if (str === "\x1b[2~") {
      key = "Insert";
    } else if (str === "\x1b[3~") {
      key = "Delete";
    } else if (str === "\x1b[5~") {
      key = "PageUp";
    } else if (str === "\x1b[6~") {
      key = "PageDown";
    } else if (str === "\x1b") {
      key = "Escape";
    } else if (str.startsWith("\x1b[") && str.endsWith("~")) {
      key = "F" + str.slice(2, -1);
    } else if (str.startsWith("\x1b[") && str.endsWith("u")) {
      // kitty protocol CSI u
      const parts = str.slice(2, -1).split(";");
      const code = parseInt(parts[0] ?? "0", 10);
      const mod = parseInt(parts[1] ?? "1", 10);
      ctrl = !!(mod & 2);
      meta = !!(mod & 3);
      shift = !!(mod & 1);
      key = String.fromCodePoint(code >= 0x20 ? code : code + 64);
    } else if (str.startsWith("\x1b[") && str.endsWith("R")) {
      key = "F3";
    } else {
      return; // unknown sequence
    }
    for (const listener of this.listeners) {
      listener(key, ctrl, meta, shift);
    }
  }

  private handleResize = (): void => {
    for (const listener of this.resizeListeners) {
      listener();
    }
  };

  private hideCursor(): void {
    this.stdout.write("\x1b[?25l");
  }

  private showCursor(): void {
    this.stdout.write("\x1b[?25h");
  }
}
