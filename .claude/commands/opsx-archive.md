---
description: Reconcile code changes, merge delta specs into openspec/specs/, and archive the completed change proposal
argument-hint: "[change-id]"
arguments: [change_id]
---

Archive completed change: $change_id

Execute the following steps:
1. Verify all checklist items in `openspec/changes/$change_id/tasks.md` are marked `[x]`.
2. Diffs generated Kotlin signatures against `design.md`. If manual alterations occurred during coding, reconcile `design.md` and delta specs to match the actual code before archiving.
3. Run `python tools/openspec_manager.py archive $change_id`.
4. Confirm delta specs were cleanly merged into `openspec/specs/`.
