#!/usr/bin/env bash
set -e

echo "======================================================="
echo "🛠️  Running Cross-Platform Compilation & Test Verification"
echo "======================================================="

# 1. Run Architecture Static Checks
python3 tools/verify_architecture.py

# 2. Check Android & Common compilation
echo "==> Compiling Android & Shared Common Kotlin..."
./gradlew compileDebugKotlin compileKotlinMetadata

# 3. Check iOS Simulator Target compilation
echo "==> Compiling iOS Simulator Target (KMP Native)..."
./gradlew compileKotlinIosSimulatorArm64

# 4. Run Common Unit Tests with Turbine
echo "==> Executing Common & Android Unit Tests..."
./gradlew testDebugUnitTest

echo "======================================================="
echo "✅ All platform targets and tests compiled successfully!"
echo "======================================================="
