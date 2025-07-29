import axios from 'axios'
import { JobPost, SearchConfig } from '../jobScraperService'
import * as cheerio from 'cheerio'

const BASE_URL = 'https://www.jobs.at'

export async function scrapeJobsAt(config: SearchConfig): Promise<JobPost[]> {
  // Build search URL - jobs.at uses query parameters for search
  const searchParams = new URLSearchParams({
    q: config.searchQuery,
    l: config.location
  })
  const url = `${BASE_URL}/j/?${searchParams.toString()}`

  console.log('... scraping jobs.at:', url)

  try {
    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 10000
    })

    const $ = cheerio.load(html)
    const jobPosts: JobPost[] = []

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
        const fullUrl = jobUrl.startsWith('http') ? jobUrl : `${BASE_URL}${jobUrl}`

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
        const location = locations.join(', ') || 'Location not specified'

        // Extract job details/pills for description
        const pillTexts: string[] = []
        $el.find('.j-c-pill-text').each((_, pillEl) => {
          const pillText = $(pillEl).text().trim()
          if (pillText) pillTexts.push(pillText)
        })
        const description = pillTexts.join(', ') || title

        // Check for remote work indicators
        const isRemote =
          /remote|homeoffice|home\s*office|fernarbeit/i.test(description) ||
          /remote|homeoffice|home\s*office|fernarbeit/i.test(title)

        const jobPost: JobPost = {
          title,
          company,
          location,
          remote: isRemote,
          description,
          url: fullUrl,
          source: 'jobs.at'
        }

        jobPosts.push(jobPost)
      } catch (error) {
        console.warn('Error parsing job item from jobs.at:', error)
        // Continue with next job item
      }
    })

    console.log(`Found ${jobPosts.length} jobs from jobs.at`)
    return jobPosts
  } catch (error) {
    console.error('Error scraping jobs.at:', error)
    throw new Error(`Failed to scrape jobs.at: ${error}`)
  }
}
