import * as fs from 'fs'
import * as path from 'path'

interface Settings {
  secrets: {
    SERPAPI_KEY: string
  }
  serpQuota?: number
}

interface SerpResponse {
  account_id: string
  api_key: string
  account_email: string
  plan_id: string
  plan_name: string
  plan_monthly_price: number
  searches_per_month: number
  plan_searches_left: number
  extra_credits: number
  total_searches_left: number
  this_month_usage: number
  last_hour_searches: number
  account_rate_limit_per_hour: number
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

  getSafeSettingsForUI: async (): Promise<Settings> => {
    const settings = SettingsLoader.load()

    // Mask the API key - show only first 4 characters, rest as asterisks
    const apiKey = settings.secrets.SERPAPI_KEY
    const maskedApiKey =
      apiKey.length > 4 ? apiKey.substring(0, 4) + '*'.repeat(apiKey.length - 4) : apiKey

    let serpQuota = 0
    try {
      serpQuota = await SettingsLoader.getSerpQuota(apiKey)
    } catch (error) {
      console.warn('Failed to fetch SERP quota:', error)
      serpQuota = 0
    }

    return {
      secrets: {
        SERPAPI_KEY: maskedApiKey
      },
      serpQuota
    }
  },

  getSerpQuota: async (apiKey: string): Promise<number> => {
    if (!apiKey || apiKey.trim() === '') {
      return 0
    }

    try {
      const response = await fetch(`https://serpapi.com/account?api_key=${apiKey}`)

      if (!response.ok) {
        console.warn(`SERP API responded with status: ${response.status}`)
        return 0
      }

      const responseJSON = (await response.json()) as SerpResponse

      // Ensure we return a valid number
      return typeof responseJSON.total_searches_left === 'number'
        ? responseJSON.total_searches_left
        : 0
    } catch (error) {
      console.warn('Error fetching SERP quota:', error)
      return 0
    }
  },

  getSerpApiKey: (): string => {
    const settings = SettingsLoader.load()
    return settings.secrets.SERPAPI_KEY
  }
}
