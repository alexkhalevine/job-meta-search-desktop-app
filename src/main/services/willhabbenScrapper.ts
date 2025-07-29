import axios from 'axios'
import { JobPost, SearchConfig } from './jobScraperService'
import * as cheerio from 'cheerio'

const BASE_URL = 'https://www.willhaben.at'

export async function scrapWillhaben(config: SearchConfig): Promise<JobPost[]> {
  const url = `${BASE_URL}/jobs/suche?keyword=${config.searchQuery}&location=${config.location}`

  try {
    const { data: html } = await axios.get(url)

    const $ = cheerio.load(html)
    const jobPosts: JobPost[] = []

    // Select job items within the results list - use data-testid pattern for job rows
    $('#skip-to-resultlist div[data-testid^="jobsresultlist-row-"]').each((_, el) => {
      // Extract title from the data-testid attribute that contains "title"
      const title = $(el).find('span[data-testid*="title"]').text().trim()

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
      const location = detailsParts.length > 1 ? detailsParts.slice(1).join(', ') : config.location

      // Extract job URL from the href attribute
      const jobHref = $(el).find('a[href*="/jobs/job/"]').first().attr('href')
      const jobUrl = jobHref ? BASE_URL + jobHref : ''

      // Check for remote work indicators in the details or location
      const isRemote = /remote|home\s*office|homeoffice/i.test(details + ' ' + location)

      // Use the job title as description since willhaben doesn't provide descriptions in listings
      const description = `${title}. Details: ${details}`

      // Only add jobs with valid title and URL
      if (title && jobUrl) {
        jobPosts.push({
          title,
          company,
          location,
          remote: isRemote,
          description,
          url: jobUrl,
          source: 'willhaben.at'
        })
      }
    })

    console.log(`Found ${jobPosts.length} jobs from willhaben.at.`)
    console.log(jobPosts)

    return jobPosts
  } catch (error) {
    console.error('Error scraping willhaben.at:', error)
    throw new Error(`Failed to scrape willhaben.at: ${error}`)
  }
}
