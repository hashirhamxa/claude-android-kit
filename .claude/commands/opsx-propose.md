---
description: Create a Spec-Driven Development (SDD) change proposal with proposal.md, design.md, tasks.md, and delta specs
argument-hint: "[feature-name]"
arguments: [name]
---

Create an OpenSpec SDD proposal for feature: $name

Execute the following steps:
1. Run `python tools/openspec_manager.py propose $name`.
2. Inspect `openspec/project.md` and related living specs in `openspec/specs/`.
3. Locate the created change proposal in `openspec/changes/YYYY-MM-DD-$name/`.
4. Refine `proposal.md` with concrete Problem Statements, In-Scope, and Out-of-Scope boundaries.
5. Refine `design.md` with:
   - Specific affected Gradle modules (`:feature:...`, `:core:...`).
   - Sealed `UiState`, `UiIntent`, and `UiEffect` contracts.
   - Pure domain repository interfaces.
   - Ktor 3 / Room 3 KMP database changes.
6. Refine `specs/.../spec.md` with RFC 2119 `ADDED Requirements` and `Given / When / Then` scenarios.
7. Break down `tasks.md` into sequential implementation tasks ordered from Data ──▶ Domain ──▶ UI.
