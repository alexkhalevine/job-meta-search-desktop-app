import { PlaywrightCrawler } from 'crawlee'
import { JobPost, SearchConfig } from '../jobScraperService'

export async function scrapeWienJobs(config: SearchConfig): Promise<JobPost[]> {
  console.log('🕷️ Starting Wien jobs crawler for:', config.searchQuery)

  const results: JobPost[] = []

  // Construct the search URL
  const searchUrl = `https://jobs.wien.gv.at/stellenangebote/index.html?searchCriteria[0][key]=keywords&searchCriteria[0][values][]=${encodeURIComponent(config.searchQuery)}`

  console.log('🔍 Crawling URL:', searchUrl)

  const crawler = new PlaywrightCrawler({
    // Use headless mode for production
    headless: true,

    // Handle each page
    async requestHandler({ page, request, enqueueLinks }): Promise<void> {
      console.log(`🔍 Processing ${request.loadedUrl}...`)

      try {
        // Wait for the JavaScript to load and render the job listings
        console.log('⏳ Waiting for dynamic content to load...')

        // First wait for the main container
        await page.waitForSelector('#talentlinkJobsList', { timeout: 30000 })

        // Then wait for actual job data to be populated (table with jobs)
        await page
          .waitForSelector('#talentlinkJobsList table.table tbody tr', {
            timeout: 30000,
            state: 'visible'
          })
          .catch(() => {
            console.log('⚠️ No job rows found, page might be empty or still loading')
          })

        // Give extra time for dynamic content to fully render
        await page.waitForTimeout(3000)

        // Extract job data from the page
        const jobs = await page.evaluate(() => {
          const jobElements = document.querySelectorAll('#talentlinkJobsList table.table tbody tr')
          const extractedJobs: JobPost[] = []

          console.log(`🔍 Found ${jobElements.length} job elements on the page`)

          jobElements.forEach((jobElement, index) => {
            try {
              // Extract title from <th> element with link
              const titleElement = jobElement.querySelector('th a[data-lumesse-jl-action="detail"]')
              const title = titleElement?.textContent?.trim() || ''

              // Extract URL from the link
              const url = titleElement?.getAttribute('href') || ''
              const fullUrl = url.startsWith('http') ? url : `https://jobs.wien.gv.at/${url}`

              // Extract department/dienststelle from second column
              const departmentElement = jobElement.querySelector('td[headers*="th2"]')
              const department = departmentElement?.textContent?.trim() || ''

              // Extract application deadline from third column
              const deadlineElement = jobElement.querySelector('td[headers*="th3"]')
              const deadline = deadlineElement?.textContent?.trim() || ''

              // Extract publication date from fourth column
              const pubDateElement = jobElement.querySelector('td[headers*="th4"]')
              const publicationDate = pubDateElement?.textContent?.trim() || ''

              console.log(`Job ${index + 1}: "${title}" at ${department}`)

              if (title && url) {
                // Create description from available information
                const description = [
                  department && `Dienststelle: ${department}`,
                  deadline && `Bewerbungsfrist: ${deadline}`,
                  publicationDate && `Publikationsdatum: ${publicationDate}`
                ]
                  .filter(Boolean)
                  .join(' | ')

                extractedJobs.push({
                  title,
                  company: 'Stadt Wien',
                  location: 'wien',
                  remote: false,
                  description,
                  url: fullUrl,
                  source: 'jobs.wien.gv.at'
                })
              }
            } catch (error) {
              console.error('Error extracting job from element:', error)
            }
          })

          return extractedJobs
        })

        console.log(`✅ Found ${jobs.length} jobs on this page`)
        results.push(...jobs)

        // Check for pagination - Wien jobs portal uses lumesse pagination
        try {
          const hasNextPage = await page.evaluate(() => {
            // Look for next page button or pagination links
            const nextButton = document.querySelector('[data-lumesse-jl-action="next"]')
            const paginationNext = document.querySelector('.pagination .next:not(.disabled)')
            return !!(nextButton && !nextButton.hasAttribute('disabled')) || !!paginationNext
          })

          if (hasNextPage && results.length < 100) {
            console.log('📄 Found pagination, enqueueing next page...')
            await enqueueLinks({
              selector: '[data-lumesse-jl-action="next"], .pagination .next:not(.disabled)',
              baseUrl: 'https://jobs.wien.gv.at'
            })
          }
        } catch (paginationError) {
          console.log('ℹ️ No pagination found or error checking pagination:', paginationError)
        }
      } catch (error) {
        console.error('❌ Error processing page:', error)
      }
    },

    // Handle failed requests
    failedRequestHandler({ request }): void {
      console.error(`❌ Request ${request.url} failed too many times.`)
    },

    // Limit concurrent requests to be respectful to Wien servers
    maxConcurrency: 1,
    maxRequestsPerCrawl: 5, // Limit total requests to be conservative
    requestHandlerTimeoutSecs: 60 // Increase timeout for slow-loading pages
  })

  try {
    // Start the crawl
    await crawler.run([searchUrl])

    console.log(`✅ Wien jobs crawler completed. Found ${results.length} jobs total.`)
    console.log(results)

    // Filter out duplicates by URL
    const uniqueJobs = results.filter(
      (job, index, array) => array.findIndex((j) => j.url === job.url) === index
    )

    console.log(`🔗 Returning ${uniqueJobs.length} unique jobs after deduplication`)
    return uniqueJobs
  } catch (error) {
    console.error('Wien jobs crawler error:', error)
    return []
  }
}
