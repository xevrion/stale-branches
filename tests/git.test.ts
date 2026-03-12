import { describe, it, expect, vi, beforeEach } from "vitest";
import { execSync } from "child_process";

vi.mock("child_process", () => ({
  execSync: vi.fn(),
}));

const mockedExecSync = vi.mocked(execSync);

// Reset modules between test groups so mocks are fresh
beforeEach(() => {
  vi.resetAllMocks();
});

// Import after mocking
const {
  sanitizeBranch,
  getCurrentBranch,
  detectDefaultBranch,
  listBranches,
  getMergeStatus,
  getLastCommit,
  getAgeDays,
  hasRemote,
  deleteBranch,
  deleteRemoteBranch,
} = await import("../src/git.js");

describe("sanitizeBranch", () => {
  it("allows valid branch names", () => {
    expect(sanitizeBranch("feature/my-branch")).toBe("feature/my-branch");
    expect(sanitizeBranch("fix/typo-in-readme")).toBe("fix/typo-in-readme");
    expect(sanitizeBranch("main")).toBe("main");
    expect(sanitizeBranch("v1.0.0")).toBe("v1.0.0");
  });

  it("throws on names with shell-injection chars", () => {
    expect(() => sanitizeBranch("branch; rm -rf /")).toThrow("Invalid branch name");
    expect(() => sanitizeBranch("branch$(evil)")).toThrow("Invalid branch name");
    expect(() => sanitizeBranch("branch`evil`")).toThrow("Invalid branch name");
    expect(() => sanitizeBranch("branch|pipe")).toThrow("Invalid branch name");
  });
});

describe("getCurrentBranch", () => {
  it("returns current branch name", () => {
    mockedExecSync.mockReturnValueOnce("main\n" as any);
    expect(getCurrentBranch()).toBe("main");
  });
});

describe("detectDefaultBranch", () => {
  it("returns branch from symbolic-ref when available", () => {
    mockedExecSync.mockReturnValueOnce("origin/main\n" as any);
    expect(detectDefaultBranch()).toBe("main");
  });

  it("falls back to main if symbolic-ref fails but main exists", () => {
    mockedExecSync.mockImplementationOnce(() => { throw new Error("failed"); });
    mockedExecSync.mockReturnValueOnce("main\nfeature/foo\n" as any);
    expect(detectDefaultBranch()).toBe("main");
  });

  it("falls back to master if only master exists", () => {
    mockedExecSync.mockImplementationOnce(() => { throw new Error("failed"); });
    mockedExecSync.mockReturnValueOnce("master\nfeature/foo\n" as any);
    expect(detectDefaultBranch()).toBe("master");
  });

  it("defaults to main if neither main nor master found", () => {
    mockedExecSync.mockImplementationOnce(() => { throw new Error("failed"); });
    mockedExecSync.mockReturnValueOnce("feature/foo\n" as any);
    expect(detectDefaultBranch()).toBe("main");
  });
});

describe("listBranches", () => {
  it("returns array of branch names", () => {
    mockedExecSync.mockReturnValueOnce("feature/foo\nfix/bar\nchore/baz\n" as any);
    expect(listBranches()).toEqual(["feature/foo", "fix/bar", "chore/baz"]);
  });

  it("filters empty lines", () => {
    mockedExecSync.mockReturnValueOnce("feature/foo\n\nfix/bar\n" as any);
    expect(listBranches()).toEqual(["feature/foo", "fix/bar"]);
  });
});

describe("getMergeStatus", () => {
  it("returns true when branch is merged", () => {
    mockedExecSync.mockReturnValueOnce("" as any);
    expect(getMergeStatus("feature/old", "main")).toBe(true);
  });

  it("returns false when branch is not merged", () => {
    mockedExecSync.mockImplementationOnce(() => { throw new Error("not ancestor"); });
    expect(getMergeStatus("feature/wip", "main")).toBe(false);
  });

  it("throws on invalid branch name", () => {
    expect(() => getMergeStatus("bad;branch", "main")).toThrow("Invalid branch name");
  });
});

describe("getLastCommit", () => {
  it("returns commit message", () => {
    mockedExecSync.mockReturnValueOnce("fix auth redirect\n" as any);
    expect(getLastCommit("feature/login")).toBe("fix auth redirect");
  });

  it("returns fallback on error", () => {
    mockedExecSync.mockImplementationOnce(() => { throw new Error("failed"); });
    expect(getLastCommit("feature/empty")).toBe("(no commits)");
  });
});

describe("getAgeDays", () => {
  it("returns days since last commit", () => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const tenDaysAgo = String(nowSeconds - 10 * 86400);
    mockedExecSync.mockReturnValueOnce((tenDaysAgo + "\n") as any);
    expect(getAgeDays("feature/old")).toBe(10);
  });

  it("returns 0 when exec fails", () => {
    mockedExecSync.mockImplementationOnce(() => { throw new Error("failed"); });
    expect(getAgeDays("feature/empty")).toBe(0);
  });

  it("returns 0 for non-numeric timestamp", () => {
    mockedExecSync.mockReturnValueOnce("notanumber\n" as any);
    expect(getAgeDays("feature/bad")).toBe(0);
  });
});

describe("hasRemote", () => {
  it("returns true when remote ref exists", () => {
    mockedExecSync.mockReturnValueOnce(
      "abc123\trefs/heads/feature/foo\n" as any
    );
    expect(hasRemote("feature/foo")).toBe(true);
  });

  it("returns false when remote ref is empty", () => {
    mockedExecSync.mockReturnValueOnce("" as any);
    expect(hasRemote("feature/local-only")).toBe(false);
  });

  it("returns false on exec error", () => {
    mockedExecSync.mockImplementationOnce(() => { throw new Error("failed"); });
    expect(hasRemote("feature/nope")).toBe(false);
  });
});

describe("deleteBranch", () => {
  it("calls git branch -d for merged branch", () => {
    mockedExecSync.mockReturnValueOnce("" as any);
    deleteBranch("feature/done", false);
    expect(mockedExecSync).toHaveBeenCalledWith(
      "git branch -d feature/done",
      expect.any(Object)
    );
  });

  it("calls git branch -D for force delete", () => {
    mockedExecSync.mockReturnValueOnce("" as any);
    deleteBranch("feature/wip", true);
    expect(mockedExecSync).toHaveBeenCalledWith(
      "git branch -D feature/wip",
      expect.any(Object)
    );
  });

  it("throws on invalid branch name", () => {
    expect(() => deleteBranch("bad;branch", false)).toThrow("Invalid branch name");
  });
});

describe("deleteRemoteBranch", () => {
  it("calls git push origin --delete", () => {
    mockedExecSync.mockReturnValueOnce("" as any);
    deleteRemoteBranch("feature/done");
    expect(mockedExecSync).toHaveBeenCalledWith(
      "git push origin --delete feature/done",
      expect.any(Object)
    );
  });

  it("throws on invalid branch name", () => {
    expect(() => deleteRemoteBranch("bad;branch")).toThrow("Invalid branch name");
  });
});
