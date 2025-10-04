import * as path from 'path'
import * as fs from 'fs'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Process {
      readonly resourcesPath: string
    }
  }
}

export function getBlacklistPath(): string {
  const isDev = process.env.NODE_ENV === 'development'

  if (isDev) {
    return path.join(process.cwd(), 'resources', 'blacklist.json')
  }

  const possiblePaths = [
    path.join(process.resourcesPath, 'resources', 'blacklist.json'),
    path.join(process.resourcesPath, 'blacklist.json'),
    path.join(__dirname, '..', '..', 'resources', 'blacklist.json'),
    path.join(process.cwd(), 'resources', 'blacklist.json'),
    path.join(process.resourcesPath, 'app', 'resources', 'blacklist.json'),
    path.join(__dirname, '..', '..', '..', 'Resources', 'resources', 'blacklist.json')
  ]

  const foundPath = possiblePaths.find((p) => fs.existsSync(p))
  if (foundPath) return foundPath

  return possiblePaths[0]
}
