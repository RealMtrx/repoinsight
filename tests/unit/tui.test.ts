import { describe, it, expect } from "vitest";
import { wrapText, repeat, padCenter, truncate, stripAnsi } from "../../src/tui/utils.js";
import { createBox } from "../../src/tui/Box.js";
import { createProgressBar } from "../../src/tui/Progress.js";
import { createPanel } from "../../src/tui/Panel.js";

describe("wrapText", () => {
  it("wraps text at word boundaries", () => {
    const lines = wrapText("one two three four", 10);
    expect(lines.join(" ")).toBe("one two three four");
    expect(lines.every((l) => stripAnsi(l).length <= 10)).toBe(true);
  });

  it("splits words longer than maxWidth", () => {
    const lines = wrapText("a " + "x".repeat(30) + " b", 10);
    expect(lines.every((l) => stripAnsi(l).length <= 10)).toBe(true);
    expect(lines.join("").replace(/ /g, "")).toBe("a" + "x".repeat(30) + "b");
  });

  it("handles empty input", () => {
    expect(wrapText("", 10)).toEqual([]);
  });

  it("handles invalid maxWidth", () => {
    expect(wrapText("anything", 0)).toEqual(["anything"]);
  });
});

describe("repeat", () => {
  it("repeats char", () => {
    expect(repeat("=", 3)).toBe("===");
  });

  it("clamps negative counts to zero", () => {
    expect(repeat("=", -5)).toBe("");
  });
});

describe("padCenter", () => {
  it("pads to width", () => {
    expect(padCenter("ab", 6)).toBe("  ab  ");
  });

  it("returns text unchanged when longer than width", () => {
    expect(padCenter("abcdefg", 4)).toBe("abcdefg");
  });
});

describe("truncate", () => {
  it("returns text unchanged if within limit", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("truncates and adds ellipsis marker", () => {
    const result = truncate("hello world", 6);
    expect(stripAnsi(result).length).toBeLessThanOrEqual(6);
    expect(result).not.toHaveLength(8);
  });
});

describe("stripAnsi", () => {
  it("removes ANSI escape codes", () => {
    expect(stripAnsi("\u001B[31mred\u001B[0m")).toBe("red");
  });
});

describe("createBox", () => {
  it("renders with title", () => {
    const out = createBox(["content"], { title: " T ", width: 20 });
    expect(out).toContain(" T ");
    expect(out).toContain("content");
  });

  it("does not throw with an over-long title", () => {
    const out = createBox(["content"], {
      title: "This is a very long title that exceeds the configured width of the box",
      width: 20,
    });
    expect(out).toContain("content");
  });

  it("does not throw for tiny widths", () => {
    const out = createBox(["x"], { width: 2 });
    expect(out).toContain("x");
  });

  it("centers content when asked", () => {
    const out = createBox(["c"], { title: "T", width: 16, align: "center" });
    expect(out).toContain("c");
  });
});

describe("createProgressBar", () => {
  it("renders full bar at 100%", () => {
    const out = createProgressBar(10, 10, "done", { width: 10 });
    expect(out).toContain("100%");
  });

  it("renders zero state", () => {
    const out = createProgressBar(0, 0);
    expect(out).toContain("0%");
  });
});

describe("createPanel", () => {
  it("renders bordered panel", () => {
    const out = createPanel(["a", "b"], { title: "P", width: 20 });
    expect(out).toContain("P");
    expect(out).toContain("a");
    expect(out).toContain("b");
  });

  it("renders borderless panel", () => {
    const out = createPanel(["a"], { border: false, width: 20 });
    expect(out).toContain("a");
  });
});
