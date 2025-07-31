import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { JobPost, SearchConfig } from 'src/main/services/jobScraperService'

// Custom APIs for renderer
const api = {}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,

  // Job search functionality
  searchJobs: async (
    config: SearchConfig
  ): Promise<{
    success: boolean
    data?: JobPost[]
    error?: string
    meta: { discardedCount: number; discardedList: Array<string> }
  }> => {
    return await ipcRenderer.invoke('search-jobs', config)
  },

  loadBlacklist: async (): Promise<string[]> => {
    return await ipcRenderer.invoke('load-blacklist')
  },

  updateBlacklist: async (
    blacklistArray: string[]
  ): Promise<{ success: boolean; message: string; error?: string }> => {
    return await ipcRenderer.invoke('update-blacklist', blacklistArray)
  },
  loadSettings: async (): Promise<{ success: boolean; message: string; error?: string }> => {
    return await ipcRenderer.invoke('get-settings')
  },
  updateSerpApiKey: async (newKey: string): Promise<{ success: boolean; error?: string }> => {
    return await ipcRenderer.invoke('settings-update-serp-key', newKey)
  }
})
