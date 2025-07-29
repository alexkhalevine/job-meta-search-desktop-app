import * as fs from 'fs'
import * as path from 'path'

export const Blacklist = {
  load: (): Array<string> => {
    try {
      const isDev = process.env.NODE_ENV === 'development'
      let resourcePath: string

      if (isDev) {
        // In development, use the resources folder directly
        resourcePath = path.join(process.cwd(), 'resources', 'blacklist.json')
      } else {
        // In production, try multiple possible paths for macOS app bundles
        const possiblePaths = [
          path.join(process.resourcesPath, 'resources', 'blacklist.json'),
          path.join(process.resourcesPath, 'blacklist.json'),
          path.join(__dirname, '..', '..', 'resources', 'blacklist.json'),
          path.join(process.cwd(), 'resources', 'blacklist.json'),
          // Additional paths for macOS app bundle
          path.join(process.resourcesPath, 'app', 'resources', 'blacklist.json'),
          path.join(__dirname, '..', '..', '..', 'Resources', 'resources', 'blacklist.json')
        ]

        resourcePath = possiblePaths.find((p) => fs.existsSync(p)) || possiblePaths[0]
        console.log('Trying blacklist paths:', possiblePaths)
        console.log('Selected path:', resourcePath)
      }

      console.log('Loading blacklist from:', resourcePath)
      console.log('File exists:', fs.existsSync(resourcePath))

      if (!fs.existsSync(resourcePath)) {
        console.error('Blacklist file not found, creating default file')

        // Create default blacklist content
        const defaultBlacklist = [
          'friseur', 'koch', 'chef', 'küche', 'gastronomie', 'pflege',
          'reinigung', 'verkauf', 'kanzlei', 'backstube', 'kantine',
          'entwickler', 'filialleiter', 'lager', 'fahrer'
        ]

        try {
          // Try to create the directory if it doesn't exist
          const dir = path.dirname(resourcePath)
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
          }

          // Create the file with default content
          fs.writeFileSync(resourcePath, JSON.stringify(defaultBlacklist, null, 2), 'utf8')
          console.log('Created default blacklist file at:', resourcePath)
        } catch (createError) {
          console.error('Failed to create blacklist file:', createError)
        }

        return defaultBlacklist
      }

      const fileContent = fs.readFileSync(resourcePath, 'utf8')
      return JSON.parse(fileContent)
    } catch (error) {
      console.error('Error loading blacklist:', error)
      // Return a default blacklist on error
      return [
        'friseur', 'koch', 'chef', 'küche', 'gastronomie', 'pflege',
        'reinigung', 'verkauf', 'kanzlei', 'backstube', 'kantine',
        'entwickler', 'filialleiter', 'lager', 'fahrer'
      ]
    }
  },
  save: (blacklistArray: string[]): { success: boolean; message: string; error?: string } => {
    try {
      const isDev = process.env.NODE_ENV === 'development'
      let resourcePath: string

      if (isDev) {
        // In development, use the resources folder directly
        resourcePath = path.join(process.cwd(), 'resources', 'blacklist.json')
      } else {
        // In production, try multiple possible paths for macOS app bundles
        const possiblePaths = [
          path.join(process.resourcesPath, 'resources', 'blacklist.json'),
          path.join(process.resourcesPath, 'blacklist.json'),
          path.join(__dirname, '..', '..', 'resources', 'blacklist.json'),
          path.join(process.cwd(), 'resources', 'blacklist.json'),
          // Additional paths for macOS app bundle
          path.join(process.resourcesPath, 'app', 'resources', 'blacklist.json'),
          path.join(__dirname, '..', '..', '..', 'Resources', 'resources', 'blacklist.json')
        ]

        resourcePath = possiblePaths.find((p) => fs.existsSync(p)) || possiblePaths[0]
      }

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
