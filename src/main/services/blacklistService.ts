import * as fs from 'fs'
import { ensureFileExists } from './helpers/ensureFileExists'
import { getBlacklistPath } from './helpers/getBlacklistPath'

export const DEFAULT_BLACKLIST: string[] = []

function normalizeBlacklist(items: string[]): string[] {
  return items
    .map((word) => word.toLowerCase().trim())
    .filter((word) => word.length > 0)
    .filter((word, index, arr) => arr.indexOf(word) === index)
}

export const Blacklist = {
  load: (): string[] => {
    try {
      const resourcePath = getBlacklistPath()
      ensureFileExists(resourcePath)

      const fileContent = fs.readFileSync(resourcePath, 'utf8')
      return JSON.parse(fileContent)
    } catch (error) {
      console.error('Error loading blacklist:', error)
      return DEFAULT_BLACKLIST
    }
  },

  save: (blacklistArray: string[]): { success: boolean; message: string; error?: string } => {
    try {
      const resourcePath = getBlacklistPath()
      const cleanedList = normalizeBlacklist(blacklistArray)

      fs.writeFileSync(resourcePath, JSON.stringify(cleanedList, null, 2), 'utf8')

      return {
        success: true,
        message: `Successfully saved blacklist with ${cleanedList.length} words`
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to save blacklist',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}
