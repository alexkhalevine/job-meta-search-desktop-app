import { Blacklist } from './bannedKeywords'
import { getLocation } from './env'

export function isRelevantJob(job: {
  title: string
  url: string
  location: string
  remote: boolean
  description?: string
}): {
  checkPassed: boolean
  blockReason: {
    locationCheckPassed: boolean
    wordCheckPassed: boolean
  }
} {
  const title = job.title.toLowerCase()
  const description = (job.description || '').toLowerCase()
  const url = job.url.toLowerCase()
  const locationFromConfig = getLocation().toLowerCase()

  const locationMatch =
    job.location.toLowerCase() === locationFromConfig ||
    locationFromConfig.includes(job.location.toLowerCase())
  const remoteMatch = job.remote && !locationMatch
  const locationOk = locationMatch || remoteMatch

  const bannedKeywords: string[] = Blacklist.load()
  const isBlocked = bannedKeywords.some(
    (keyword: string) =>
      title.includes(keyword.toLowerCase()) ||
      url.includes(keyword.toLowerCase()) ||
      description.includes(keyword.toLowerCase())
  )

  return {
    checkPassed: locationOk && !isBlocked,
    blockReason: {
      locationCheckPassed: locationOk,
      wordCheckPassed: !isBlocked
    }
  }
}
