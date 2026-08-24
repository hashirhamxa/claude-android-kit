#!/usr/bin/env bash
# logcat_dump.sh - Fast ADB Crash Triage Tool
# Pulls latest Android crash stacktraces and errors from connected device/emulator

echo "======================================================="
echo "📱 Android Logcat Crash Dump & Triage"
echo "======================================================="

# Check if ADB is available
if ! command -v adb >/dev/null 2>&1; then
    echo "❌ adb command not found in PATH. Ensure Android SDK platform-tools are installed."
    exit 1
fi

# Check connected devices
DEVICE_COUNT=$(adb devices | grep -v "List" | grep "device$" | wc -l)
if [ "$DEVICE_COUNT" -eq 0 ]; then
    echo "⚠️ No active Android emulator or device detected via ADB."
    echo "   Ensure your emulator or USB debugging device is running."
    exit 1
fi

echo "==> Pulling Android Runtime FATAL exceptions & crashes..."
echo "-------------------------------------------------------"
adb logcat -d -b crash -b main "*:E" "AndroidRuntime:E" "DEBUG:F" "FATAL:F" | tail -n 100

echo "-------------------------------------------------------"
echo "✅ Crash dump capture complete."
