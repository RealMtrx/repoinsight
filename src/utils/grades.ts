export function grade(score: number): "A" | "B" | "C" | "D" | "F" {
  if (score >= 90) {
    return "A";
  }
  if (score >= 80) {
    return "B";
  }
  if (score >= 65) {
    return "C";
  }
  if (score >= 50) {
    return "D";
  }
  return "F";
}

export function scoreColor(score: number): "success" | "medium" | "high" {
  if (score >= 80) {
    return "success";
  }
  if (score >= 60) {
    return "medium";
  }
  return "high";
}
