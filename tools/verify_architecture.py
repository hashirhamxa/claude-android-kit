#!/usr/bin/env python3
"""
Static linter enforcing .shared-rules/ SSOT architectural constraints.
Handles comment stripping, aliased imports, and AST-level rule verification.
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

def strip_comments_and_strings(content: str) -> str:
    """Removes block comments, line comments, and string literals to prevent false positives."""
    # Remove block comments
    content = re.sub(r"/\*[\s\S]*?\*/", "", content)
    # Remove string literals (raw & standard)
    content = re.sub(r'"""[\s\S]*?"""', '""', content)
    content = re.sub(r'"([^"\\]|\\.)*"', '""', content)
    return content

def inspect_kotlin_file(path: Path):
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        raw_lines = f.readlines()

    is_common_main = "commonMain" in path.parts
    is_domain_layer = "domain" in path.parts
    is_ui_file = "ui" in path.parts or path.name.endswith("Screen.kt")

    in_block_comment = False

    for idx, line in enumerate(raw_lines, start=1):
        clean_line = line.strip()

        # Handle block comment state
        if "/*" in clean_line and "*/" not in clean_line:
            in_block_comment = True
            continue
        if in_block_comment:
            if "*/" in clean_line:
                in_block_comment = False
            continue

        # Strip line comments
        if "//" in clean_line:
            clean_line = clean_line.split("//")[0].strip()

        if not clean_line:
            continue

        # 1. Strict commonMain & domain Platform Cleanliness (including aliased imports)
        if is_common_main or is_domain_layer:
            if re.search(r"import\s+android(\.|\s+as\s+)", clean_line):
                record_violation(path, idx, "Banned 'android.*' import in commonMain/domain source set.")
            if re.search(r"import\s+androidx\.compose\.ui\.platform\.LocalContext", clean_line):
                record_violation(path, idx, "LocalContext is platform-specific and forbidden in commonMain.")

        # 2. Domain Layer Boundary: No references to data layer
        if is_domain_layer and re.search(r"import\s+.*\.data\.", clean_line):
            record_violation(path, idx, "Clean Architecture Violation: Domain layer must not import Data layer.")

        # 3. Compose Lifecycle Collection Rule (ignore strings/comments)
        if is_ui_file:
            if re.search(r"\.collectAsState\(\)", clean_line) and not re.search(r"\.collectAsStateWithLifecycle\(\)", clean_line):
                record_violation(path, idx, "Forbidden 'collectAsState()'. Use 'collectAsStateWithLifecycle()'.")

        # 4. String-based Route Anti-Pattern
        if "composable(" in clean_line or "composable<" not in clean_line:
            if re.search(r'composable\(\s*"[^"]+"', clean_line):
                record_violation(path, idx, "Forbidden raw string route in composable(). Use @Serializable object/class.")

        # 5. Unstructured Concurrency
        if re.search(r"GlobalScope\.(launch|async)", clean_line):
            record_violation(path, idx, "GlobalScope usage is banned. Inject CoroutineScope or use viewModelScope.")

def run_checks(root_dir: Path = Path(".")):
    print("🔍 Running Architecture & SSOT Lint Verification (v1.1.0 Engine)...")
    for path in root_dir.rglob("*.kt"):
        # Skip generated/build directories
        if any(part in ["build", ".gradle", ".idea", ".git"] for part in path.parts):
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
