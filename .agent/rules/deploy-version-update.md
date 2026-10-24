---
trigger: always_on
---

# Deploy Checklist Rule

## MANDATORY: Before EVERY deploy to Firebase Hosting

**After `npm run build` and BEFORE `firebase deploy`, you MUST update the version line in:**

```
src/components/layout/AppLayout.tsx
```

**Line pattern:** `Cập nhật DD/MM/YYYY HH:MM — [mô tả ngắn thay đổi]`

**Steps:**
1. Find the line containing `Cập nhật` in `AppLayout.tsx`
2. Update the date/time to the current local time (format: `DD/MM/YYYY HH:MM`)
3. Update the description to briefly summarize what changed in this deploy
4. Commit the update together with the deploy commit

**Example:**
```
Cập nhật 24/10/2026 19:37 — Fix danh mục Settings
```

> 🔴 **NEVER skip this step.** It is the user-visible version indicator.
