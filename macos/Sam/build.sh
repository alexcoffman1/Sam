#!/bin/bash
# Build script for Sam macOS app

set -e

echo "🦞 Building Sam for macOS..."

if command -v xcodebuild &> /dev/null; then
    echo "📦 Xcode detected. To open in Xcode, run:"
    echo "   open Package.swift"
fi

# Build with SPM
swift build -c release

echo "✅ Build complete!"
echo "   Executable: .build/release/Sam"
