// Test setup file to extend global types
export {}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Process {
      resourcesPath: string
    }
  }
}
