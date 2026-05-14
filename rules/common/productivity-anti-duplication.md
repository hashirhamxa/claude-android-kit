# Productivity & Anti-Duplication

Before creating any new file, class, function, composable, string, or drawable: grep for two related symbols first — the thing you're about to name and the layer/package it belongs in. Read the matches fully, then state the decision in one line before editing: "Extending `OrderRepository` — it already has `getOrders()`. Adding `getOrdersByStatus()` next to it."

## Single source of truth

- One `AppContainer` per app (and feature containers beneath it). Never create a parallel module/provider/injector.
- One theme token set: `Theme.kt`, `Color.kt`, `Type.kt`. Add tokens there; don't shadow them elsewhere.
- One `NavGraph.kt` per app module.
- One `strings.xml` key per concept; reuse by meaning, not by screen.
- One configured Ktor `HttpClient` in the container.
- One database class per app and one DAO per entity group.

## Reuse before create

- Use case: extend `GetX` / `FetchX` / `LoadX` / `ObserveX` before forking a near-duplicate.
- Repository: extend `<Entity>Repository`; don't split repositories by screen or one-off use case.
- Compose UI: reuse role-based components from shared `ui/components/` or `ui/common/`.
- DTO/entity/model/mapper: add overloads or mappings to the existing type before minting a twin.
- Extensions live in the existing `*Ext.kt` for that receiver and intent.
- Reuse drawables and string resources by concept; tint or reword if needed, don't re-export clones.

## No orphan files

Don't create a file unless you can wire it in the same turn:

- New use case -> instantiate in `AppContainer` and inject into a real caller.
- New screen -> add to `NavGraph` and make it reachable.
- New repository -> bind in `AppContainer` and use it from at least one caller.
- New DAO -> register in the database and add the migration if schema changed.
- New string -> reference it from at least one composable or screen.

## Default workflow

1. Read the files you will edit and their callers.
2. Plan in 3-6 bullets naming every file you expect to touch. If the scope grows past ~8 files, pause and split.
3. Edit in planned order. Prefer targeted edits over whole-file rewrites.
4. Verify with the right Gradle task (`:app:assembleDebug`, `:composeApp:assembleDebug`, etc.), then read back the changed files before claiming done.

## Guardrails

- Prefer editing an existing file unless the change would push it past ~400 lines, cross into a different layer, or violate a package convention that wants one type per file.
- Batch read-only investigation in parallel; do not guess file paths, class names, or dependencies.
- Ask before deleting files, adding dependencies, changing module boundaries, or introducing Room/SQLDelight migrations.
- If one read-plan cycle still leaves ambiguity, ask one focused question instead of improvising.
