# Spec-Driven Development (SDD) & Agent Rules

## 1. Core Principles

1. **Spec First, Code Second:** Never write implementation code without an active proposal in `openspec/changes/<change-id>/` approved by the developer or defined by an SDD cycle.
2. **Delta Contracts:** All behavior modifications must be modeled as delta specs (`ADDED Requirements`, `MODIFIED Requirements`, `REMOVED Requirements`) using RFC 2119 keywords (`MUST`, `SHOULD`, `MAY`).
3. **Layered Execution Sequence:** Always apply changes strictly in dependency order:
   `Data Layer (DTO/Entity) ──▶ Domain (Model/Repository Contract) ──▶ Presentation (ViewModel ──▶ Compose/SwiftUI)`.
4. **Hard Verification Gates:** Code is not complete until `./gradlew testDebugUnitTest` and `python tools/verify_architecture.py` pass cleanly.

---

## 2. The 5-Stage SDD Lifecycle

```text
/opsx:explore ──► /opsx:propose ──► /opsx:apply ──► /opsx:verify ──► /opsx:archive
  (Ideation)       (Write specs)    (Write code)   (Test/Lint)     (Merge deltas)
```

- **Stage 1 (`explore`):** Analyze existing codebase, review living specs in `openspec/specs/`, and identify impacted Gradle modules.
- **Stage 2 (`propose`):** Generate `proposal.md`, `design.md`, `tasks.md`, and delta `specs/`.
- **Stage 3 (`apply`):** Implement the checklist items defined in `tasks.md` sequentially.
- **Stage 4 (`verify`):** Execute automated Gradle tests, Konsist architectural tests, and static linting. Self-correct if errors occur.
- **Stage 5 (`archive`):** Reconcile AST signatures, merge delta specs into `openspec/specs/`, and move the change workspace into `openspec/changes/archive/`.

---

## 3. Dual-Track Mode (QuickFix)
For localized bug fixes (< 20 lines of code), agents bypass the 4-file ceremony and generate a single-file `patch.md` tracking Root Cause, Changes, and Unit Tests via `/opsx:quickfix`.
