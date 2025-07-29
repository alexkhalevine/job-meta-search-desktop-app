import { scrapeKarriere } from './scappers/karriereScrapper'
import { scrapStepstone } from './scappers/stepStoneScrapper'
import { scrapWillhaben } from './scappers/willhabbenScrapper'
import { serpScrapper } from './scappers/serpScrapper'
import { scrapeJobsAt } from './scappers/jobsAtScrapper'

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
    // Run all scrapers in parallel and handle failures gracefully
    const [karriereJobs, stepstoneJobs, willhabenJobs, jobsAtJobs, googleJobs] =
      await Promise.allSettled([
        scrapeKarriere(config),
        scrapStepstone(config),
        scrapWillhaben(config),
        scrapeJobsAt(config),
        serpScrapper(config)
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

    // Handle willhaben.at results
    if (willhabenJobs.status === 'fulfilled') {
      allJobs.push(...willhabenJobs.value)
    } else {
      console.error('Willhaben.at scraping failed:', willhabenJobs.reason)
    }

    // Handle jobs.at results
    if (jobsAtJobs.status === 'fulfilled') {
      allJobs.push(...jobsAtJobs.value)
    } else {
      console.error('Jobs.at scraping failed:', jobsAtJobs.reason)
    }

    // Handle google jobs results
    if (googleJobs.status === 'fulfilled') {
      allJobs.push(...googleJobs.value)
    } else {
      console.error('Google job scraping failed:', googleJobs.reason)
    }

    return allJobs
  }
}
