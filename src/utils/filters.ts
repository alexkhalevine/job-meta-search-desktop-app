import { Blacklist } from '../main/services/blacklistService'
import { getLocation } from './env'

// Cache blacklist to avoid repeated file I/O
let cachedBlacklist: string[] | null = null
let lastBlacklistLoad = 0
const BLACKLIST_CACHE_TTL = 60000 // 1 minute

interface JobInput {
  title: string
  url: string
  location: string
  remote: boolean
  description?: string
}

interface FilterResult {
  checkPassed: boolean
  blockReason: {
    locationCheckPassed: boolean
    wordCheckPassed: boolean
    description?: string
    triggerWord?: string
  }
  matchedBlacklistWords?: string[]
}

export function isRelevantJob(job: JobInput): FilterResult {
  // Input validation
  if (!job || typeof job !== 'object') {
    return createFailedResult(false, false, 'Invalid job input')
  }

  const { title = '', url = '', location = '', remote = false, description = '' } = job

  if (!title.trim()) {
    return createFailedResult(false, false, 'Missing job title')
  }

  // Normalize inputs
  const normalizedJob = {
    title: title.toLowerCase().trim(),
    url: url.toLowerCase().trim(),
    location: location.toLowerCase().trim(),
    remote,
    description: description.toLowerCase().trim()
  }

  const configLocation = getLocation().toLowerCase().trim()

  // Enhanced location checking
  const locationResult = checkLocationRelevance(normalizedJob, configLocation)

  // Enhanced blacklist checking with caching
  const blacklistResult = checkBlacklistWords(normalizedJob)

  return {
    checkPassed: locationResult.passed && blacklistResult.passed,
    blockReason: {
      locationCheckPassed: locationResult.passed,
      wordCheckPassed: blacklistResult.passed,
      ...(blacklistResult.matchedWords.length > 0 && {
        triggerWord: blacklistResult.matchedWords[0]
      })
    },
    ...(blacklistResult.matchedWords.length > 0 && {
      matchedBlacklistWords: blacklistResult.matchedWords
    })
  }
}

function checkLocationRelevance(
  job: { location: string; remote: boolean },
  configLocation: string
): { passed: boolean; reason?: string } {
  // If no config location is set, accept all jobs
  if (!configLocation) {
    return { passed: true }
  }

  // Remote jobs are always relevant regardless of location
  if (job.remote) {
    return { passed: true, reason: 'remote job' }
  }

  // No location specified in job
  if (!job.location) {
    return { passed: false, reason: 'no location specified' }
  }

  // Enhanced location matching with common variations
  const locationAliases = getLocationAliases(configLocation)
  const jobLocationVariations = getLocationVariations(job.location)

  const hasMatch = locationAliases.some((alias) =>
    jobLocationVariations.some(
      (variation) => variation.includes(alias) || alias.includes(variation)
    )
  )

  return {
    passed: hasMatch,
    reason: hasMatch ? 'location match' : `no match for ${configLocation}`
  }
}

function checkBlacklistWords(job: { title: string; url: string; description: string }): {
  passed: boolean
  matchedWords: string[]
} {
  const blacklist = getCachedBlacklist()
  const matchedWords: string[] = []

  const searchableText = `${job.title} ${job.url} ${job.description}`

  for (const keyword of blacklist) {
    const normalizedKeyword = keyword.toLowerCase().trim()
    if (normalizedKeyword && searchableText.includes(normalizedKeyword)) {
      matchedWords.push(keyword)
    }
  }

  return {
    passed: matchedWords.length === 0,
    matchedWords
  }
}

function getCachedBlacklist(): string[] {
  const now = Date.now()

  if (!cachedBlacklist || now - lastBlacklistLoad > BLACKLIST_CACHE_TTL) {
    try {
      cachedBlacklist = Blacklist.load()
      lastBlacklistLoad = now
    } catch (error) {
      console.error('Failed to load blacklist:', error)
      cachedBlacklist = []
    }
  }

  return cachedBlacklist
}

function getLocationAliases(location: string): string[] {
  const aliases = [location]

  // Add common location aliases
  const locationMap: Record<string, string[]> = {
    wien: ['vienna', 'viennese'],
    vienna: ['wien', 'viennese'],
    münchen: ['munich'],
    munich: ['münchen'],
    köln: ['cologne'],
    cologne: ['köln']
  }

  const additionalAliases = locationMap[location]
  if (additionalAliases) {
    aliases.push(...additionalAliases)
  }

  return aliases
}

function getLocationVariations(location: string): string[] {
  const variations = [location]

  // Split on common separators and add parts
  const parts = location
    .split(/[,\-\s]+/)
    .map((part) => part.trim())
    .filter(Boolean)
  variations.push(...parts)

  return variations
}

function createFailedResult(
  locationPassed: boolean,
  wordsPassed: boolean,
  reason?: string
): FilterResult {
  return {
    checkPassed: false,
    blockReason: {
      locationCheckPassed: locationPassed,
      wordCheckPassed: wordsPassed,
      ...(reason && { description: reason })
    }
  }
}

// Utility function to clear cache (useful for testing)
export function clearFilterCache(): void {
  cachedBlacklist = null
  lastBlacklistLoad = 0
}
