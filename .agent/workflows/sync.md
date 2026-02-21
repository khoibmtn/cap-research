---
description: Merge current branch into main, push, deploy to Firebase, then switch back to continue working.
---

# /sync - Merge, Push, Deploy & Resume

// turbo-all

## Purpose

Mid-session workflow: merge current work into `main`, push to remote, deploy to Firebase, then switch back to the current branch to keep working.

## Steps

### Phase 1: Pre-check

1. Save current branch name and check for uncommitted changes:
```bash
git branch --show-current
git status --short
```

2. If there are uncommitted changes, commit them first:
```bash
git add -A
git commit -m "wip: save changes before sync"
```

> If the branch IS `main`, warn the user: "Bạn đang ở nhánh main. Workflow này dành cho nhánh feature. Hãy dùng `/save-context` thay thế."

### Phase 2: Build & Verify

3. Build to check for errors before merging:
```bash
npm run build
```

> If build fails, STOP and report errors. Do NOT merge broken code into main.

### Phase 3: Merge into Main

4. Switch to main and pull latest:
```bash
git checkout main
git pull origin main
```

5. Merge the working branch into main:
```bash
git merge [working-branch] --no-ff -m "merge: [working-branch] into main"
```

> If there are merge conflicts, STOP and help the user resolve them before continuing.

### Phase 4: Push & Deploy

6. Push main to remote:
```bash
git push origin main
```

7. Deploy to Firebase Hosting:
```bash
firebase deploy --only hosting
```

### Phase 5: Switch Back

8. Return to the working branch:
```bash
git checkout [working-branch]
```

### Phase 6: Summary

9. Display summary:

```markdown
## ✅ Sync Complete!

### Git
- 🔀 Merged: [working-branch] → main
- 📤 Pushed: origin/main
- 📌 Current branch: [working-branch] (back to work!)

### Deploy
- 🌐 URL: https://cap-research-app.web.app
- 🕐 Time: [timestamp]

### Continue Working
You're back on `[working-branch]`. Keep coding!
When done, run `/sync` again or `/save-context` to end the session.
```
