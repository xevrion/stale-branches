# Security Policy

## Supported Versions

Only the latest `1.0.x` release receives security fixes.

| Version | Supported |
|---|---|
| 1.0.x | Yes |
| < 1.0 | No |

---

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Please report them privately using a [GitHub Security Advisory](https://github.com/xevrion/stale-branches/security/advisories/new). This keeps the details confidential until a fix is released.

When reporting, include:

- A description of the vulnerability and its potential impact.
- Steps to reproduce (a minimal proof-of-concept if possible).
- The version of `stale-branches` and Node.js you are running.
- Your operating system.

You can expect an acknowledgement within 72 hours and a fix or mitigation plan within 14 days for confirmed critical issues.

---

## Security Considerations

### Branch name injection

The primary attack surface for a git branch management tool is malicious branch names. A compromised or adversarial git remote could push a branch named something like `; rm -rf ~` to try to inject shell commands when the tool processes it.

**Protection:** All branch names are validated against a strict allowlist regex before being passed to any git command:

```
/^[a-zA-Z0-9/_.-]+$/
```

Any branch name that does not match this pattern causes an immediate error — the branch is skipped and never passed to git.

**Defense in depth:** Even if the regex were bypassed, `stale-branches` uses `spawnSync` (not `exec` or a shell string) for all git commands. Arguments are passed as an array, so the OS never passes them through a shell. Shell metacharacters have no effect.

### No network access

`stale-branches` does not make HTTP requests. It communicates with git remotes only through standard `git` commands (`git push --delete`, `git branch -r`). No API tokens or credentials are stored or transmitted by this tool.

### No privilege escalation

`stale-branches` runs entirely as the invoking user. It requires no elevated permissions and does not invoke `sudo` or modify any file outside the current git repository.

### Dependency supply chain

Dependencies are pinned in `package-lock.json`. The CI pipeline runs `npm audit signatures` on every push to verify package registry signature integrity. Run `npm audit` locally before contributing dependency changes.
