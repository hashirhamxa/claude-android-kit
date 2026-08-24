---
description: Apply an active OpenSpec change proposal by sequentially executing its tasks.md checklist
argument-hint: "[change-id]"
arguments: [change_id]
---

Apply the OpenSpec change proposal: $change_id

Execute the following implementation workflow:
1. Locate and read `openspec/changes/$change_id/tasks.md` and `design.md`.
2. Execute tasks sequentially following Clean Architecture layer order:
   - **Step A (Data Layer):** Create/update DTOs, Room Entities, DAOs, and repository implementations in `:core:*` or `:feature:*:data`.
   - **Step B (Domain Layer):** Create/update pure Kotlin models, repository interfaces, and use cases in `:feature:*:domain`.
   - **Step C (Presentation Layer):** Implement `Contract.kt`, `ViewModel.kt` (`stateIn`), Compose Screen, and native SwiftUI `ContentView.swift`.
3. Mark completed tasks as checked (`[x]`) in `openspec/changes/$change_id/tasks.md`.
4. Run `python tools/verify_architecture.py` to confirm zero SSOT violations.
