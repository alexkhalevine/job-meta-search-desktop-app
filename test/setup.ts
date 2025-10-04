// Test setup file to extend global types and suppress console output
export {}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Process {
      resourcesPath: string
    }
  }
}

// Suppress console output during tests to prevent CI failures
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
}
