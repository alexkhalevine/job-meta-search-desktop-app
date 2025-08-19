import { JobPost, SearchConfig } from '../jobScraperService'

const BASE_URL = 'https://www.willhaben.at'

export async function scrapWillhaben(config: SearchConfig): Promise<JobPost[]> {
  const url = `${BASE_URL}/jobs/suche?keyword=${config.searchQuery}&location=${config.location}`



  return {}
}
