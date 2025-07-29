import axios from 'axios'
import { JobPost, SearchConfig } from './jobScraperService'
import { SettingsLoader } from '@utils/settingsLoader'

const SERPAPI_URL = 'https://serpapi.com/search.json'

type GoogleJobsType = {
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
}

export async function serpScrapper(config: SearchConfig): Promise<JobPost[]> {
  const SERPAPI_KEY = SettingsLoader.getSerpApiKey()

  if (!SERPAPI_KEY) {
    console.error('SERPAPI_KEY not found in settings.json')
    return []
  }

  try {
    const response = await axios.get(SERPAPI_URL, {
      params: {
        engine: 'google_jobs',
        q: config.searchQuery,
        location: config.location,
        api_key: SERPAPI_KEY
      }
    })

    const results = response.data.jobs_results
    if (!Array.isArray(results)) return []

    const jobs: JobPost[] = results.map(
      (job: GoogleJobsType): JobPost => ({
        title: job.title || '',
        company: job.company_name || '',
        location: job.location || '',
        remote: /remote|home\s*office/i.test((job.location ?? '') + (job.description ?? '')),
        description:
          job.description +
          ' More info: ' +
          Object.entries(job.detected_extensions)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', '),
        url: job.share_link,
        source: `google jobs - ${job.via}`
      })
    )
    return jobs
  } catch (err) {
    console.error('Error scraping google jobs:', err)
    throw new Error(`Failed to scrape google jobs: ${err}`)
  }
}
