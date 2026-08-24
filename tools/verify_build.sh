#!/usr/bin/env bash
set -e

MODULE_TARGET="${1:-all}"

echo "======================================================="
echo "🛠️  Cross-Platform Compilation & Test Verification"
echo "📦 Target Scope: ${MODULE_TARGET}"
echo "======================================================="

# 1. Detect Python Command
PY_CMD=""
if command -v python3 >/dev/null 2>&1 && python3 --version >/dev/null 2>&1; then
    PY_CMD="python3"
elif command -v python >/dev/null 2>&1 && python --version >/dev/null 2>&1; then
    PY_CMD="python"
elif command -v py >/dev/null 2>&1 && py --version >/dev/null 2>&1; then
    PY_CMD="py"
fi

if [ -n "$PY_CMD" ]; then
    echo "==> Running Architecture Static Checks ($PY_CMD)..."
    $PY_CMD tools/verify_architecture.py
else
    echo "==> Skipping Python architecture lint (Python not found)"
fi

# 2. Check Android & Common compilation
if [ "$MODULE_TARGET" != "all" ]; then
    echo "==> Scoped Module Build: ${MODULE_TARGET}..."
    ./gradlew "${MODULE_TARGET}:compileDebugKotlin" --stacktrace
else
    echo "==> Compiling Android & Shared Common Kotlin..."
    ./gradlew compileDebugKotlin compileKotlinMetadata --stacktrace

    echo "==> Compiling iOS Simulator Target (KMP Native)..."
    ./gradlew compileKotlinIosSimulatorArm64 --stacktrace

    echo "==> Executing Common & Android Unit Tests (with Konsist)..."
    ./gradlew testDebugUnitTest --stacktrace
fi

echo "======================================================="
echo "✅ Verification checks completed successfully!"
echo "======================================================="
