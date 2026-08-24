#!/usr/bin/env python3
"""
Static linter enforcing .shared-rules/ SSOT architectural constraints.
Exits with 0 on pass, 1 on rule violations.
"""

import os
import re
import sys
from pathlib import Path

# Ensure UTF-8 output across all platforms (Windows console support)
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

VIOLATIONS = []

def record_violation(file_path: Path, line_no: int, message: str):
    VIOLATIONS.append(f"❌ {file_path}:{line_no} -> {message}")

def inspect_kotlin_file(path: Path):
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        lines = f.readlines()

    is_common_main = "commonMain" in path.parts
    is_ui_file = "ui" in path.parts or path.name.endswith("Screen.kt")

    for idx, line in enumerate(lines, start=1):
        # 1. Strict commonMain Platform Cleanliness
        if is_common_main:
            if re.search(r"import\s+android\.", line):
                record_violation(path, idx, "Banned 'android.*' import in commonMain source set.")
            if re.search(r"import\s+androidx\.compose\.ui\.platform\.LocalContext", line):
                record_violation(path, idx, "LocalContext is platform-specific and forbidden in commonMain.")

        # 2. Compose Lifecycle Collection Rule
        if is_ui_file:
            if re.search(r"\.collectAsState\(\)", line) and not re.search(r"\.collectAsStateWithLifecycle\(\)", line):
                record_violation(path, idx, "Forbidden 'collectAsState()'. Use 'collectAsStateWithLifecycle()'.")

        # 3. String-based Route Anti-Pattern
        if "composable(" in line:
            if re.search(r'composable\(\s*"[^"]+"', line):
                record_violation(path, idx, "Forbidden raw string route in composable(). Use @Serializable object/class.")

        # 4. Unstructured Concurrency
        if re.search(r"GlobalScope\.(launch|async)", line):
            record_violation(path, idx, "GlobalScope usage is banned. Inject CoroutineScope or use viewModelScope.")

def run_checks(root_dir: Path = Path(".")):
    print("🔍 Running Architecture & SSOT Lint Verification...")
    for path in root_dir.rglob("*.kt"):
        # Skip generated/build directories
        if any(part in ["build", ".gradle", ".idea"] for part in path.parts):
            continue
        inspect_kotlin_file(path)

    if VIOLATIONS:
        print(f"\nFound {len(VIOLATIONS)} architecture violation(s):")
        for v in VIOLATIONS:
            print(v)
        sys.exit(1)
    else:
        print("✅ Zero SSOT architecture violations detected.")
        sys.exit(0)

if __name__ == "__main__":
    run_checks()
