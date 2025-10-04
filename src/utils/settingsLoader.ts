import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'
dotenv.config()

interface Settings {
  secrets: {
    SERPAPI_KEY: string
  }
  enableAdvancedCrawling: boolean
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

const isDev = process.env.NODE_ENV === 'development'

const DEFAULT_SETTINGS: Settings = {
  secrets: {
    SERPAPI_KEY: ''
  },
  enableAdvancedCrawling: false
}

function getSettingsPath(): string {
  if (isDev) {
    return path.join(process.cwd(), 'resources', 'settings.json')
  }

  const possiblePaths = [
    path.join(process.resourcesPath, 'resources', 'settings.json'),
    path.join(process.resourcesPath, 'settings.json'),
    path.join(__dirname, '..', '..', 'resources', 'settings.json'),
    path.join(process.cwd(), 'resources', 'settings.json'),
    path.join(process.resourcesPath, 'app', 'resources', 'settings.json'),
    path.join(__dirname, '..', '..', '..', 'Resources', 'resources', 'settings.json')
  ]

  return possiblePaths.find((p) => fs.existsSync(p)) || possiblePaths[0]
}

function ensureSettingsFile(settingsPath: string): void {
  if (fs.existsSync(settingsPath)) return

  console.error('Settings file not found, creating default file')

  const dir = path.dirname(settingsPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  fs.writeFileSync(settingsPath, JSON.stringify(DEFAULT_SETTINGS, null, 2), 'utf8')
  console.log('Created default settings file at:', settingsPath)
}

function loadSettings(settingsPath: string): Settings {
  if (!fs.existsSync(settingsPath)) {
    return DEFAULT_SETTINGS
  }

  const fileContent = fs.readFileSync(settingsPath, 'utf8')
  return JSON.parse(fileContent)
}

function updateSetting(updater: (settings: Settings) => void): boolean {
  try {
    const settingsPath = getSettingsPath()
    ensureSettingsFile(settingsPath)

    const currentSettings = loadSettings(settingsPath)
    updater(currentSettings)

    fs.writeFileSync(settingsPath, JSON.stringify(currentSettings, null, 2), 'utf8')
    return true
  } catch (error) {
    console.error('Error updating settings:', error)
    return false
  }
}

export const SettingsLoader = {
  load: (): Settings => {
    try {
      const settingsPath = getSettingsPath()
      console.log('Loading settings from:', settingsPath)
      console.log('Settings file exists:', fs.existsSync(settingsPath))

      ensureSettingsFile(settingsPath)
      return loadSettings(settingsPath)
    } catch (error) {
      console.error('Error loading settings:', error)
      return DEFAULT_SETTINGS
    }
  },

  getSafeSettingsForUI: async (): Promise<Settings> => {
    // Mask the API key - show only first 4 characters, rest as asterisks
    const apiKey = SettingsLoader.getSerpApiKey()
    const settings = SettingsLoader.load()
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
      serpQuota,
      enableAdvancedCrawling: settings.enableAdvancedCrawling
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

    if (isDev) {
      // in dev, we can key beeing set in process.env.SERPAPI_KEY
      // so that we do not have to commit settings.json
      return settings.secrets.SERPAPI_KEY
        ? settings.secrets.SERPAPI_KEY
        : process.env.SERPAPI_KEY || ''
    }

    return settings.secrets.SERPAPI_KEY
  },

  updateSerpApiKey: (newApiKey: string): boolean => {
    const success = updateSetting((settings) => {
      settings.secrets.SERPAPI_KEY = newApiKey
    })
    if (success) console.log('Successfully updated SERPAPI_KEY in settings.json')
    return success
  },

  updateEnableAdvancedCrawling: (newValue: boolean): boolean => {
    const success = updateSetting((settings) => {
      settings.enableAdvancedCrawling = newValue
    })
    if (success) console.log('Successfully updated enableAdvancedCrawling in settings.json')
    return success
  }
}
