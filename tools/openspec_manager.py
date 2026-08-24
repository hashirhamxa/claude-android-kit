#!/usr/bin/env python3
"""
OpenSpec Manager for claude-android-kit.
Handles Spec-Driven Development (SDD) lifecycle: propose, list, apply, verify, and archive.

Usage:
  python tools/openspec_manager.py propose <feature_name>
  python tools/openspec_manager.py quickfix <fix_name>
  python tools/openspec_manager.py list
  python tools/openspec_manager.py archive <change_id>
"""

import sys
import os
import shutil
import argparse
from datetime import datetime
from pathlib import Path

# Ensure UTF-8 output across all platforms (Windows console support)
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BASE_DIR = Path("openspec")
CHANGES_DIR = BASE_DIR / "changes"
SPECS_DIR = BASE_DIR / "specs"
ARCHIVE_DIR = CHANGES_DIR / "archive"

def create_file(path: Path, content: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")
    print(f"  + Created: {path}")

def propose_feature(name: str):
    date_str = datetime.now().strftime("%Y-%m-%d")
    slug = name.lower().replace(" ", "-").replace("_", "-")
    change_id = f"{date_str}-{slug}"
    target_dir = CHANGES_DIR / change_id

    if target_dir.exists():
        print(f"❌ Change proposal '{change_id}' already exists at {target_dir}")
        sys.exit(1)

    print(f"\n🚀 Creating OpenSpec Proposal: {change_id}")

    # 1. Proposal
    create_file(target_dir / "proposal.md", f"""# Change Proposal: {name.capitalize()}

## 1. Intent & Problem Statement
Describe what this change accomplishes, user problems solved, and architectural goals.

## 2. In Scope
- Scope item 1
- Scope item 2

## 3. Out of Scope
- Deferred capabilities
""")

    # 2. Design
    create_file(target_dir / "design.md", f"""# Technical Design: {name.capitalize()}

## 1. Module Impact
- Affected Modules: `:feature:{slug}:domain`, `:feature:{slug}:data`, `:feature:{slug}:ui`

## 2. Contracts & State Models
```kotlin
// UI State & Intents
sealed interface {slug.capitalize()}UiState {{
    data object Loading : {slug.capitalize()}UiState
    data class Success(val data: String) : {slug.capitalize()}UiState
    data class Error(val message: String) : {slug.capitalize()}UiState
}}
```

## 3. Data & Persistence Impact
- Database migrations: `false`
- Network endpoints: `Ktor 3 /api/v1/{slug}`
""")

    # 3. Tasks
    create_file(target_dir / "tasks.md", f"""# Implementation Checklist: {name.capitalize()}

- [ ] **1. Domain Contracts (`:feature:{slug}:domain`)**
  - [ ] Define repository interface
  - [ ] Define immutable domain models
- [ ] **2. Data Layer (`:feature:{slug}:data`)**
  - [ ] Implement repository with Ktor / Room data sources
- [ ] **3. UI & ViewModel (`:feature:{slug}:ui`)**
  - [ ] Implement ViewModel with `stateIn(WhileSubscribed(5000))`
  - [ ] Implement Compose Screen with `collectAsStateWithLifecycle()`
  - [ ] Implement SwiftUI View in `iosApp` with `@Observable`
- [ ] **4. Verification**
  - [ ] Add unit test with Turbine in `commonTest`
  - [ ] Run `python tools/verify_architecture.py`
  - [ ] Run `./gradlew testDebugUnitTest`
""")

    # 4. Delta Spec
    create_file(target_dir / "specs" / slug / "spec.md", f"""# Delta Spec: {name.capitalize()}

## ADDED Requirements

### Requirement: Core {name.capitalize()} Flow
The system MUST provide a deterministic {slug} flow adhering to UDF.

#### Scenario: Successful Flow
- **GIVEN** a valid initial state
- **WHEN** the user triggers the action
- **THEN** the system MUST transition to the success state.
""")

    print(f"\n✅ OpenSpec Change created: {target_dir}")
    print(f"👉 Next steps: Edit proposal & design, then execute with `/opsx:apply {change_id}`")

def quickfix_feature(name: str):
    date_str = datetime.now().strftime("%Y-%m-%d")
    slug = name.lower().replace(" ", "-").replace("_", "-")
    change_id = f"{date_str}-quickfix-{slug}"
    target_dir = CHANGES_DIR / change_id

    print(f"\n⚡ Creating OpenSpec QuickFix: {change_id}")
    create_file(target_dir / "patch.md", f"""# QuickFix Patch: {name}

## 1. Root Cause Analysis
Explain the bug or regression, including reproduction steps.

## 2. Targeted Changes (< 20 LOC)
- Module:
- File:
- Fix Description:

## 3. Regression Test
- Added test case:
""")
    print(f"✅ QuickFix patch created: {target_dir / 'patch.md'}")

def list_changes():
    print("\n📋 Active OpenSpec Proposals:")
    active_count = 0
    if CHANGES_DIR.exists():
        for item in sorted(CHANGES_DIR.iterdir()):
            if item.is_dir() and item.name != "archive":
                print(f"  • [Active] {item.name}")
                active_count += 1
    if active_count == 0:
        print("  (No active proposals)")

    print("\n📦 Archived Changes:")
    archive_count = 0
    if ARCHIVE_DIR.exists():
        for item in sorted(ARCHIVE_DIR.iterdir()):
            if item.is_dir():
                print(f"  • [Archived] {item.name}")
                archive_count += 1
    if archive_count == 0:
        print("  (No archived proposals)")
    print()

def archive_change(change_id: str):
    source_dir = CHANGES_DIR / change_id
    if not source_dir.exists():
        print(f"❌ Change proposal '{change_id}' not found in {CHANGES_DIR}")
        sys.exit(1)

    print(f"\n📦 Archiving OpenSpec Change: {change_id}")

    # 1. Merge delta specs into living specs
    delta_specs_dir = source_dir / "specs"
    if delta_specs_dir.exists():
        for spec_file in delta_specs_dir.rglob("*.md"):
            rel_path = spec_file.relative_to(delta_specs_dir)
            target_spec = SPECS_DIR / rel_path
            target_spec.parent.mkdir(parents=True, exist_ok=True)
            
            with open(spec_file, "r", encoding="utf-8") as sf:
                delta_content = sf.read()
            
            if target_spec.exists():
                with open(target_spec, "a", encoding="utf-8") as tf:
                    tf.write(f"\n\n<!-- Merged from change: {change_id} -->\n" + delta_content)
                print(f"  + Merged delta spec into living spec: {target_spec}")
            else:
                shutil.copy2(spec_file, target_spec)
                print(f"  + Created new living spec: {target_spec}")

    # 2. Move proposal to archive
    ARCHIVE_DIR.mkdir(parents=True, exist_ok=True)
    target_archive = ARCHIVE_DIR / change_id
    if target_archive.exists():
        shutil.rmtree(target_archive)
    shutil.move(str(source_dir), str(target_archive))
    print(f"✅ Change moved to archive: {target_archive}\n")

def main():
    parser = argparse.ArgumentParser(description="OpenSpec SDD lifecycle manager.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    p_propose = subparsers.add_parser("propose", help="Create a new change proposal")
    p_propose.add_argument("name", help="Proposal name (e.g. biometric-login, offline-sync)")

    p_quickfix = subparsers.add_parser("quickfix", help="Create a lightweight patch for a bug fix")
    p_quickfix.add_argument("name", help="Fix name (e.g. nav-backstack-leak)")

    subparsers.add_parser("list", help="List active and archived proposals")

    p_archive = subparsers.add_parser("archive", help="Merge delta specs and archive change")
    p_archive.add_argument("change_id", help="Directory name of the change proposal")

    args = parser.parse_args()

    if args.command == "propose":
        propose_feature(args.name)
    elif args.command == "quickfix":
        quickfix_feature(args.name)
    elif args.command == "list":
        list_changes()
    elif args.command == "archive":
        archive_change(args.change_id)

if __name__ == "__main__":
    main()
