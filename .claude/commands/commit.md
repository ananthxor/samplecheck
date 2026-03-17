---
name: commit
description: Stage changes, generate a commit message, commit, and push to remote
---

Commit and push current changes:

1. Run `git status` and `git diff --stat` to see all changes (staged + unstaged)
2. Run `git add -A` to stage everything
3. If the user provided "$ARGUMENTS", use that as the commit message. Otherwise, generate a short concise message (under 72 chars) using conventional commits format (feat:, fix:, refactor:, docs:, chore:)
4. Commit with the message
5. Push to the current branch: `git push origin $(git rev-parse --abbrev-ref HEAD)`
6. Show the final status
