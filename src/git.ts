import { spawnSync } from "child_process";

const BRANCH_NAME_RE = /^[a-zA-Z0-9/_.\-]+$/;

// Sanitize branch names — defense in depth even though we don't use a shell
export function sanitizeBranch(branch: string): string {
  if (!BRANCH_NAME_RE.test(branch)) {
    throw new Error(`Invalid branch name: ${branch}`);
  }
  return branch;
}

function run(args: string[]): string {
  const result = spawnSync("git", args, { encoding: "utf8" });
  if (result.status !== 0) {
    const msg = result.stderr?.trim() || `git ${args[0]} failed`;
    throw new Error(`Command failed: git ${args.join(" ")}\n${msg}`);
  }
  return result.stdout.trim();
}

function runSafe(args: string[]): string | null {
  try {
    return run(args);
  } catch {
    return null;
  }
}

export function getCurrentBranch(): string {
  return run(["rev-parse", "--abbrev-ref", "HEAD"]);
}

export function detectDefaultBranch(): string {
  const result = runSafe(["symbolic-ref", "refs/remotes/origin/HEAD", "--short"]);
  if (result) {
    return result.replace("origin/", "");
  }
  const branches = runSafe(["branch", "--format=%(refname:short)"]) ?? "";
  const list = branches.split("\n").map((b) => b.trim());
  if (list.includes("main")) return "main";
  if (list.includes("master")) return "master";
  return "main";
}

export function listBranches(): string[] {
  const output = run(["branch", "--format=%(refname:short)"]);
  return output
    .split("\n")
    .map((b) => b.trim())
    .filter(Boolean);
}

export function getMergeStatus(
  branch: string,
  defaultBranch: string
): boolean {
  const safe = sanitizeBranch(branch);
  const safeDefault = sanitizeBranch(defaultBranch);
  const result = spawnSync("git", ["merge-base", "--is-ancestor", safe, safeDefault], {
    encoding: "utf8",
  });
  return result.status === 0;
}

export function getLastCommit(branch: string): string {
  const safe = sanitizeBranch(branch);
  return runSafe(["log", "-1", "--format=%s", safe]) ?? "(no commits)";
}

export function getAgeDays(branch: string): number {
  const safe = sanitizeBranch(branch);
  const timestamp = runSafe(["log", "-1", "--format=%ct", safe]);
  if (!timestamp) return 0;
  const seconds = parseInt(timestamp, 10);
  if (isNaN(seconds)) return 0;
  const nowSeconds = Math.floor(Date.now() / 1000);
  return Math.floor((nowSeconds - seconds) / 86400);
}

export function hasRemote(branch: string): boolean {
  const safe = sanitizeBranch(branch);
  const result = runSafe(["ls-remote", "--heads", "origin", safe]);
  return result !== null && result.length > 0;
}

export function deleteBranch(branch: string, force: boolean): void {
  const safe = sanitizeBranch(branch);
  run(["branch", force ? "-D" : "-d", safe]);
}

export function deleteRemoteBranch(branch: string): void {
  const safe = sanitizeBranch(branch);
  run(["push", "origin", "--delete", safe]);
}
