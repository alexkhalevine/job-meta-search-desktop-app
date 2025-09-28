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

  public async searchJobs(config: SearchConfig): Promise<JobPost[]> {
    // Check if advanced crawling is enabled
    const settings = SettingsLoader.load()
    const isAdvancedCrawlingEnabled = settings.enableAdvancedCrawling

    console.log('🔧 Advanced crawling enabled:', isAdvancedCrawlingEnabled)

    // Create crawler functions that accept config and use ETL pattern
    const crawlerFunctions = [
      (): Promise<NormalizedItem[]> => this.runCrawler(karriereCrawler, config),
      (): Promise<NormalizedItem[]> => this.runCrawler(stepstoneCrawler, config),
      (): Promise<NormalizedItem[]> => this.runCrawler(willhabbenCrawler, config),
      (): Promise<NormalizedItem[]> => this.runCrawler(jobsAtCrawler, config),
      (): Promise<NormalizedItem[]> => this.runCrawler(serpCrawler, config),
      (): Promise<NormalizedItem[]> => this.runCrawler(derStandardCrawler, config)
    ]

    // Add Wien jobs crawler if advanced crawling is enabled
    if (isAdvancedCrawlingEnabled) {
      console.log('🕷️ Adding Wien jobs crawler to the scraping queue')
      crawlerFunctions.push(
        (): Promise<NormalizedItem[]> => this.runCrawler(wienJobsCrawler, config)
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
      } else {
        console.error(`❌ ${crawlerName} failed:`, result.reason)
      }
    })

    // Store normalized jobs in the ETL store
    store.upsertMany(allNormalizedJobs)

    console.log(`🎯 Total jobs collected: ${allNormalizedJobs.length}`)
    return allNormalizedJobs
  }

  private async runCrawler(
    crawler: typeof karriereCrawler,
    config: SearchConfig
  ): Promise<NormalizedItem[]> {
    try {
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
