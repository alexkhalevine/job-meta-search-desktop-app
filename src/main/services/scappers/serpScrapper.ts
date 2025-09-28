import axios from 'axios'
import { SettingsLoader } from '@utils/settingsLoader'
import { Crawler, ExtractResult, NormalizedItem, SearchConfig } from './types'

const SERPAPI_URL = 'https://serpapi.com/search.json'

type GoogleJobsRawJob = {
  title: string
  company_name: string
  location: string
  via: string
  share_link: string
  thumbnail: string
  extensions: string[]
  detected_extensions: {
    posted_at: string
    schedule_type: string
  }
  description: string
  job_id: string
  apply_options: Array<{
    title: string
    link: string
  }>
}

const serpCrawler: Crawler = {
  name: 'google_jobs_via_serpapi',

  async extract(config: SearchConfig): Promise<ExtractResult[]> {
    const SERPAPI_KEY = SettingsLoader.getSerpApiKey()

    if (!SERPAPI_KEY) {
      console.error('SERPAPI_KEY not found in settings.json')
      return []
    }

    console.log('... extracting from Google Jobs via SerpAPI')

    try {
      const response = await axios.get(SERPAPI_URL, {
        params: {
          engine: 'google_jobs',
          q: config.searchQuery,
          location: config.location,
          api_key: SERPAPI_KEY,
          gl: 'at'
        }
      })

      const results = response.data.jobs_results

      if (!Array.isArray(results)) {
        console.log('No job results found from SerpAPI')
        return []
      }

      console.log(`Extracted ${results.length} raw jobs from Google Jobs via SerpAPI.`)
      return results
    } catch (error) {
      console.error('Error extracting from Google Jobs via SerpAPI:', error)
      throw new Error(`Failed to extract from Google Jobs via SerpAPI: ${error}`)
    }
  },

  normalize(raw: ExtractResult): NormalizedItem | null {
    const job = raw as GoogleJobsRawJob

    if (!job?.title || !job?.share_link) {
      return null
    }

    // Check for remote work indicators
    const isRemote = /remote|home\s*office/i.test((job.location ?? '') + (job.description ?? ''))

    // Build description with additional info
    const description =
      job.description +
      ' More info: ' +
      Object.entries(job.detected_extensions || {})
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ')

    return {
      id: `serpapi:${job.job_id || job.share_link}`,
      title: job.title?.trim() || '(no title)',
      company: job.company_name?.trim() || '(no company)',
      location: job.location?.trim() || '(no location)',
      remote: isRemote,
      description: description?.trim() || '(no description)',
      url: job.share_link,
      source: `google jobs - ${job.via}`,
      links: job.apply_options,
      scrapedAt: new Date().toISOString()
    }
  }
}

export default serpCrawler
