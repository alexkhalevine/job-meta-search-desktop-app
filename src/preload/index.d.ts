import { ElectronAPI } from '@electron-toolkit/preload'

interface CustomElectronAPI {
  platform: string
  searchJobs: (config: SearchConfig) => Promise<{
    success: boolean
    data?: JobPost[]
    error?: string
    meta: { discardedCount: number }
  }>
  getJobSources: () => Promise<string[]>
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
