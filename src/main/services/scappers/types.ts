export type NormalizedItem = {
  id: string
  title: string
  company: string
  location: string
  remote: boolean
  description: string
  url: string
  source: string
  links?: Array<{ title: string; link: string }>
  scrapedAt: string // ISO
}

export type ExtractResult = unknown // each crawler returns its raw shape

export type SearchConfig = {
  searchQuery: string
  location: string
}

export type Crawler = {
  name: string
  extract: (config: SearchConfig) => Promise<ExtractResult[]>
  normalize: (raw: ExtractResult) => NormalizedItem | null
}
