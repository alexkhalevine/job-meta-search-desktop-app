import { isRelevantJob } from '@utils/filters'
import { JobScraperService, SearchConfig } from './services/jobScraperService'
import { Blacklist } from '@utils/bannedKeywords'
import { SettingsLoader } from '@utils/settingsLoader'

export function initRoutes(ipcMain): void {
  const jobScraperService = JobScraperService.getInstance()

  // IPC handlers for job scraping
  ipcMain.handle('search-jobs', async (_event, config: SearchConfig) => {
    try {
      const foundJobs = await jobScraperService.searchJobs(config)

      const allJobs = [...foundJobs]

      const relevantJobs = allJobs.filter((job) => isRelevantJob(job).checkPassed)
      const discardedJobs = allJobs
        .filter((job) => !isRelevantJob(job).checkPassed)
        .map((job) => {
          const filterResult = isRelevantJob(job)
          return {
            job,
            blockReason: filterResult.blockReason
          }
        })

      console.log(
        `Total jobs found: ${allJobs.length}, Relevant jobs: ${relevantJobs.length}, Discarded jobs: ${discardedJobs.length}`
      )

      console.log('discardedJobs', discardedJobs)

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
    const blacklist = Blacklist.load()
    return blacklist
  })

  ipcMain.handle('update-blacklist', async (_event, blacklistArray: string[]) => {
    const result = Blacklist.save(blacklistArray)
    return result
  })

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

  ipcMain.handle('settings-update-serp-key', async (_event, newKey: string) => {
    try {
      const result = await SettingsLoader.updateSerpApiKey(newKey)
      return {
        success: result
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })
}
