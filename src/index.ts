#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import confirm from "@inquirer/confirm";
import {
  listBranches,
  getCurrentBranch,
  detectDefaultBranch,
  getMergeStatus,
  getLastCommit,
  getAgeDays,
  hasRemote,
  deleteBranch,
  deleteRemoteBranch,
} from "./git.js";
import { formatAge, renderTable } from "./format.js";
import { buildChoices, promptCheckbox } from "./prompt.js";
import type { BranchInfo } from "./types.js";

const PROTECTED_BRANCHES = new Set([
  "main",
  "master",
  "develop",
  "dev",
  "staging",
  "production",
]);

const program = new Command();

program
  .name("stale-branches")
  .description("Interactive CLI to list and delete stale git branches")
  .version("1.0.0")
  .option("--merged", "show only merged branches")
  .option("--dry-run", "print what would be deleted, don't actually delete")
  .option("--days <n>", "only show branches older than n days", "0")
  .option("--remote", "also delete remote branches without asking")
  .parse(process.argv);

const opts = program.opts<{
  merged: boolean;
  dryRun: boolean;
  days: string;
  remote: boolean;
}>();

async function main(): Promise<void> {
  const minDays = parseInt(opts.days ?? "0", 10);
  const currentBranch = getCurrentBranch();
  const defaultBranch = detectDefaultBranch();

  console.log(chalk.cyan("\n  Fetching branch info...\n"));

  const allBranches = listBranches();

  const eligibleBranches = allBranches.filter(
    (b) => !PROTECTED_BRANCHES.has(b) && b !== currentBranch
  );

  const infos: BranchInfo[] = eligibleBranches.map((name) => {
    const ageDays = getAgeDays(name);
    const isMerged = getMergeStatus(name, defaultBranch);
    const lastCommit = getLastCommit(name);
    const remote = hasRemote(name);

    return {
      name,
      ageDays,
      age: formatAge(ageDays),
      isMerged,
      lastCommit,
      hasRemote: remote,
      isCurrent: false,
    };
  });

  // Apply filters
  let filtered = infos;

  if (minDays > 0) {
    filtered = filtered.filter((b) => b.ageDays >= minDays);
  }

  if (opts.merged) {
    filtered = filtered.filter((b) => b.isMerged);
  }

  if (filtered.length === 0) {
    console.log(chalk.yellow("  No branches match the current filters.\n"));
    process.exit(0);
  }

  // Sort: merged first, then by age descending
  filtered.sort((a, b) => {
    if (a.isMerged !== b.isMerged) return a.isMerged ? -1 : 1;
    return b.ageDays - a.ageDays;
  });

  console.log(renderTable(filtered));
  console.log();

  if (opts.dryRun) {
    console.log(chalk.cyan("  Dry run — branches that would be deleted:"));
    for (const b of filtered.filter((_, i) => {
      // In dry-run we show all; user sees the full list
      return true;
    })) {
      const remoteNote = b.hasRemote ? " + remote" : "";
      console.log(
        `  ${chalk.bold(b.name)}${chalk.dim(` (${b.age}${remoteNote})`)}`
      );
    }
    console.log();
    process.exit(0);
  }

  // Interactive selection
  const choices = buildChoices(filtered);
  const selected = await promptCheckbox(choices);

  if (selected.length === 0) {
    console.log(chalk.yellow("\n  No branches selected. Exiting.\n"));
    process.exit(0);
  }

  const selectedInfos = selected.map(
    (name) => infos.find((b) => b.name === name)!
  );

  const unmerged = selectedInfos.filter((b) => !b.isMerged);

  if (unmerged.length > 0) {
    console.log(
      chalk.red(
        `\n  ⚠  ${unmerged.length} unmerged branch${unmerged.length > 1 ? "es" : ""} selected:`
      )
    );
    for (const b of unmerged) {
      console.log(chalk.red(`     • ${b.name}`));
    }
    const proceed = await confirm({
      message: `Delete ${unmerged.length} unmerged branch${unmerged.length > 1 ? "es" : ""}? This cannot be undone.`,
      default: false,
    });
    if (!proceed) {
      console.log(chalk.yellow("\n  Aborted.\n"));
      process.exit(0);
    }
  }

  console.log();

  for (const branch of selectedInfos) {
    try {
      let deleteRemote = opts.remote && branch.hasRemote;

      if (!opts.remote && branch.hasRemote) {
        deleteRemote = await confirm({
          message: `  Also delete remote branch origin/${branch.name}?`,
          default: false,
        });
      }

      deleteBranch(branch.name, !branch.isMerged);

      if (deleteRemote) {
        deleteRemoteBranch(branch.name);
        console.log(
          chalk.green(`  ✓ Deleted ${branch.name}`) + chalk.dim(" (local + remote)")
        );
      } else {
        console.log(
          chalk.green(`  ✓ Deleted ${branch.name}`) + chalk.dim(" (local)")
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(
        chalk.red(`  ✗ Failed to delete ${branch.name}`) +
          chalk.dim(` — ${message}`)
      );
    }
  }

  console.log();
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(chalk.red(`\n  Error: ${message}\n`));
  process.exit(1);
});
