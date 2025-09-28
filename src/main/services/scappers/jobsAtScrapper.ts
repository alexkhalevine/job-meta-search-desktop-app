import axios from 'axios'
import * as cheerio from 'cheerio'
import { Crawler, ExtractResult, NormalizedItem, SearchConfig } from './types'

const BASE_URL = 'https://www.jobs.at'

type JobsAtRawJob = {
  title: string
  url: string
  company: string
  locations: string[]
  pillTexts: string[]
}

const jobsAtCrawler: Crawler = {
  name: 'jobs.at',

  async extract(config: SearchConfig): Promise<ExtractResult[]> {
    const searchParams = new URLSearchParams({
      q: config.searchQuery,
      l: config.location
    })
    const url = `${BASE_URL}/j/?${searchParams.toString()}`

    console.log('... extracting from jobs.at ', url)

    try {
      const { data: html } = await axios.get(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        timeout: 10000
      })

      const $ = cheerio.load(html)
      const rawJobs: JobsAtRawJob[] = []

      // Target the job listing items based on the provided DOM structure
      $('.c-search-listing .c-search-listing-item').each((_, element) => {
        try {
          const $el = $(element)

          // Skip promotional items and job alarm forms
          if ($el.hasClass('c-promotion') || $el.hasClass('c-search-listing-item--jobalarm')) {
            return
          }

          // Extract job title and URL
          const titleLink = $el.find('.c-job-title a.j-c-link')
          const title = titleLink.text().trim()

          if (!title) {
            return // Skip if no title found
          }

          const jobUrl = titleLink.attr('href') || ''
          const url = jobUrl.startsWith('http') ? jobUrl : `${BASE_URL}${jobUrl}`

          // Extract company name
          const company =
            $el.find('a[data-job-company]').text().trim() ||
            $el.find('a[data-gtm-element-detail]').text().trim() ||
            'Company not specified'

          // Extract location
          const locationElements = $el.find('ul[data-job-location] li a')
          const locations: string[] = []
          locationElements.each((_, locEl) => {
            const loc = $(locEl).text().trim()
            if (loc) locations.push(loc)
          })

          // Extract job details/pills for description
          const pillTexts: string[] = []
          $el.find('.j-c-pill-text').each((_, pillEl) => {
            const pillText = $(pillEl).text().trim()
            if (pillText) pillTexts.push(pillText)
          })

          rawJobs.push({
            title,
            url,
            company,
            locations,
            pillTexts
          })
        } catch (error) {
          console.warn('Error parsing job item from jobs.at:', error)
          // Continue with next job item
        }
      })

      console.log(`Extracted ${rawJobs.length} raw jobs from jobs.at.`)
      return rawJobs
    } catch (error) {
      console.error('Error extracting from jobs.at:', error)
      throw new Error(`Failed to extract from jobs.at: ${error}`)
    }
  },

  normalize(raw: ExtractResult): NormalizedItem | null {
    const job = raw as JobsAtRawJob

    if (!job?.title || !job?.url) {
      return null
    }

    const location = job.locations.join(', ') || '(no location)'
    const description = job.pillTexts.join(', ') || job.title

    // Check for remote work indicators
    const isRemote =
      /remote|homeoffice|home\s*office|fernarbeit/i.test(description) ||
      /remote|homeoffice|home\s*office|fernarbeit/i.test(job.title)

    return {
      id: `jobs.at:${job.url}`,
      title: job.title?.trim() || '(no title)',
      company: job.company?.trim() || '(no company)',
      location: location?.trim() || '(no location)',
      remote: isRemote,
      description: description?.trim() || '(no description)',
      url: job.url,
      source: 'jobs.at',
      scrapedAt: new Date().toISOString()
    }
  }
}

export default jobsAtCrawler
