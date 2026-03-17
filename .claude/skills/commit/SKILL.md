---
name: commit
description: Stage changes, generate a commit message, commit, and push to remote
disable-model-invocation: true
argument-hint: "[optional message]"
---

Commit and push current changes:

1. Run `git status` and `git diff --stat` to see all changes (staged + unstaged)
2. Run `git add -A` to stage everything
3. If the user provided "$ARGUMENTS", use that as the commit message. Otherwise, generate a short concise message (under 72 chars) using conventional commits format (feat:, fix:, refactor:, docs:, chore:)
4. Commit with the message. IMPORTANT: Do NOT add any `Co-Authored-By` trailer or any other trailer to the commit message. The commit must only show the user as the author.
5. **Pull before push**: Run `git pull origin $(git rev-parse --abbrev-ref HEAD)` to fetch and merge any new remote commits.
   - If the pull succeeds cleanly — proceed to push.
   - If there are **merge conflicts** — STOP immediately. Do NOT push. Show the user which files have conflicts and tell them to resolve manually. Run `git status` to list the conflicted files.
   - If the pull fails for other reasons (e.g. no upstream branch yet) — that's fine, skip the pull and proceed to push.
6. Push to the current branch: `git push origin $(git rev-parse --abbrev-ref HEAD)`
   - If this is the first push for a new branch, use: `git push -u origin $(git rev-parse --abbrev-ref HEAD)`
7. Show the final status
