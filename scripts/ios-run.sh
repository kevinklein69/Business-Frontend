#!/usr/bin/env bash
# Build + install + launch the iOS app in a simulator.
#
# Why this exists instead of `npx cap run ios`: this project lives under ~/Documents,
# which is synced by iCloud Drive. iCloud tags build artifacts with extended attributes
# (com.apple.FinderInfo / com.apple.fileprovider.fpfs#P), and codesign rejects those
# ("resource fork, Finder information, or similar detritus not allowed"). `cap run` builds
# into ios/DerivedData (inside the synced folder) and always hits this. Building into a
# DerivedData folder under /tmp (not synced) avoids it entirely.
set -euo pipefail

SIM_NAME="${SIM_NAME:-iPhone 17}"
APP_ID="de.business.app"
DD="/tmp/biz_dd"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)/ios/App"

UDID=$(xcrun simctl list devices available | grep -m1 "$SIM_NAME (" | grep -oE '[0-9A-F-]{36}')
if [ -z "$UDID" ]; then echo "Simulator '$SIM_NAME' nicht gefunden."; exit 1; fi
echo "Simulator: $SIM_NAME ($UDID)"

xcrun simctl boot "$UDID" 2>/dev/null || true
open -a Simulator || true

echo "Building (DerivedData -> $DD, outside iCloud)…"
xcodebuild -project "$PROJECT_DIR/App.xcodeproj" -scheme App -configuration Debug \
  -sdk iphonesimulator -derivedDataPath "$DD" -destination "id=$UDID" build >/dev/null

APP=$(find "$DD/Build/Products/Debug-iphonesimulator" -maxdepth 1 -name "App.app" | head -1)
echo "Installing $APP"
xcrun simctl install "$UDID" "$APP"
xcrun simctl launch "$UDID" "$APP_ID"
echo "Launched $APP_ID on $SIM_NAME."
