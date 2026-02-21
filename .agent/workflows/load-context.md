---
description: Load context from a previous session, read all project rules/skills/workflows, create a new working branch, and resume work.
---

# /load-context - Load Previous Session Context

// turbo-all

## Purpose

Load a previously saved session context, read all project configuration (skills, rules, workflows), create a fresh working branch, and resume work from where the last session left off.

## Sub-commands

```
/load-context              - Load latest context + create new branch
/load-context list         - List all available context snapshots
/load-context [date]       - Load a specific snapshot by date (e.g., "20260221")
```

## Steps

### Phase 1: Read Project Configuration

1. Read ALL project rules:
```bash
ls .agent/rules/
```
Then read each file in `.agent/rules/` to understand project conventions.

2. Read ALL workflow definitions:
```bash
ls .agent/workflows/
```
Then read each file in `.agent/workflows/` to know available commands.

3. Read ALL skill summaries (SKILL.md in each skill folder):
```bash
find .agent/skills -name "SKILL.md" -type f
```
Then read each SKILL.md to understand available capabilities.

4. Read project architecture if available:
```bash
cat .agent/ARCHITECTURE.md 2>/dev/null
```

### Phase 2: Load Context

5. Check if context file exists:
```bash
ls .agent/context/latest_context.md 2>/dev/null
```

> If not found, inform the user: "Chưa có context nào được lưu. Hãy chạy `/save-context` trước."

6. Read the saved context:
```bash
cat .agent/context/latest_context.md
```

### Phase 3: Check Current State

7. Check current git state and compare with saved context:
```bash
git branch --show-current
git status --short
git log --oneline -5
```

8. Report any differences between saved context and current state (new commits, changed files, etc.)

### Phase 4: Create New Working Branch

9. Make sure we're on `main` and it's up to date:
```bash
git checkout main
git pull origin main
```

10. Ask the user what they plan to work on, then create a descriptive branch name:
```bash
git checkout -b [branch-name]
```

Branch naming convention:
- `feat/[feature-name]` — for new features
- `fix/[bug-description]` — for bug fixes
- `chore/[task]` — for maintenance/refactoring
- `session/[date]` — if no specific task (e.g., `session/20260221`)

### Phase 5: Start Dev Server

11. Start the development server:
```bash
npm run dev
```

### Phase 6: Summary

12. Present summary to the user:

```markdown
## 📋 Context Loaded!

### Project Configuration Loaded
- 📏 Rules: [count] files read
- 🔧 Workflows: [count] available ([list names])
- 🎯 Skills: [count] loaded

### Previous Session
[Key points from saved context — what was done, what's pending]

### Current State
- 📌 Branch: [new branch name]
- 🔄 Based on: main @ [commit hash]
- 🌐 Dev server: http://localhost:5173

### Recommended Next Steps
[Based on "Work In Progress" and "Important Context" from the saved snapshot]

### Changes Since Last Save
[Any new commits on main since context was saved]
```

---

## Sub-command: `list`

1. List all available snapshots:
```bash
ls -lt .agent/context/context_*.md .agent/context/latest_context.md 2>/dev/null
```

2. Show formatted list with timestamps and first-line summaries.

## Sub-command: `[date]`

1. Find matching snapshot:
```bash
ls .agent/context/context_*[date]*.md 2>/dev/null
```

2. Load and present (same as default flow, including Phase 1 — always read project config).
