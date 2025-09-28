import axios from 'axios'
import * as cheerio from 'cheerio'
import { Crawler, ExtractResult, NormalizedItem, SearchConfig } from './types'

const BASE_URL = 'https://www.karriere.at/jobs'

type KarriereRawJob = {
  title: string
  url: string
  company: string
  location: string
  description: string
}

const karriereCrawler: Crawler = {
  name: 'karriere.at',

  async extract(config: SearchConfig): Promise<ExtractResult[]> {
    const query = `keywords=${config.searchQuery}&locations=${config.location}`
    const url = `${BASE_URL}?${query}`

    console.log('... extracting from karriere.at ', url)

    try {
      const { data: html } = await axios.get(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 10000
      })

      const $ = cheerio.load(html)
      const rawJobs: KarriereRawJob[] = []

      $('.m-jobsList__item').each((_, el) => {
        const linkEl = $(el).find('.m-jobsListItem__title > a')
        const title = linkEl.text().trim()

        if (title.length < 1) {
          return
        }

        const url = linkEl.attr('href') ?? ''
        const company = $(el).find('.m-jobsListItem__company > a').text().trim()

        const location = $(el)
          .find('.m-jobsListItem__locations a')
          .map((_, el) => $(el).text().trim())
          .get()
          .join(', ')

        const description = $(el)
          .find('.m-jobsListItem__pills span')
          .map((_, el) => $(el).text().trim())
          .get()
          .join(', ')

        rawJobs.push({
          title,
          url,
          company,
          location,
          description
        })
      })

      console.log(`Extracted ${rawJobs.length} raw jobs from karriere.at.`)
      return rawJobs
    } catch (error) {
      console.error('Error extracting from karriere.at:', error)
      throw new Error(`Failed to extract from karriere.at: ${error}`)
    }
  },

  normalize(raw: ExtractResult): NormalizedItem | null {
    const job = raw as KarriereRawJob

    if (!job?.title || !job?.url) {
      return null
    }

    // simple heuristic for remote
    const isRemote = /remote|home\s*office/i.test(job.description)

    return {
      id: `karriere:${job.url}`,
      title: job.title?.trim() || '(no title)',
      company: job.company?.trim() || '(no company)',
      location: job.location?.trim() || '(no location)',
      remote: isRemote,
      description: job.description?.trim() || '(no description)',
      url: job.url.startsWith('http') ? job.url : `https://www.karriere.at${job.url}`,
      source: 'karriere.at',
      scrapedAt: new Date().toISOString()
    }
  }
}

export default karriereCrawler
