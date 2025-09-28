import axios from 'axios'
import * as cheerio from 'cheerio'
import { Crawler, ExtractResult, NormalizedItem, SearchConfig } from './types'

const BASE_URL = 'https://jobs.derstandard.at'

type DerStandardRawJob = {
  title: string
  url: string
  company: string
  location: string
  tags: string[]
  timePosted: string
}

const derStandardCrawler: Crawler = {
  name: 'jobs.derstandard.at',

  async extract(config: SearchConfig): Promise<ExtractResult[]> {
    const url = `${BASE_URL}/suche/${config.location}/${config.searchQuery}`

    console.log('... extracting from jobs.derstandard.at ', url)

    try {
      const { data: html } = await axios.get(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        timeout: 10000
      })

      const $ = cheerio.load(html)
      const rawJobs: DerStandardRawJob[] = []

      // Based on the sample HTML, look for job listing items
      // The structure shows: ul.JobsListingListItems_* > li.JobsListingCard_cardWrapper*
      // CSS classes have random suffixes, so we'll use partial attribute matching
      $('ul[class*="JobsListingListItems"] li[class*="JobsListingCard_cardWrapper"]').each(
        (_, element) => {
          try {
            const $el = $(element)

            // Skip promotional items, ads, and search agent wrappers
            if (
              $el.hasClass('JobsListingListItems_googleAdWrapper') ||
              $el.hasClass('JobsListingListItems_searchAgentWrapper') ||
              $el.find('[id*="gpt-ad"]').length > 0 ||
              $el.find('.SearchAgentCta_searchAgentCta').length > 0
            ) {
              return
            }

            // Extract job title and URL from the card link
            const cardLink = $el.find('a[class*="JobsListingCard_card"]')
            const title = cardLink.find('h2[class*="JobsListingCard_cardTitle"]').text().trim()

            console.log('------- ', title)
            if (!title) {
              return // Skip if no title found
            }

            const jobUrl = cardLink.attr('href') || ''
            const url = jobUrl.startsWith('http') ? jobUrl : `${BASE_URL}${jobUrl}`

            // Extract company name
            const company =
              $el.find('span[class*="JobsListingCard_cardCompany"]').text().trim() ||
              'Company not specified'

            // Extract location from the appendix section
            const appendixText = $el
              .find('div[class*="JobsListingCard_cardAppendix"]')
              .text()
              .trim()
            // Location is typically at the beginning, before the time posted
            const locationMatch = appendixText.match(/^([^,]+)(?:,.*)?/)
            const location = locationMatch
              ? locationMatch[1].trim()
              : config.location || 'Location not specified'

            // Extract time posted (usually after location and comma)
            const timeMatch = appendixText.match(/,\s*(.+)$/)
            const timePosted = timeMatch ? timeMatch[1].trim() : ''

            // Extract tags from the listing card tags section
            const tags: string[] = []
            $el
              .find('div[class*="ListingCardTags"] span[class*="ListingCardTag"]')
              .each((_, tagEl) => {
                const tagText = $(tagEl).text().trim()
                if (tagText && tagText !== 'NEU') {
                  // Skip generic "NEW" tags
                  tags.push(tagText)
                }
              })

            rawJobs.push({
              title,
              url,
              company,
              location,
              tags,
              timePosted
            })
          } catch (error) {
            console.warn('Error parsing job item from jobs.derstandard.at:', error)
            // Continue with next job item
          }
        }
      )

      console.log(`Extracted ${rawJobs.length} raw jobs from jobs.derstandard.at.`)
      return rawJobs
    } catch (error) {
      console.error('Error extracting from jobs.derstandard.at:', error)
      throw new Error(`Failed to extract from jobs.derstandard.at: ${error}`)
    }
  },

  normalize(raw: ExtractResult): NormalizedItem | null {
    const job = raw as DerStandardRawJob

    if (!job?.title || !job?.url) {
      return null
    }

    const description = job.tags.join(', ') || job.title

    // Check for remote work indicators in tags, title, or description
    const isRemote =
      /remote|homeoffice|home\s*office|fernarbeit/i.test(description) ||
      /remote|homeoffice|home\s*office|fernarbeit/i.test(job.title) ||
      job.tags.some((tag) => /homeoffice|remote/i.test(tag))

    return {
      id: `derstandard:${job.url}`,
      title: job.title?.trim() || '(no title)',
      company: job.company?.trim() || '(no company)',
      location: job.location?.trim() || '(no location)',
      remote: isRemote,
      description: description?.trim() || '(no description)',
      url: job.url,
      source: 'jobs.derstandard.at',
      scrapedAt: new Date().toISOString()
    }
  }
}

export default derStandardCrawler
