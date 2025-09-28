import karriereCrawler from './scappers/karriereScrapper'
import stepstoneCrawler from './scappers/stepStoneScrapper'
import willhabbenCrawler from './scappers/willhabbenScrapper'
import serpCrawler from './scappers/serpScrapper'
import jobsAtCrawler from './scappers/jobsAtScrapper'
import wienJobsCrawler from './scappers/wienJobsCrawler'
import derStandardCrawler from './scappers/derStandardScrapper'
import { store } from './scappers/store'
import { NormalizedItem } from './scappers/types'
import { SettingsLoader } from '../../utils/settingsLoader'
import type { IpcMainInvokeEvent } from 'electron'

export interface JobPost {
  title: string
  company: string
  location: string
  remote: boolean
  description: string
  url: string
  source: string
  links?: Array<{ title: string; link: string }>
}

export interface SearchConfig {
  searchQuery: string
  location: string
}

export interface SearchResult {
  jobs: JobPost[]
  totalCount: number
  source: string
  timestamp: Date
}
export class JobScraperService {
  private static instance: JobScraperService

  public static getInstance(): JobScraperService {
    if (!JobScraperService.instance) {
      JobScraperService.instance = new JobScraperService()
    }
    return JobScraperService.instance
  }

  private emitProgress(
    event: IpcMainInvokeEvent | undefined,
    message: string,
    type: 'info' | 'success' | 'error' = 'info',
    source?: string
  ): void {
    if (!event) return

    const progressMessage = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      message,
      timestamp: Date.now(),
      type,
      source
    }

    event.sender.send('crawler-progress', progressMessage)
  }

  public async searchJobs(config: SearchConfig, event?: IpcMainInvokeEvent): Promise<JobPost[]> {
    // Check if advanced crawling is enabled
    const settings = SettingsLoader.load()
    const isAdvancedCrawlingEnabled = settings.enableAdvancedCrawling

    console.log('🔧 Advanced crawling enabled:', isAdvancedCrawlingEnabled)
    this.emitProgress(
      event,
      `Starting job search for "${config.searchQuery}" in ${config.location}`,
      'info'
    )

    // Create crawler functions that accept config and use ETL pattern
    const crawlerFunctions = [
      (): Promise<NormalizedItem[]> => this.runCrawler(karriereCrawler, config, event),
      (): Promise<NormalizedItem[]> => this.runCrawler(stepstoneCrawler, config, event),
      (): Promise<NormalizedItem[]> => this.runCrawler(willhabbenCrawler, config, event),
      (): Promise<NormalizedItem[]> => this.runCrawler(jobsAtCrawler, config, event),
      (): Promise<NormalizedItem[]> => this.runCrawler(serpCrawler, config, event),
      (): Promise<NormalizedItem[]> => this.runCrawler(derStandardCrawler, config, event)
    ]

    // Add Wien jobs crawler if advanced crawling is enabled
    if (isAdvancedCrawlingEnabled) {
      console.log('🕷️ Adding Wien jobs crawler to the scraping queue')
      this.emitProgress(event, 'Advanced crawling enabled - including Wien municipal jobs', 'info')
      crawlerFunctions.push(
        (): Promise<NormalizedItem[]> => this.runCrawler(wienJobsCrawler, config, event)
      )
    }

    // Run all crawlers in parallel and handle failures gracefully
    const crawlerResults = await Promise.allSettled(crawlerFunctions.map((fn) => fn()))

    const allNormalizedJobs: NormalizedItem[] = []

    // Process results and collect normalized jobs
    crawlerResults.forEach((result, index) => {
      const crawlerNames = [
        'karriere.at',
        'stepstone.at',
        'willhaben.at',
        'jobs.at',
        'google_jobs_via_serpapi',
        'jobs.derstandard.at'
      ]
      if (isAdvancedCrawlingEnabled && index === crawlerNames.length) {
        crawlerNames.push('jobs.wien.gv.at')
      }

      const crawlerName = crawlerNames[index] || `crawler-${index}`

      if (result.status === 'fulfilled') {
        allNormalizedJobs.push(...result.value)
        console.log(`✅ ${crawlerName} returned ${result.value.length} jobs`)
        this.emitProgress(
          event,
          `${crawlerName} completed. Found ${result.value.length} jobs.`,
          'success',
          crawlerName
        )
      } else {
        console.error(`❌ ${crawlerName} failed:`, result.reason)
        this.emitProgress(event, `${crawlerName} failed: ${result.reason}`, 'error', crawlerName)
      }
    })

    // Store normalized jobs in the ETL store
    store.upsertMany(allNormalizedJobs)

    console.log(`🎯 Total jobs collected: ${allNormalizedJobs.length}`)
    this.emitProgress(
      event,
      `Returning ${allNormalizedJobs.length} unique jobs after deduplication`,
      'success'
    )
    return allNormalizedJobs
  }

  private async runCrawler(
    crawler: typeof karriereCrawler,
    config: SearchConfig,
    event?: IpcMainInvokeEvent
  ): Promise<NormalizedItem[]> {
    try {
      this.emitProgress(event, `Starting ${crawler.name} crawler...`, 'info', crawler.name)
      const rawResults = await crawler.extract(config)
      const normalizedResults = rawResults
        .map((raw) => crawler.normalize(raw))
        .filter((job): job is NormalizedItem => job !== null)

      return normalizedResults
    } catch (error) {
      console.error(`Error running ${crawler.name}:`, error)
      throw error
    }
  }
}
