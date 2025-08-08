#!/bin/bash

# Deploy script for @felixdulfer/ngx-mat-tiptap
# This script handles version bumping, building, publishing, and git tagging

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not in a git repository. Please run this script from the project root."
    exit 1
fi

# Check if there are uncommitted changes
if ! git diff-index --quiet HEAD --; then
    print_error "You have uncommitted changes. Please commit or stash them before deploying."
    exit 1
fi

# Check if we're on the main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
    print_warning "You're not on the main branch (current: $CURRENT_BRANCH). Are you sure you want to continue? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        print_error "Deployment cancelled."
        exit 1
    fi
fi

print_status "Starting deployment process..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
fi

# Run unit tests with coverage
print_status "Running unit tests with coverage..."
npm run test:coverage
print_success "Unit tests passed. Coverage report generated in coverage/."

# Get current version
CURRENT_VERSION=$(node -p "require('./projects/ngx-mat-tiptap/package.json').version")
print_status "Current version: $CURRENT_VERSION"

# Determine the recommended version bump
print_status "Determining version bump based on conventional commits..."
RECOMMENDED_BUMP=$(npx conventional-recommended-bump -p angular)

if [ -z "$RECOMMENDED_BUMP" ]; then
    print_warning "No conventional commits found. Using patch bump."
    RECOMMENDED_BUMP="patch"
fi

print_status "Recommended bump: $RECOMMENDED_BUMP"

# Calculate new version
NEW_VERSION=$(npm version $RECOMMENDED_BUMP --no-git-tag-version --prefix ./projects/ngx-mat-tiptap)
NEW_VERSION=${NEW_VERSION#v}  # Remove 'v' prefix
print_status "New version will be: $NEW_VERSION"

# Update the main package.json version as well
npm version $RECOMMENDED_BUMP --no-git-tag-version

# Update the package name to use the scoped name
print_status "Updating package name to @felixdulfer/ngx-mat-tiptap..."
node -e "
const fs = require('fs');
const packagePath = './projects/ngx-mat-tiptap/package.json';
const package = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
package.name = '@felixdulfer/ngx-mat-tiptap';
fs.writeFileSync(packagePath, JSON.stringify(package, null, 2) + '\n');
"

# Build the library
print_status "Building the library..."
npm run build:lib

# Check if build was successful
if [ ! -d "dist/ngx-mat-tiptap" ]; then
    print_error "Build failed. dist/ngx-mat-tiptap directory not found."
    exit 1
fi

print_success "Library built successfully!"

# Copy the updated package.json to dist
cp projects/ngx-mat-tiptap/package.json dist/ngx-mat-tiptap/

# Check if user is logged in to npm
if ! npm whoami > /dev/null 2>&1; then
    print_error "You are not logged in to npm. Please run 'npm login' first."
    exit 1
fi

# Confirm deployment
print_warning "About to publish @felixdulfer/ngx-mat-tiptap@$NEW_VERSION to npm."
print_warning "This action cannot be undone. Continue? (y/N)"
read -r response
if [[ ! "$response" =~ ^[Yy]$ ]]; then
    print_error "Deployment cancelled."
    exit 1
fi

# Publish to npm
print_status "Publishing to npm..."
cd dist/ngx-mat-tiptap
npm publish --access public
cd ../..

print_success "Successfully published @felixdulfer/ngx-mat-tiptap@$NEW_VERSION to npm!"

# Create git tag
print_status "Creating git tag v$NEW_VERSION..."
git add .
git commit -m "chore: release v$NEW_VERSION

- Bump version to $NEW_VERSION
- Update package name to @felixdulfer/ngx-mat-tiptap"
git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"

# Push changes and tag
print_status "Pushing changes and tag to remote..."
git push origin HEAD
git push origin "v$NEW_VERSION"

print_success "Deployment completed successfully!"
print_success "Package published: @felixdulfer/ngx-mat-tiptap@$NEW_VERSION"
print_success "Git tag created and pushed: v$NEW_VERSION"
