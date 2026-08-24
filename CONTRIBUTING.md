# Contributing to Claude Android Kit

Thank you for contributing to **Claude Android Kit**! This project bridges Kotlin Multiplatform, Compose, Native iOS SwiftUI, and AI developer platforms (Cursor, Claude Code, Google Antigravity).

---

## 🏛️ SSOT Architecture Contribution Workflow

To prevent LLM hallucination and rule drift, all architectural guidelines follow a **Single Source of Truth (SSOT)** model:

```text
┌────────────────────────────────────────┐
│        .shared-rules/ (SSOT)           │  <-- Master Architectural Guidelines
└───────────────────┬────────────────────┘
                    │ (Must sync changes to all 3 adapters)
    ┌───────────────┼───────────────┐
    ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌───────────────────────┐
│ Cursor Rules │ │ Claude Code  │ │  Google Antigravity   │
│.cursor/rules/│ │  CLAUDE.md   │ │   AGENT_WORKSPACE.md  │
└──────────────┘ └──────────────┘ └───────────────────────┘
```

### Rule Sync Checklist:
Whenever you propose a new architecture rule or modify an existing one:
1. **Update `.shared-rules/`**: Modify or add the target `.md` rule file.
2. **Update `.cursor/rules/`**: Update the corresponding `.mdc` file with matching `globs` and instructions.
3. **Update Claude Code**: Reflect the changes in `CLAUDE.md` and `.claude/commands/` if relevant.
4. **Update Antigravity**: Update `AGENT_WORKSPACE.md` and `.antigravity/gates/task_verification_gates.json` if execution lanes or gates are affected.

---

## 🛠️ Local Development & Testing

### 1. Setup Local Environment
Run the one-time bootstrap script to configure `.githooks/` and executable permissions:

```bash
chmod +x tools/setup_dev_environment.sh
./tools/setup_dev_environment.sh
```

### 2. Verify Architecture Rules
Before committing, execute the static linter to ensure zero anti-pattern violations:

```bash
python tools/verify_architecture.py
```

### 3. Run Build & Unit Tests
Validate multiplatform compilation across Android, JVM, and iOS simulator targets:

```bash
./tools/verify_build.sh
```

---

## 📋 Pull Request Requirements

- All PRs must pass the GitHub Actions CI matrix (`ubuntu-latest` and `macos-14`).
- No Android SDK imports (`android.*`, `androidx.compose.ui.platform.LocalContext`) in `commonMain`.
- Any new dependencies must be added to `gradle/libs.versions.toml` with explicit version pinning.
- Provide a clear PR description highlighting which `.shared-rules/` files were touched.
