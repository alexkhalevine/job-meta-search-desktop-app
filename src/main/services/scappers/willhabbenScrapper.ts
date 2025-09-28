import axios from 'axios'
import * as cheerio from 'cheerio'
import { Crawler, ExtractResult, NormalizedItem, SearchConfig } from './types'

const BASE_URL = 'https://www.willhaben.at'

type WillhabbenRawJob = {
  title: string
  company: string
  details: string
  location: string
  url: string
}

const willhabbenCrawler: Crawler = {
  name: 'willhaben.at',

  async extract(config: SearchConfig): Promise<ExtractResult[]> {
    const url = `${BASE_URL}/jobs/suche?keyword=${config.searchQuery}&location=${config.location}`

    console.log('... extracting from willhaben.at ', url)

    try {
      const { data: html } = await axios.get(url)

      const $ = cheerio.load(html)
      const rawJobs: WillhabbenRawJob[] = []

      // Select job items within the results list - use data-testid pattern for job rows
      $('#skip-to-resultlist div[data-testid^="jobsresultlist-row-"]').each((_, el) => {
        // Extract title from the data-testid attribute that contains "title"
        const title = $(el).find('span[data-testid*="title"]').text().trim()

        if (!title) {
          return
        }

        // Extract company name from the data-testid attribute that contains "company-name"
        const company = $(el)
          .find('span[data-testid*="company-name"]')
          .text()
          .trim()
          .replace(' Jobs', '') // Remove " Jobs" suffix from company name

        // Extract job details (date, employment type, location) from the details field
        const details = $(el).find('span[data-testid*="details"]').text().trim()

        // Parse location from details (after the last comma)
        const detailsParts = details.split(',').map((part) => part.trim())
        const location =
          detailsParts.length > 1 ? detailsParts.slice(1).join(', ') : config.location

        // Extract job URL from the href attribute
        const jobHref = $(el).find('a[href*="/jobs/job/"]').first().attr('href')
        const url = jobHref ? BASE_URL + jobHref : ''

        if (url) {
          rawJobs.push({
            title,
            company,
            details,
            location,
            url
          })
        }
      })

      console.log(`Extracted ${rawJobs.length} raw jobs from willhaben.at.`)
      return rawJobs
    } catch (error) {
      console.error('Error extracting from willhaben.at:', error)
      throw new Error(`Failed to extract from willhaben.at: ${error}`)
    }
  },

  normalize(raw: ExtractResult): NormalizedItem | null {
    const job = raw as WillhabbenRawJob

    if (!job?.title || !job?.url) {
      return null
    }

    // Check for remote work indicators in the details or location
    const isRemote = /remote|home\s*office|homeoffice/i.test(job.details + ' ' + job.location)

    // Use the job title as description since willhaben doesn't provide descriptions in listings
    const description = `${job.title}. Details: ${job.details}`

    return {
      id: `willhaben:${job.url}`,
      title: job.title?.trim() || '(no title)',
      company: job.company?.trim() || '(no company)',
      location: job.location?.trim() || '(no location)',
      remote: isRemote,
      description: description?.trim() || '(no description)',
      url: job.url,
      source: 'willhaben.at',
      scrapedAt: new Date().toISOString()
    }
  }
}

export default willhabbenCrawler
