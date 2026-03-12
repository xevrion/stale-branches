import { describe, it, expect } from "vitest";
import { buildChoices } from "../src/prompt.js";
import type { BranchInfo } from "../src/types.js";

const makeBranch = (overrides: Partial<BranchInfo> = {}): BranchInfo => ({
  name: "feature/test",
  ageDays: 10,
  age: "10 days",
  isMerged: false,
  lastCommit: "some work",
  hasRemote: false,
  isCurrent: false,
  ...overrides,
});

describe("buildChoices", () => {
  it("returns empty array for empty input", () => {
    expect(buildChoices([])).toEqual([]);
  });

  it("sets checked=true for merged branches", () => {
    const branch = makeBranch({ isMerged: true });
    const choices = buildChoices([branch]);
    expect(choices[0].checked).toBe(true);
  });

  it("sets checked=false for unmerged branches", () => {
    const branch = makeBranch({ isMerged: false });
    const choices = buildChoices([branch]);
    expect(choices[0].checked).toBe(false);
  });

  it("sets value to branch name", () => {
    const branch = makeBranch({ name: "feature/my-branch" });
    const choices = buildChoices([branch]);
    expect(choices[0].value).toBe("feature/my-branch");
  });

  it("includes branch name in label", () => {
    const branch = makeBranch({ name: "feature/login" });
    const choices = buildChoices([branch]);
    expect(choices[0].name).toContain("feature/login");
  });

  it("includes age in label", () => {
    const branch = makeBranch({ age: "47 days" });
    const choices = buildChoices([branch]);
    expect(choices[0].name).toContain("47 days");
  });

  it("includes last commit in label", () => {
    const branch = makeBranch({ lastCommit: "fix auth redirect" });
    const choices = buildChoices([branch]);
    expect(choices[0].name).toContain("fix auth redirect");
  });

  it("handles multiple branches correctly", () => {
    const branches = [
      makeBranch({ name: "feature/a", isMerged: true }),
      makeBranch({ name: "feature/b", isMerged: false }),
      makeBranch({ name: "feature/c", isMerged: true }),
    ];
    const choices = buildChoices(branches);
    expect(choices).toHaveLength(3);
    expect(choices[0].checked).toBe(true);
    expect(choices[1].checked).toBe(false);
    expect(choices[2].checked).toBe(true);
  });

  it("truncates long branch names in the label", () => {
    const branch = makeBranch({
      name: "feature/this-is-an-extremely-long-branch-name-that-exceeds-limits",
    });
    const choices = buildChoices([branch]);
    // The display name should be truncated, but value should be the full name
    expect(choices[0].value).toBe(
      "feature/this-is-an-extremely-long-branch-name-that-exceeds-limits"
    );
    expect(choices[0].name).toContain("…");
  });
});
