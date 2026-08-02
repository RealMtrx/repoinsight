import { describe, it, expect } from "vitest";
import { formatFileSize, countLines, isBinaryFile, mapLimit } from "../../src/utils/file.js";

describe("formatFileSize", () => {
  it("formats bytes", () => {
    expect(formatFileSize(500)).toBe("500.00 B");
  });

  it("formats kilobytes", () => {
    expect(formatFileSize(2048)).toBe("2.00 KB");
  });

  it("formats megabytes", () => {
    expect(formatFileSize(2_097_152)).toBe("2.00 MB");
  });

  it("formats gigabytes", () => {
    expect(formatFileSize(2_147_483_648)).toBe("2.00 GB");
  });

  it("handles zero", () => {
    expect(formatFileSize(0)).toBe("0.00 B");
  });

  it("formats decimal values", () => {
    expect(formatFileSize(1536)).toBe("1.50 KB");
  });

  it("handles exact megabyte", () => {
    expect(formatFileSize(1_048_576)).toBe("1.00 MB");
  });
});

describe("countLines", () => {
  it("counts lines in a string", () => {
    expect(countLines("line1\nline2\nline3")).toBe(3);
  });

  it("handles empty string", () => {
    expect(countLines("")).toBe(0);
  });

  it("handles single line without newline", () => {
    expect(countLines("only one line")).toBe(1);
  });

  it("handles single line with newline", () => {
    expect(countLines("only one line\n")).toBe(1);
  });

  it("handles trailing newline", () => {
    expect(countLines("line1\nline2\n")).toBe(2);
  });

  it("handles multiple newlines", () => {
    expect(countLines("\n\n\n")).toBe(3);
  });
});

describe("isBinaryFile", () => {
  it("identifies PNG as binary", () => {
    expect(isBinaryFile("image.png")).toBe(true);
  });

  it("identifies JPG as binary", () => {
    expect(isBinaryFile("photo.jpg")).toBe(true);
  });

  it("identifies JPEG as binary", () => {
    expect(isBinaryFile("photo.jpeg")).toBe(true);
  });

  it("identifies GIF as binary", () => {
    expect(isBinaryFile("animation.gif")).toBe(true);
  });

  it("identifies JS as non-binary", () => {
    expect(isBinaryFile("file.js")).toBe(false);
  });

  it("identifies TS as non-binary", () => {
    expect(isBinaryFile("file.ts")).toBe(false);
  });

  it("is case insensitive", () => {
    expect(isBinaryFile("image.PNG")).toBe(true);
    expect(isBinaryFile("image.JPG")).toBe(true);
  });

  it("handles no extension", () => {
    expect(isBinaryFile("Makefile")).toBe(false);
  });

  it("handles unknown extension", () => {
    expect(isBinaryFile("file.xyz")).toBe(false);
  });

  it("detects SVG as binary", () => {
    expect(isBinaryFile("icon.svg")).toBe(true);
  });

  it("detects PDF as binary", () => {
    expect(isBinaryFile("doc.pdf")).toBe(true);
  });
});

describe("mapLimit", () => {
  it("maps all items and preserves order", async () => {
    const result = await mapLimit([1, 2, 3, 4, 5], 2, async (n) => n * 2);
    expect(result).toEqual([2, 4, 6, 8, 10]);
  });

  it("handles empty input", async () => {
    const result = await mapLimit([], 4, async (n) => n);
    expect(result).toEqual([]);
  });

  it("handles limit larger than items", async () => {
    const result = await mapLimit(["a", "b"], 10, async (s) => `${s}!`);
    expect(result).toEqual(["a!", "b!"]);
  });

  it("respects concurrency limit", async () => {
    let running = 0;
    let maxRunning = 0;
    await mapLimit([1, 2, 3, 4, 5, 6], 2, async () => {
      running++;
      maxRunning = Math.max(maxRunning, running);
      await new Promise((resolve) => setTimeout(resolve, 5));
      running--;
    });
    expect(maxRunning).toBeLessThanOrEqual(2);
    expect(maxRunning).toBe(2);
  });

  it("propagates mapper errors", async () => {
    await expect(
      mapLimit([1, 2, 3], 2, async (n) => {
        if (n === 2) {
          throw new Error("boom");
        }
        return n;
      }),
    ).rejects.toThrow("boom");
  });
});
