import * as fs from 'fs'
import * as path from 'path'
import { DEFAULT_BLACKLIST } from '../blacklistService'

export function ensureFileExists(filePath: string): void {
  if (fs.existsSync(filePath)) return

  console.error('Blacklist file not found, creating default file')

  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  fs.writeFileSync(filePath, JSON.stringify(DEFAULT_BLACKLIST, null, 2), 'utf8')
}
