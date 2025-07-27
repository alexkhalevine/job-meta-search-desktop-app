import * as fs from 'fs'
import * as path from 'path'

export const Blacklist = {
  load: (): Array<string> => {
    const isDev = process.env.NODE_ENV === 'development'
    // In development, use the resources folder directly
    // In production, use the app's resource path
    const resourcePath = isDev
      ? path.join(process.cwd(), 'resources', 'blacklist.json')
      : path.join(process.resourcesPath, 'blacklist.json')

    const fileContent = fs.readFileSync(resourcePath, 'utf8')

    return JSON.parse(fileContent)
  },
  update: (newWord: string): { success: boolean; message: string; error?: string } => {
    try {
      const isDev = process.env.NODE_ENV === 'development'
      // In development, use the resources folder directly
      // In production, use the app's resource path
      const resourcePath = isDev
        ? path.join(process.cwd(), 'resources', 'blacklist.json')
        : path.join(process.resourcesPath, 'blacklist.json')

      // Read current blacklist
      const currentList = Blacklist.load()

      // Check if word already exists (case-insensitive)
      const normalizedNewWord = newWord.toLowerCase().trim()
      if (currentList.some((word) => word.toLowerCase() === normalizedNewWord)) {
        return {
          success: false,
          message: `Word "${newWord}" already exists in the blacklist`
        }
      }

      // Add new word to the list
      currentList.push(normalizedNewWord)

      // Write updated list back to file
      fs.writeFileSync(resourcePath, JSON.stringify(currentList, null, 2), 'utf8')

      return {
        success: true,
        message: `Successfully added "${newWord}" to the blacklist`
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to update blacklist`,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  },
  save: (blacklistArray: string[]): { success: boolean; message: string; error?: string } => {
    try {
      const isDev = process.env.NODE_ENV === 'development'
      const resourcePath = isDev
        ? path.join(process.cwd(), 'resources', 'blacklist.json')
        : path.join(process.resourcesPath, 'blacklist.json')

      // Filter out empty strings and normalize
      const cleanedList = blacklistArray
        .map((word) => word.toLowerCase().trim())
        .filter((word) => word.length > 0)
        .filter((word, index, arr) => arr.indexOf(word) === index) // Remove duplicates

      // Write updated list back to file
      fs.writeFileSync(resourcePath, JSON.stringify(cleanedList, null, 2), 'utf8')

      return {
        success: true,
        message: `Successfully saved blacklist with ${cleanedList.length} words`
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to save blacklist`,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}
