import { describe, it, expect } from "vitest";
import { formatAge, truncate, renderTable } from "../src/format.js";
import type { BranchInfo } from "../src/types.js";

describe("formatAge", () => {
  it("returns 'today' for 0 days", () => {
    expect(formatAge(0)).toBe("today");
  });

  it("returns '1 day' for 1 day", () => {
    expect(formatAge(1)).toBe("1 day");
  });

  it("returns days for < 30 days", () => {
    expect(formatAge(3)).toBe("3 days");
    expect(formatAge(29)).toBe("29 days");
  });

  it("returns '1 month' for 30-59 days", () => {
    expect(formatAge(30)).toBe("1 month");
    expect(formatAge(59)).toBe("1 month");
  });

  it("returns months for 60-364 days", () => {
    expect(formatAge(60)).toBe("2 months");
    expect(formatAge(364)).toBe("12 months");
  });

  it("returns '1 year' for 365-729 days", () => {
    expect(formatAge(365)).toBe("1 year");
    expect(formatAge(729)).toBe("1 year");
  });

  it("returns years for >= 730 days", () => {
    expect(formatAge(730)).toBe("2 years");
    expect(formatAge(1095)).toBe("3 years");
  });
});

describe("truncate", () => {
  it("returns string unchanged if within limit", () => {
    expect(truncate("hello", 10)).toBe("hello");
    expect(truncate("hello", 5)).toBe("hello");
  });

  it("truncates with ellipsis when over limit", () => {
    expect(truncate("hello world", 8)).toBe("hello w…");
    expect(truncate("abcdefgh", 5)).toBe("abcd…");
  });

  it("handles single-char limit", () => {
    expect(truncate("hello", 1)).toBe("…");
  });
});

describe("renderTable", () => {
  const branches: BranchInfo[] = [
    {
      name: "feature/old-login",
      ageDays: 47,
      age: "47 days",
      isMerged: true,
      lastCommit: "fix auth redirect",
      hasRemote: true,
      isCurrent: false,
    },
    {
      name: "experiment/dark-mode",
      ageDays: 23,
      age: "23 days",
      isMerged: false,
      lastCommit: "wip: toggle styles",
      hasRemote: false,
      isCurrent: false,
    },
  ];

  it("returns no-branches message for empty array", () => {
    const result = renderTable([]);
    expect(result).toContain("No stale branches found");
  });

  it("includes header with column names", () => {
    const result = renderTable(branches);
    expect(result).toContain("Branch");
    expect(result).toContain("Age");
    expect(result).toContain("Status");
    expect(result).toContain("Last Commit");
  });

  it("includes branch names in output", () => {
    const result = renderTable(branches);
    expect(result).toContain("feature/old-login");
    expect(result).toContain("experiment/dark-mode");
  });

  it("includes age and commit info", () => {
    const result = renderTable(branches);
    expect(result).toContain("47 days");
    expect(result).toContain("fix auth redirect");
    expect(result).toContain("23 days");
    expect(result).toContain("wip: toggle styles");
  });

  it("includes merged and unmerged status", () => {
    const result = renderTable(branches);
    expect(result).toContain("merged");
    expect(result).toContain("unmerged");
  });

  it("truncates long branch names", () => {
    const longBranch: BranchInfo = {
      name: "feature/this-is-a-very-long-branch-name-that-exceeds-limit",
      ageDays: 5,
      age: "5 days",
      isMerged: false,
      lastCommit: "some work",
      hasRemote: false,
      isCurrent: false,
    };
    const result = renderTable([longBranch]);
    expect(result).toContain("…");
  });
});
