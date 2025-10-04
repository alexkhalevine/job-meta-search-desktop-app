import type { IpcMain, IpcMainInvokeEvent } from 'electron'
import { isRelevantJob } from '@utils/filters'
import { JobScraperService, SearchConfig } from './services/jobScraperService'
import { Blacklist } from './services/blacklistService'
import { SettingsLoader } from '@utils/settingsLoader'

export function initRoutes(ipcMain: IpcMain): void {
  const jobScraperService = new JobScraperService()

  // IPC handlers for job scraping
  ipcMain.handle('search-jobs', async (event: IpcMainInvokeEvent, config: SearchConfig) => {
    try {
      // Input validation
      if (!config?.searchQuery?.trim()) {
        return { success: false, error: 'Search query is required' }
      }

      const foundJobs = await jobScraperService.searchJobs(config, event)

      const allJobs = [...foundJobs]

      // Process each job only once to avoid repeated function calls
      const jobResults = allJobs.map((job) => ({
        job,
        filterResult: isRelevantJob(job)
      }))

      const relevantJobs = jobResults
        .filter(({ filterResult }) => filterResult.checkPassed)
        .map(({ job }) => job)

      const discardedJobs = jobResults
        .filter(({ filterResult }) => !filterResult.checkPassed)
        .map(({ job, filterResult }) => ({
          job,
          blockReason: filterResult.blockReason
        }))

      console.log(
        `Total jobs found: ${allJobs.length}, Relevant jobs: ${relevantJobs.length}, Discarded jobs: ${discardedJobs.length}`
      )

      // Emit final summary message
      if (event) {
        const summaryMessage = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          message: `Total jobs found: ${allJobs.length}, Relevant jobs: ${relevantJobs.length}, Discarded jobs: ${discardedJobs.length}`,
          timestamp: Date.now(),
          type: 'success' as const,
          source: 'Summary'
        }
        event.sender.send('crawler-progress', summaryMessage)
      }

      return {
        success: true,
        data: relevantJobs,
        meta: { discardedList: discardedJobs }
      }
    } catch (error) {
      console.error('Error in search-jobs handler:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  ipcMain.handle('load-blacklist', async () => {
    try {
      const blacklist = Blacklist.load()
      return blacklist
    } catch (error) {
      console.error('Error loading blacklist:', error)
      return []
    }
  })

  ipcMain.handle(
    'update-blacklist',
    async (_event: IpcMainInvokeEvent, blacklistArray: string[]) => {
      try {
        // Input validation
        if (!Array.isArray(blacklistArray)) {
          return { success: false, error: 'Blacklist must be an array' }
        }

        const result = Blacklist.save(blacklistArray)
        return result
      } catch (error) {
        console.error('Error updating blacklist:', error)
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  )

  ipcMain.handle('get-settings', async () => {
    try {
      const result = await SettingsLoader.getSafeSettingsForUI()
      return {
        success: true,
        data: result
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  ipcMain.handle('settings-update-serp-key', async (_event: IpcMainInvokeEvent, newKey: string) => {
    try {
      // Input validation
      if (typeof newKey !== 'string') {
        return { success: false, error: 'API key must be a string' }
      }

      const result = SettingsLoader.updateSerpApiKey(newKey)
      return {
        success: result
      }
    } catch (error) {
      console.error('Error updating SERP API key:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  ipcMain.handle(
    'settings-update-enable-advanced-crawling',
    async (_event: IpcMainInvokeEvent, newValue: boolean) => {
      try {
        // Input validation
        if (typeof newValue !== 'boolean') {
          return { success: false, error: 'Advanced crawling setting must be a boolean' }
        }

        const result = SettingsLoader.updateEnableAdvancedCrawling(newValue)
        return {
          success: result
        }
      } catch (error) {
        console.error('Error updating advanced crawling setting:', error)
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  )
}
