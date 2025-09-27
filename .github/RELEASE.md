# Release Process

This repository is configured with automated GitHub Actions to build and distribute binaries for Mac and Windows.

## How to Create a Release

1. **Update version in package.json**:
   ```bash
   npm version patch  # or minor, major
   ```

2. **Push the tag to trigger release**:
   ```bash
   git push origin --tags
   ```

3. **GitHub Actions will automatically**:
   - Build binaries for Mac (DMG and ZIP)
   - Build binaries for Windows (NSIS installer)
   - Create a GitHub release with all binaries attached

## Manual Testing

To test builds without creating a release:
- Push to `main` branch to trigger test builds
- Check the Actions tab for build status

## Artifact Names

- Mac: `jobseek-{version}-mac-x64.dmg`
- Windows: `jobseek-{version}-windows-setup.exe`

## Supported Platforms

- **macOS**: x64 (Intel) - DMG and ZIP formats
- **Windows**: x64 - NSIS installer

## Configuration Files

- `.github/workflows/build-release.yml` - Main release workflow
- `.github/workflows/test-build.yml` - Test builds on PR/push
- `electron-builder.yml` - Build configuration