import axios from 'axios'
import { JobPost, SearchConfig } from './jobScraperService'
import { SettingsLoader } from '@utils/settingsLoader'

const SERPAPI_URL = 'https://serpapi.com/search.json'

export async function serpScrapper(config: SearchConfig): Promise<JobPost[]> {
  const SERPAPI_KEY = SettingsLoader.getSerpApiKey()

  if (!SERPAPI_KEY) {
    console.error('SERPAPI_KEY not found in settings.json')
    return []
  }

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

  console.log('google jobs: ', results)

  const jobs: JobPost[] = results.map(
    (job: any): JobPost => ({
      title: job.title || '',
      company: job.company || '',
      location: job.location || '',
      remote: /remote|home\s*office/i.test((job.location ?? '') + (job.description ?? '')),
      description:
        job.description +
        ' More info: ' +
        Object.entries(job.detected_extensions)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', '),
      url: job.apply_options.map((opt: any) => `${opt.title}: ${opt.link}`),
      source: 'google jobs'
    })
  )

  return jobs
}
