import * as fs from 'fs'
import * as path from 'path'

interface Settings {
  secrets: {
    SERPAPI_KEY: string
  }
}

export const SettingsLoader = {
  load: (): Settings => {
    try {
      const isDev = process.env.NODE_ENV === 'development'
      let settingsPath: string

      if (isDev) {
        // In development, use the resources folder directly
        settingsPath = path.join(process.cwd(), 'resources', 'settings.json')
      } else {
        // In production, try multiple possible paths for macOS app bundles
        const possiblePaths = [
          path.join(process.resourcesPath, 'resources', 'settings.json'),
          path.join(process.resourcesPath, 'settings.json'),
          path.join(__dirname, '..', '..', 'resources', 'settings.json'),
          path.join(process.cwd(), 'resources', 'settings.json'),
          // Additional paths for macOS app bundle
          path.join(process.resourcesPath, 'app', 'resources', 'settings.json'),
          path.join(__dirname, '..', '..', '..', 'Resources', 'resources', 'settings.json')
        ]

        settingsPath = possiblePaths.find((p) => fs.existsSync(p)) || possiblePaths[0]
      }

      console.log('Loading settings from:', settingsPath)
      console.log('Settings file exists:', fs.existsSync(settingsPath))

      if (!fs.existsSync(settingsPath)) {
        console.error('Settings file not found, creating default file')

        // Create default settings content
        const defaultSettings: Settings = {
          secrets: {
            SERPAPI_KEY: ''
          }
        }

        try {
          // Try to create the directory if it doesn't exist
          const dir = path.dirname(settingsPath)
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
          }

          // Create the file with default content
          fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2), 'utf8')
          console.log('Created default settings file at:', settingsPath)
        } catch (createError) {
          console.error('Failed to create settings file:', createError)
        }

        return defaultSettings
      }

      const fileContent = fs.readFileSync(settingsPath, 'utf8')
      return JSON.parse(fileContent)
    } catch (error) {
      console.error('Error loading settings:', error)
      // Return default settings on error
      return {
        secrets: {
          SERPAPI_KEY: ''
        }
      }
    }
  },

  getSerpApiKey: (): string => {
    const settings = SettingsLoader.load()
    return settings.secrets.SERPAPI_KEY
  }
}
