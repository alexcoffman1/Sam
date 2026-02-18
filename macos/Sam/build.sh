#!/bin/bash
# Build script for Sam macOS app

set -e

echo "🦞 Building Sam for macOS..."

# Check for Xcode
if ! command -v xcodebuild &> /dev/null; then
    echo "⚠️  Xcode not found. Using Swift Package Manager..."
    
    # Build with SPM
    swift build -c release
    
    echo "✅ Build complete!"
    echo "   Executable: .build/release/Sam"
    exit 0
fi

# Build with xcodebuild
echo "📦 Building with Xcode..."

# Create build directory
mkdir -p build

# Build the app
xcodebuild -scheme Sam \
    -configuration Release \
    -derivedDataPath build/DerivedData \
    -destination 'platform=macOS' \
    build

# Find the built app
APP_PATH=$(find build/DerivedData -name "Sam.app" -type d | head -1)

if [ -n "$APP_PATH" ]; then
    # Copy to build directory
    cp -R "$APP_PATH" build/
    echo "✅ Build complete!"
    echo "   App: build/Sam.app"
    
    # Optional: Create DMG
    if command -v create-dmg &> /dev/null; then
        echo "📀 Creating DMG..."
        create-dmg \
            --volname "Sam" \
            --window-pos 200 120 \
            --window-size 600 400 \
            --icon-size 100 \
            --icon "Sam.app" 150 190 \
            --app-drop-link 450 190 \
            "build/Sam.dmg" \
            "build/Sam.app"
        echo "   DMG: build/Sam.dmg"
    fi
else
    echo "❌ Build failed - app not found"
    exit 1
fi
