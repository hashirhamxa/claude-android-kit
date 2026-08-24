#!/usr/bin/env bash
set -e

echo "======================================================="
echo "🛠️  Running Cross-Platform Compilation & Test Verification"
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
echo "==> Compiling Android & Shared Common Kotlin..."
./gradlew compileDebugKotlin compileKotlinMetadata

# 3. Check iOS Simulator Target compilation
echo "==> Compiling iOS Simulator Target (KMP Native)..."
./gradlew compileKotlinIosSimulatorArm64

# 4. Run Common Unit Tests with Turbine & Konsist
echo "==> Executing Common & Android Unit Tests..."
./gradlew testDebugUnitTest

echo "======================================================="
echo "✅ All platform targets and tests compiled successfully!"
echo "======================================================="
