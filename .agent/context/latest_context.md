# Session Context Snapshot
**Saved:** 2026-02-21 11:35 (GMT+7)
**Branch:** main
**Last Commit:** 41e83c8 - refactor: restructure project - move cap-research to root

## What Was Done This Session

### 1. Project Restructuring
- Moved `cap-research` from subdirectory to repository root
- Removed `web/` (Next.js) and framework files
- Preserved all 20 Git commits
- Renamed `AntigravityKit/` → `cap-research/`

### 2. Patient Form Enhancements
- **Save/Cancel buttons**: Added for new patient creation (previously only in edit mode)
- **Cancel confirmation**: Shows save/discard dialog when form has unsaved changes (both new + edit)
- **Dirty state tracking**: Extended to new patient form (compares against initial default snapshot)
- **Navigation guards**: `beforeunload` + sidebar guard now work for both new and edit modes

### 3. Date Validation
- **onSave validation (6 rules)**: ngayRaVien ≥ ngayVaoVien, thoiDiemTrieuChung ≤ ngayVaoVien, ngayBatDauKhangSinh within admission range, ngayKetThucKhangSinh ≥ ngayBatDauKhangSinh and ≤ ngayRaVien
- **onBlur validation**: Instant feedback when selecting invalid dates
- **Fixed DateInput component**: Transparent native overlay with `pointer-events: auto` for mobile touch support
- **Fixed date parsing**: All validation functions now correctly handle `dd/mm/yyyy` format
- **Fixed stale closure bug**: `onBlur(newValue)` passes value directly instead of reading from stale state

### 4. Workflows & Rules Created
- `/save-context` — End-of-session: context + merge main + push + deploy
- `/load-context` — Start-of-session: read config + load context + create branch + dev server
- `/sync` — Mid-session: merge main + push + deploy + switch back
- `mobile-desktop-input.md` rule — DateInput patterns for mobile/desktop compatibility

## Work In Progress
- No unfinished tasks

## Key Files Modified
| File | Changes |
|------|---------|
| `src/components/ui/DateInput.tsx` | Mobile touch fix, onBlur(newValue) signature |
| `src/pages/PatientFormPage.tsx` | Dirty tracking, cancel confirmation, date validation |
| `src/components/form/StepHanhChinh.tsx` | validateNgayRaVien with correct date parsing |
| `src/components/form/StepLamSang.tsx` | validateTrieuChung with correct date parsing |
| `src/components/form/StepKetCuc.tsx` | validateNgayBatDauKS/KetThucKS with newValue param |
| `.agent/rules/mobile-desktop-input.md` | NEW — mobile/desktop input guidelines |
| `.agent/workflows/save-context.md` | NEW — end-of-session workflow |
| `.agent/workflows/load-context.md` | NEW — start-of-session workflow |
| `.agent/workflows/sync.md` | NEW — mid-session sync workflow |

## Environment Notes
- Node: v25.2.1
- Firebase project: cap-research-app
- Hosting URL: https://cap-research-app.web.app
- Last deploy: 2026-02-21 ~11:00

## Important Context for Next Session
- `DateInput` uses transparent native overlay — NEVER use `pointer-events: none` (breaks mobile)
- `onBlur` callbacks receive `(newValue: string)` — don't read from state (stale closure)
- Date format in storage: `dd/mm/yyyy` — must parse manually, `new Date()` won't work
- Firebase project set as default via `firebase use cap-research-app`
