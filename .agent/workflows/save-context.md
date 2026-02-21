---
description: Save session context, merge into main, push to git, and deploy to Firebase Hosting.
---

# /save-context - Save Session Context & Deploy

// turbo-all

## Purpose

End-of-session workflow: save a context snapshot, merge all changes into `main`, push to remote, and deploy to production.

## Steps

### Phase 1: Gather Info

1. Get current git state:
```bash
git branch --show-current
git status --short
git log --oneline -10
```

2. Get environment info:
```bash
node -v
cat .firebaserc | grep -A1 '"default"' 2>/dev/null || echo "No default project set"
```

### Phase 2: Save Context Snapshot

3. Create context directory:
```bash
mkdir -p .agent/context
```

4. Generate `.agent/context/latest_context.md` with this structure:

```markdown
# Session Context Snapshot
**Saved:** [current timestamp]
**Branch:** [current git branch]
**Last Commit:** [hash + message]

## What Was Done This Session
[Summarize key tasks completed, bugs fixed, features added]

## Work In Progress
[Any unfinished tasks, known bugs, or next steps]

## Key Files Modified
[List of important files changed with brief description]

## Environment Notes
- Node: [version]
- Firebase project: [project id]
- Last deploy: [timestamp]

## Important Context for Next Session
[Critical info, gotchas, or decisions for next session]
```

5. Save timestamped backup and clean old ones (keep last 5):
```bash
cp .agent/context/latest_context.md ".agent/context/context_$(date +%Y%m%d_%H%M%S).md"
ls -t .agent/context/context_*.md | tail -n +6 | xargs rm -f 2>/dev/null
```

### Phase 3: Commit on Current Branch

6. Stage ALL changes (code + context):
```bash
git add -A
```

7. Show what will be committed:
```bash
git diff --cached --stat
```

8. Commit with a descriptive message summarizing the session:
```bash
git commit -m "feat/fix/chore: [summary of main changes in this session]"
```

### Phase 4: Build & Verify

9. Build to check for errors before merging into main:
```bash
npm run build
```

> If build fails, STOP and report errors. Do NOT merge broken code into main.

### Phase 5: Merge into Main & Push

10. Save current branch name, then switch to main:
```bash
git checkout main
git pull origin main
```

11. Merge working branch into main:
```bash
git merge [working-branch] --no-ff -m "merge: [working-branch] - [session summary]"
```

> If there are merge conflicts, STOP and help the user resolve them.

12. Push main to remote:
```bash
git push origin main
```

> **Special case:** If already on `main` (no feature branch), just push directly — skip the merge step.

### Phase 6: Deploy

13. Deploy to Firebase Hosting:
```bash
firebase deploy --only hosting
```

### Phase 7: Summary

14. Display final summary:

```markdown
## ✅ Session Saved & Deployed!

### Git
- 🔀 Merged: [working-branch] → main
- 📤 Pushed: origin/main
- 📝 Commit: [hash] [message]

### Deploy
- 🌐 URL: https://cap-research-app.web.app
- 🕐 Time: [timestamp]

### Context
- 📄 Saved: .agent/context/latest_context.md

### Next Session
Run `/load-context` to resume from here.
```
