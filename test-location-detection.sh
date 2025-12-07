#!/bin/bash
# Test script for location detection feature

echo "🧪 Testing Location Detection Feature"
echo "======================================"
echo ""

# Test 1: Check if location service exists and is valid
echo "✓ Test 1: Checking location-service.ts..."
if [ -f "lib/location-service.ts" ]; then
  echo "  ✅ lib/location-service.ts exists"
else
  echo "  ❌ lib/location-service.ts not found"
  exit 1
fi

# Test 2: Check if location detector component exists
echo "✓ Test 2: Checking location-detector.tsx..."
if [ -f "components/location-detector.tsx" ]; then
  echo "  ✅ components/location-detector.tsx exists"
else
  echo "  ❌ components/location-detector.tsx not found"
  exit 1
fi

# Test 3: Verify imports in server actions
echo "✓ Test 3: Checking server action imports..."
if grep -q "detectLocation, updateProfileLocation" app/cli-login/actions.ts; then
  echo "  ✅ CLI login actions imports location service"
else
  echo "  ❌ CLI login actions missing location service import"
  exit 1
fi

if grep -q "detectLocation, updateProfileLocation" app/\(auth\)/login/actions.ts; then
  echo "  ✅ Web login actions imports location service"
else
  echo "  ❌ Web login actions missing location service import"
  exit 1
fi

# Test 4: Verify LocationDetector component usage
echo "✓ Test 4: Checking LocationDetector component usage..."
if grep -q "LocationDetector" app/dashboard/page.tsx; then
  echo "  ✅ Dashboard page uses LocationDetector"
else
  echo "  ❌ Dashboard page missing LocationDetector"
  exit 1
fi

if grep -q "LocationDetector" app/cli-login/page.tsx; then
  echo "  ✅ CLI login page uses LocationDetector"
else
  echo "  ❌ CLI login page missing LocationDetector"
  exit 1
fi

# Test 5: Build check
echo "✓ Test 5: Running production build..."
npm run build > /tmp/build-output.txt 2>&1
if [ $? -eq 0 ]; then
  echo "  ✅ Build successful"
else
  echo "  ❌ Build failed - check /tmp/build-output.txt"
  tail -50 /tmp/build-output.txt
  exit 1
fi

echo ""
echo "======================================"
echo "✅ All tests passed!"
echo ""
echo "📝 Implementation Summary:"
echo "  - Location detection service created"
echo "  - Client-side component for post-confirmation detection"
echo "  - Server-side detection for immediate sessions"
echo "  - Integrated in both CLI and web signup flows"
echo ""
echo "🚀 Ready to deploy!"
