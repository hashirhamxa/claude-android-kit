#!/usr/bin/env bash
set -e

# ==============================================================================
# Claude Android Kit - Interactive Project Bootstrapper
# Usage:
#   curl -sSL https://raw.githubusercontent.com/hashirhamxa/claude-android-kit/main/init.sh | bash -s <project-name> <package-name>
# Example:
#   curl -sSL https://raw.githubusercontent.com/hashirhamxa/claude-android-kit/main/init.sh | bash -s my-app com.example.myapp
# ==============================================================================

PROJECT_NAME="${1:-my-awesome-app}"
PACKAGE_NAME="${2:-com.example.app}"
REPO_URL="https://github.com/hashirhamxa/claude-android-kit.git"

echo "================================================================="
echo "🚀 Bootstrapping Claude Android Kit Project: ${PROJECT_NAME}"
echo "📦 Target Package: ${PACKAGE_NAME}"
echo "================================================================="

# 1. Clone repository into target folder
if [ -d "$PROJECT_NAME" ]; then
    echo "❌ Directory '$PROJECT_NAME' already exists. Aborting."
    exit 1
fi

echo "==> Cloning template repository..."
git clone --depth=1 "$REPO_URL" "$PROJECT_NAME"
cd "$PROJECT_NAME"

# 2. Remove template git history
rm -rf .git

# 3. Replace package names in files
echo "==> Customizing package names and project identifiers..."
OLD_PKG="com.kit"
NEW_PKG="$PACKAGE_NAME"

OLD_PKG_PATH=$(echo "$OLD_PKG" | tr '.' '/')
NEW_PKG_PATH=$(echo "$NEW_PKG" | tr '.' '/')

# Replace string occurrences across text and build files
find . -type f \( -name "*.kt" -o -name "*.kts" -o -name "*.xml" -o -name "*.toml" -o -name "*.md" -o -name "*.py" -o -name "*.swift" -o -name "*.json" \) -not -path "*/build/*" -not -path "*/.gradle/*" -exec sed -i.bak "s/$OLD_PKG/$NEW_PKG/g" {} +
find . -type f -name "*.bak" -delete

# Update project name in settings
if [ -f "settings.gradle.kts" ]; then
    sed -i.bak "s/claude-android-kit/$PROJECT_NAME/g" settings.gradle.kts
    rm -f settings.gradle.kts.bak
fi

# 4. Restructure directory trees to match new package path
echo "==> Refactoring package directories..."
for source_dir in $(find . -type d -path "*/kotlin/$OLD_PKG_PATH"); do
    parent_dir=$(dirname "$source_dir")
    base_kotlin_dir=$(echo "$source_dir" | sed "s|/$OLD_PKG_PATH||")
    target_dir="$base_kotlin_dir/$NEW_PKG_PATH"
    
    mkdir -p "$target_dir"
    mv "$source_dir"/* "$target_dir"/ 2>/dev/null || true
    rm -rf "$source_dir"
done

# 5. Initialize fresh Git repo and configure hooks
echo "==> Initializing Git and configuring hooks..."
git init -b main
git config core.hooksPath .githooks

# 6. Set executable permissions
chmod +x .githooks/pre-commit tools/*.sh tools/*.py 2>/dev/null || true

# 7. Run initial architecture lint
echo "==> Verifying architecture rules..."
python3 tools/verify_architecture.py || echo "⚠️ Python not found or linter warned; skipping initial lint."

echo ""
echo "================================================================="
echo "🎉 Project '${PROJECT_NAME}' successfully initialized!"
echo ""
echo "Next Steps:"
echo "  1. cd ${PROJECT_NAME}"
echo "  2. python tools/scaffold_feature.py profile ${PACKAGE_NAME}"
echo "  3. ./tools/verify_build.sh"
echo "================================================================="
