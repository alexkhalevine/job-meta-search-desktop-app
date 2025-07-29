import { scrapeKarriere } from './karriereScrapper'
import { scrapStepstone } from './stepStoneScrapper'

export interface JobPost {
  title: string
  company: string
  location: string
  remote: boolean
  description: string
  url: string
  source: string
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
    // Run both scrapers in parallel and handle failures gracefully
    const [karriereJobs, stepstoneJobs] = await Promise.allSettled([
      scrapeKarriere(config),
      scrapStepstone(config)
    ])

    const allJobs: JobPost[] = []

    // Handle karriere.at results
    if (karriereJobs.status === 'fulfilled') {
      allJobs.push(...karriereJobs.value)
    } else {
      console.error('Karriere.at scraping failed:', karriereJobs.reason)
    }

    // Handle stepstone.at results
    if (stepstoneJobs.status === 'fulfilled') {
      allJobs.push(...stepstoneJobs.value)
    } else {
      console.error('Stepstone.at scraping failed:', stepstoneJobs.reason)
    }

    return allJobs
  }
}
