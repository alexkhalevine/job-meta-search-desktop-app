const fs = require('fs');
const path = require('path');

// Simulate the production environment path resolution
function testBlacklistPaths() {
  console.log('Testing blacklist path resolution...\n');

  // Mock process.resourcesPath for macOS app bundle
  const mockResourcesPath = '/Applications/shadcn-electron-app.app/Contents/Resources';

  const possiblePaths = [
    path.join(mockResourcesPath, 'resources', 'blacklist.json'),
    path.join(mockResourcesPath, 'blacklist.json'),
    path.join(__dirname, '..', '..', 'resources', 'blacklist.json'),
    path.join(process.cwd(), 'resources', 'blacklist.json'),
    // Additional paths for macOS app bundle
    path.join(mockResourcesPath, 'app', 'resources', 'blacklist.json'),
    path.join(__dirname, '..', '..', '..', 'Resources', 'resources', 'blacklist.json')
  ];

  console.log('Possible paths that will be tried:');
  possiblePaths.forEach((p, i) => {
    console.log(`${i + 1}. ${p}`);
  });

  console.log('\nChecking current development setup:');
  const devPath = path.join(process.cwd(), 'resources', 'blacklist.json');
  console.log(`Dev path: ${devPath}`);
  console.log(`Dev file exists: ${fs.existsSync(devPath)}`);

  if (fs.existsSync(devPath)) {
    try {
      const content = JSON.parse(fs.readFileSync(devPath, 'utf8'));
      console.log(`Blacklist contains ${content.length} words`);
    } catch (e) {
      console.log('Error reading blacklist:', e.message);
    }
  }
}

testBlacklistPaths();
