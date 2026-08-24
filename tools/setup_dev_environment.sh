#!/usr/bin/env bash
set -e

echo "🚀 Setting up development environment for claude-android-kit..."

# Configure Git to use custom hooks path
git config core.hooksPath .githooks

# Set executable permissions on scripts and hooks
chmod +x .githooks/pre-commit
chmod +x tools/verify_build.sh
chmod +x tools/scaffold_feature.py
chmod +x tools/verify_architecture.py

echo "✅ Git hooks configured to .githooks/"
echo "✅ Tool scripts made executable."
echo "🎉 Ready for local multiplatform development!"
