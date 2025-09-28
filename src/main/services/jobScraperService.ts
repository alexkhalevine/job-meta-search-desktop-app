import { scrapeKarriere } from './scappers/karriereScrapper'
import { scrapStepstone } from './scappers/stepStoneScrapper'
import { scrapWillhaben } from './scappers/willhabbenScrapper'
import { serpScrapper } from './scappers/serpScrapper'
import { scrapeJobsAt } from './scappers/jobsAtScrapper'
import { scrapeWienJobs } from './scappers/wienJobsCrawler'
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

    // Prepare scraper promises array
    const scraperPromises = [
      scrapeKarriere(config),
      scrapStepstone(config),
      scrapWillhaben(config),
      scrapeJobsAt(config),
      serpScrapper(config)
    ]

    // Add Wien jobs crawler if advanced crawling is enabled
    if (isAdvancedCrawlingEnabled) {
      console.log('🕷️ Adding Wien jobs crawler to the scraping queue')
      scraperPromises.push(scrapeWienJobs(config))
    }

    // Run all scrapers in parallel and handle failures gracefully
    const scraperResults = await Promise.allSettled(scraperPromises)

    // Destructure results based on whether Wien crawler was included
    const [karriereJobs, stepstoneJobs, willhabenJobs, jobsAtJobs, googleJobs, wienJobs] =
      scraperResults

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

    // Handle Wien jobs results (only if advanced crawling is enabled)
    if (isAdvancedCrawlingEnabled && wienJobs) {
      if (wienJobs.status === 'fulfilled') {
        allJobs.push(...wienJobs.value)
        console.log(`✅ Wien jobs crawler returned ${wienJobs.value.length} jobs`)
      } else {
        console.error('Wien jobs crawler failed:', wienJobs.reason)
      }
    }

    /*   for (const job of relevantJobs) {
    const summary = await analyzeJob(`Job title: ${job.title}, job dscription: ${job.description}`);
    console.log(`🔍 ${job.title} @ ${job.company} (${job.location})`);
    console.log('\n');
    console.log("AI summary:");
    console.log(summary);
    console.log('➡️', job.url);
    console.log('\n---\n');
  } */

    return allJobs
  }
}
