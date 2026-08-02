import { describe, it, expect } from "vitest";
import { grade, scoreColor } from "../../src/utils/grades.js";

describe("grades", () => {
  it("maps scores to letter grades", () => {
    expect(grade(95)).toBe("A");
    expect(grade(89)).toBe("B");
    expect(grade(75)).toBe("C");
    expect(grade(55)).toBe("D");
    expect(grade(30)).toBe("F");
  });

  it("maps boundary scores correctly", () => {
    expect(grade(90)).toBe("A");
    expect(grade(80)).toBe("B");
    expect(grade(65)).toBe("C");
    expect(grade(50)).toBe("D");
  });

  it("scoreColor returns a category for the score", () => {
    expect(scoreColor(95)).toBe("success");
    expect(scoreColor(70)).toBe("medium");
    expect(scoreColor(20)).toBe("high");
  });
});