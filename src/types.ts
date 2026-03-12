export type BranchInfo = {
  name: string;
  ageDays: number;
  age: string;
  isMerged: boolean;
  lastCommit: string;
  hasRemote: boolean;
  isCurrent: boolean;
};

export type Config = {
  protectedBranches: string[];
  defaultBranch: string;
};
