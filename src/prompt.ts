import checkbox from "@inquirer/checkbox";
import chalk from "chalk";
import type { BranchInfo } from "./types.js";
import { truncate } from "./format.js";

export type Choice = {
  name: string;
  value: string;
  checked: boolean;
};

export function buildChoices(branches: BranchInfo[]): Choice[] {
  return branches.map((b) => {
    const label = b.isMerged
      ? chalk.dim(
          `${truncate(b.name, 30).padEnd(30)}  ${b.age.padEnd(10)}  merged      ${truncate(b.lastCommit, 40)}`
        )
      : chalk.red(
          `${truncate(b.name, 30).padEnd(30)}  ${b.age.padEnd(10)}  unmerged    ${truncate(b.lastCommit, 40)}`
        );

    return {
      name: label,
      value: b.name,
      checked: b.isMerged,
    };
  });
}

export async function promptCheckbox(choices: Choice[]): Promise<string[]> {
  return checkbox({
    message: "Select branches to delete (Space to toggle, A to select all, Enter to confirm):",
    choices,
    pageSize: 20,
  });
}
