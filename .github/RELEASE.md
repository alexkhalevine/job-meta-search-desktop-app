# Release Process

This repository is configured with automated GitHub Actions to build and distribute binaries for Mac and Windows.

## How to Create a Release

  1. Commit your changes to main branch first:
  - `git add .`
  - `git commit -m "Your changes"`
  - `git push origin main`
  2. Create and push the version tag:
  - `npm version patch`  # (or minor/major)
  - `git push origin --tags`
  - `git push`

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

## Advanced Crawling Feature

The application now includes advanced crawling functionality using [Crawlee](https://crawlee.dev/):

- **Enable/Disable**: Use the "Enable advanced crawling" switch in the app settings
- **Target**: Crawls Wien municipal jobs from `jobs.wien.gv.at`
- **Integration**: Automatically adds results to existing job search when enabled
- **Technology**: Uses Playwright for robust web scraping