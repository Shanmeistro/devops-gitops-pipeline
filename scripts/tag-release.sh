#!/usr/bin/env bash
set -e

# Get latest tag
LATEST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.1")

# Parse version numbers
IFS='.' read -r MAJOR MINOR PATCH <<<"${LATEST_TAG#v}"

# Get latest commit message
MESSAGE=$(git log -1 --pretty=%s)

# Determine bump type
if [[ $MESSAGE == feat:* ]]; then
  ((MINOR++))
  PATCH=0
  CHANGE_TYPE="minor"
elif [[ $MESSAGE == fix:* ]]; then
  ((PATCH++))
  CHANGE_TYPE="patch"
elif [[ $MESSAGE == ci:* ]]; then
  ((PATCH++))
  CHANGE_TYPE="ci"
elif [[ $MESSAGE == docs:* ]]; then
  ((PATCH++))
  CHANGE_TYPE="docs"
else
  CHANGE_TYPE="none"
fi

# Generate new tag
NEW_TAG="v$MAJOR.$MINOR.$PATCH"

if [[ $CHANGE_TYPE == "none" ]]; then
  echo "No version bump for commit: $MESSAGE"
  exit 0
fi

echo "Creating $CHANGE_TYPE release: $NEW_TAG"

git tag -a "$NEW_TAG" -m "Release $NEW_TAG: $MESSAGE"
git push origin "$NEW_TAG"

echo "✅ Tagged and pushed $NEW_TAG"

