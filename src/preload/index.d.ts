import { ElectronAPI } from '@electron-toolkit/preload'

interface CustomElectronAPI {
  platform: string
  searchJobs: (config: SearchConfig) => Promise<{
    success: boolean
    data?: JobPost[]
    error?: string
    meta: {
      discardedList: Array<{
        job: JobPost
        blockReason: {
          locationCheckPassed: boolean
          wordCheckPassed: boolean
        }
      }>
    }
  }>
  getJobSources: () => Promise<string[]>
  loadBlacklist: () => Promise<string[]>
  updateBlacklist: (blacklistArray: string[]) => Promise<{
    success: boolean
    message: string
    error?: string
  }>
  loadSettings: () => Promise<{
    success: boolean
    data?: {
      serpApiKey: string
      enableAdvancedCrawling: boolean
    }
    error?: string
  }>
  updateSerpApiKey: (newKey: string) => Promise<boolean>
  updateSettingsAdvancedCrawling: (enabled: boolean) => Promise<boolean>
  onProgressMessage: (callback: (event: Electron.IpcRendererEvent, data: unknown) => void) => void
  removeProgressListener: (callback: (event: Electron.IpcRendererEvent, data: unknown) => void) => void
}

interface SearchConfig {
  searchQuery: string
  location: string
}

interface JobPost {
  title: string
  company: string
  location: string
  remote: boolean
  description: string
  url: string
  source: string
}

declare global {
  interface Window {
    electron: ElectronAPI
    electronAPI: CustomElectronAPI
    api: unknown
  }
}
