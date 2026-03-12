import { execSync } from "child_process";

const BRANCH_NAME_RE = /^[a-zA-Z0-9/_.\-]+$/;

// Sanitize branch names to prevent command injection
export function sanitizeBranch(branch: string): string {
  if (!BRANCH_NAME_RE.test(branch)) {
    throw new Error(`Invalid branch name: ${branch}`);
  }
  return branch;
}

function exec(cmd: string): string {
  return execSync(cmd, { encoding: "utf8" }).trim();
}

function execSafe(cmd: string): string | null {
  try {
    return exec(cmd);
  } catch {
    return null;
  }
}

export function getCurrentBranch(): string {
  return exec("git rev-parse --abbrev-ref HEAD");
}

export function detectDefaultBranch(): string {
  const result = execSafe("git symbolic-ref refs/remotes/origin/HEAD --short");
  if (result) {
    return result.replace("origin/", "");
  }
  const branches = execSafe("git branch --format=%(refname:short)") ?? "";
  const list = branches.split("\n").map((b) => b.trim());
  if (list.includes("main")) return "main";
  if (list.includes("master")) return "master";
  return "main";
}

export function listBranches(): string[] {
  const output = exec("git branch --format=%(refname:short)");
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
  try {
    execSync(`git merge-base --is-ancestor ${safe} ${safeDefault}`, {
      encoding: "utf8",
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

export function getLastCommit(branch: string): string {
  const safe = sanitizeBranch(branch);
  return execSafe(`git log -1 --format=%s ${safe}`) ?? "(no commits)";
}

export function getAgeDays(branch: string): number {
  const safe = sanitizeBranch(branch);
  const timestamp = execSafe(`git log -1 --format=%ct ${safe}`);
  if (!timestamp) return 0;
  const seconds = parseInt(timestamp, 10);
  if (isNaN(seconds)) return 0;
  const nowSeconds = Math.floor(Date.now() / 1000);
  return Math.floor((nowSeconds - seconds) / 86400);
}

export function hasRemote(branch: string): boolean {
  const safe = sanitizeBranch(branch);
  const result = execSafe(`git ls-remote --heads origin ${safe}`);
  return result !== null && result.length > 0;
}

export function deleteBranch(branch: string, force: boolean): void {
  const safe = sanitizeBranch(branch);
  const flag = force ? "-D" : "-d";
  exec(`git branch ${flag} ${safe}`);
}

export function deleteRemoteBranch(branch: string): void {
  const safe = sanitizeBranch(branch);
  exec(`git push origin --delete ${safe}`);
}
