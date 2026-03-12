import chalk from "chalk";
import type { BranchInfo } from "./types.js";

export function formatAge(days: number): string {
  if (days < 1) return "today";
  if (days === 1) return "1 day";
  if (days < 30) return `${days} days`;
  if (days < 60) return "1 month";
  if (days < 365) return `${Math.floor(days / 30)} months`;
  if (days < 730) return "1 year";
  return `${Math.floor(days / 365)} years`;
}

export function truncate(str: string, n: number): string {
  if (str.length <= n) return str;
  return str.slice(0, n - 1) + "…";
}

export function renderTable(branches: BranchInfo[]): string {
  if (branches.length === 0) {
    return chalk.yellow("No stale branches found.");
  }

  const COL_BRANCH = 30;
  const COL_AGE = 10;
  const COL_STATUS = 11;
  const COL_COMMIT = 42;

  const header = [
    "Branch".padEnd(COL_BRANCH),
    "Age".padEnd(COL_AGE),
    "Status".padEnd(COL_STATUS),
    "Last Commit",
  ].join("  ");

  const divider = "─".repeat(
    COL_BRANCH + COL_AGE + COL_STATUS + COL_COMMIT + 6
  );

  const rows = branches.map((b) => {
    const name = truncate(b.name, COL_BRANCH).padEnd(COL_BRANCH);
    const age = b.age.padEnd(COL_AGE);
    const statusLabel = b.isMerged ? "merged" : "unmerged";
    const status = statusLabel.padEnd(COL_STATUS);
    const commit = truncate(b.lastCommit, COL_COMMIT);

    const line = `${name}  ${age}  ${status}  ${commit}`;
    return b.isMerged ? chalk.dim(line) : chalk.red(line);
  });

  return [chalk.bold(header), chalk.dim(divider), ...rows].join("\n");
}
