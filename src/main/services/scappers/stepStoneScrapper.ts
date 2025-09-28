import axios from 'axios'
import * as cheerio from 'cheerio'
import { Crawler, ExtractResult, NormalizedItem, SearchConfig } from './types'

const BASE_URL = 'https://www.stepstone.at'

type StepstoneRawJob = {
  title: string
  company: string
  location: string
  url: string
  description: string
  isRemoteText: string
}

const stepstoneCrawler: Crawler = {
  name: 'stepstone.at',

  async extract(config: SearchConfig): Promise<ExtractResult[]> {
    const url = `${BASE_URL}/jobs/${config.searchQuery}/in-${config.location}`

    console.log('... extracting from stepstone.at ', url)

    try {
      const { data: html } = await axios.get(url)

      const $ = cheerio.load(html)
      const rawJobs: StepstoneRawJob[] = []

      $('article[role="button"]').each((_, el) => {
        const title = $(el).find('a[data-testid="job-item-title"] > div > div > div').text().trim()

        const company = $(el)
          .find('[data-at="job-item-company-name"] > span > [data-genesis-element="TEXT"]')
          .text()
          .trim()

        const location = $(el)
          .find('[data-at="job-item-location"] > [data-genesis-element="TEXT"]')
          .text()
          .trim()

        const url = BASE_URL + '/' + $(el).find('a[data-testid="job-item-title"]').attr('href')

        const isRemoteText = $(el)
          .find('[data-at="job-item-work-from-home"] > [data-genesis-element="TEXT"]')
          .text()
          .trim()

        const description = $(el).find('[data-at="jobcard-content"] span').text().trim()

        if (title && url) {
          rawJobs.push({
            title,
            company,
            location,
            url,
            description,
            isRemoteText
          })
        }
      })

      console.log(`Extracted ${rawJobs.length} raw jobs from stepstone.at.`)
      return rawJobs
    } catch (error) {
      console.error('Error extracting from stepstone.at:', error)
      throw new Error(`Failed to extract from stepstone.at: ${error}`)
    }
  },

  normalize(raw: ExtractResult): NormalizedItem | null {
    const job = raw as StepstoneRawJob

    if (!job?.title || !job?.url) {
      return null
    }

    // Implement remote detection based on isRemoteText or description
    const isRemote =
      job.isRemoteText.toLowerCase().includes('home') ||
      job.description.toLowerCase().includes('remote') ||
      job.description.toLowerCase().includes('home office')

    const fullDescription = [
      job.description,
      job.isRemoteText && `Work from home: ${job.isRemoteText}`
    ]
      .filter(Boolean)
      .join('. ')

    return {
      id: `stepstone:${job.url}`,
      title: job.title?.trim() || '(no title)',
      company: job.company?.trim() || '(no company)',
      location: job.location?.trim() || '(no location)',
      remote: isRemote,
      description: fullDescription || '(no description)',
      url: job.url,
      source: 'stepstone.at',
      scrapedAt: new Date().toISOString()
    }
  }
}

export default stepstoneCrawler
