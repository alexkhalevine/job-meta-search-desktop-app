import { ElectronAPI } from '@electron-toolkit/preload'
import { Settings } from 'electron'

interface CustomElectronAPI {
  platform: string
  searchJobs: (config: SearchConfig) => Promise<{
    success: boolean
    data?: JobPost[]
    error?: string
    meta: { discardedList: Array<JobPost> }
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
    data?: Settings
    error?: string
  }>
  updateSerpApiKey: (newKey: string) => Promise<boolean>
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
