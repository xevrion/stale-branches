import { describe, it, expect, vi, beforeEach } from "vitest";
import { spawnSync } from "child_process";

vi.mock("child_process", () => ({
  spawnSync: vi.fn(),
}));

const mockedSpawnSync = vi.mocked(spawnSync);

function mockSuccess(stdout: string) {
  mockedSpawnSync.mockReturnValueOnce({ status: 0, stdout, stderr: "" } as any);
}

function mockFailure(stderr = "failed") {
  mockedSpawnSync.mockReturnValueOnce({ status: 1, stdout: "", stderr } as any);
}

beforeEach(() => {
  vi.resetAllMocks();
});

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
    mockSuccess("main\n");
    expect(getCurrentBranch()).toBe("main");
  });
});

describe("detectDefaultBranch", () => {
  it("returns branch from symbolic-ref when available", () => {
    mockSuccess("origin/main\n");
    expect(detectDefaultBranch()).toBe("main");
  });

  it("falls back to main if symbolic-ref fails but main exists", () => {
    mockFailure();
    mockSuccess("main\nfeature/foo\n");
    expect(detectDefaultBranch()).toBe("main");
  });

  it("falls back to master if only master exists", () => {
    mockFailure();
    mockSuccess("master\nfeature/foo\n");
    expect(detectDefaultBranch()).toBe("master");
  });

  it("defaults to main if neither main nor master found", () => {
    mockFailure();
    mockSuccess("feature/foo\n");
    expect(detectDefaultBranch()).toBe("main");
  });
});

describe("listBranches", () => {
  it("returns array of branch names", () => {
    mockSuccess("feature/foo\nfix/bar\nchore/baz\n");
    expect(listBranches()).toEqual(["feature/foo", "fix/bar", "chore/baz"]);
  });

  it("filters empty lines", () => {
    mockSuccess("feature/foo\n\nfix/bar\n");
    expect(listBranches()).toEqual(["feature/foo", "fix/bar"]);
  });
});

describe("getMergeStatus", () => {
  it("returns true when branch is merged", () => {
    mockedSpawnSync.mockReturnValueOnce({ status: 0, stdout: "", stderr: "" } as any);
    expect(getMergeStatus("feature/old", "main")).toBe(true);
  });

  it("returns false when branch is not merged", () => {
    mockedSpawnSync.mockReturnValueOnce({ status: 1, stdout: "", stderr: "" } as any);
    expect(getMergeStatus("feature/wip", "main")).toBe(false);
  });

  it("throws on invalid branch name", () => {
    expect(() => getMergeStatus("bad;branch", "main")).toThrow("Invalid branch name");
  });
});

describe("getLastCommit", () => {
  it("returns commit message", () => {
    mockSuccess("fix auth redirect\n");
    expect(getLastCommit("feature/login")).toBe("fix auth redirect");
  });

  it("returns fallback on error", () => {
    mockFailure();
    expect(getLastCommit("feature/empty")).toBe("(no commits)");
  });
});

describe("getAgeDays", () => {
  it("returns days since last commit", () => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const tenDaysAgo = String(nowSeconds - 10 * 86400);
    mockSuccess(tenDaysAgo + "\n");
    expect(getAgeDays("feature/old")).toBe(10);
  });

  it("returns 0 when exec fails", () => {
    mockFailure();
    expect(getAgeDays("feature/empty")).toBe(0);
  });

  it("returns 0 for non-numeric timestamp", () => {
    mockSuccess("notanumber\n");
    expect(getAgeDays("feature/bad")).toBe(0);
  });
});

describe("hasRemote", () => {
  it("returns true when tracking ref exists", () => {
    mockSuccess("  origin/feature/foo\n");
    expect(hasRemote("feature/foo")).toBe(true);
  });

  it("returns false when tracking ref is empty", () => {
    mockSuccess("");
    expect(hasRemote("feature/local-only")).toBe(false);
  });

  it("returns false on exec error", () => {
    mockFailure();
    expect(hasRemote("feature/nope")).toBe(false);
  });

  it("calls git branch -r --list with correct ref pattern", () => {
    mockSuccess("  origin/feature/foo\n");
    hasRemote("feature/foo");
    expect(mockedSpawnSync).toHaveBeenCalledWith(
      "git",
      ["branch", "-r", "--list", "origin/feature/foo"],
      expect.any(Object)
    );
  });
});

describe("deleteBranch", () => {
  it("calls git branch -d for merged branch", () => {
    mockSuccess("");
    deleteBranch("feature/done", false);
    expect(mockedSpawnSync).toHaveBeenCalledWith(
      "git",
      ["branch", "-d", "feature/done"],
      expect.any(Object)
    );
  });

  it("calls git branch -D for force delete", () => {
    mockSuccess("");
    deleteBranch("feature/wip", true);
    expect(mockedSpawnSync).toHaveBeenCalledWith(
      "git",
      ["branch", "-D", "feature/wip"],
      expect.any(Object)
    );
  });

  it("throws on invalid branch name", () => {
    expect(() => deleteBranch("bad;branch", false)).toThrow("Invalid branch name");
  });
});

describe("deleteRemoteBranch", () => {
  it("calls git push origin --delete", () => {
    mockSuccess("");
    deleteRemoteBranch("feature/done");
    expect(mockedSpawnSync).toHaveBeenCalledWith(
      "git",
      ["push", "origin", "--delete", "feature/done"],
      expect.any(Object)
    );
  });

  it("throws on invalid branch name", () => {
    expect(() => deleteRemoteBranch("bad;branch")).toThrow("Invalid branch name");
  });
});
