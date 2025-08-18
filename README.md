# jobseek

## Development Setup

1. Create `.env` file with `SERPAPI_KEY=your_key`
2. Run `npm i`
3. Run `npm run dev`
4. If needed, uncomment devtools: `mainWindow.webContents.openDevTools()`

## Building

- How to compile for mac silicon `npm run build:mac` -> compiled files will be in `dist` folder
- How to compile for mac intel `npm run build:mac-intel` -> compiled files will be in `dist` folder

## Testing

This project uses Jest test framework for testing the Node.js backend code (main and utils folders).

### Available Test Commands

- `npm test` - Run all tests once
- `npm run test:watch` - Run tests in watch mode (re-runs on file changes)
- `npm run test:coverage` - Run tests with coverage report

### Test Structure

```
test/
├── main/           # Tests for src/main/ modules
│   └── routes.test.ts
├── utils/          # Tests for src/utils/ modules
│   ├── filters.test.ts
│   ├── bannedKeywords.test.ts
│   └── ...
└── setup.ts        # Test setup file with global type definitions
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (useful during development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npx jest test/utils/filters.test.ts
```

### Test Environment

Tests are configured to:
- Use Jest with TypeScript support via ts-jest
- Include mock support for file system operations
- Include global type definitions for Electron's process.resourcesPath
- Exclude preload and renderer folders (frontend code)
- Generate coverage reports in text, HTML, and LCOV formats

**Note:** Some tests may need adjustments as the Jest framework was recently implemented. The testing infrastructure is now in place and can be extended with additional test cases.


Preview of UI:

<img width="1844" height="1057" alt="Screenshot 2025-07-31 at 12 03 44" src="https://github.com/user-attachments/assets/04b81b3c-f462-402e-9c8a-3ab1c41d5826" />

Settings section with option to add premium API keys:

<img width="1912" height="1073" alt="Screenshot 2025-07-31 at 12 05 36" src="https://github.com/user-attachments/assets/1b5d71ef-5e11-49cc-8905-3bd1a4d29238" />
