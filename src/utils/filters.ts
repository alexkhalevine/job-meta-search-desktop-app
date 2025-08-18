import { Blacklist } from './bannedKeywords'
import { getLocation } from './env'

export function isRelevantJob(job: {
  title: string
  url: string
  location: string
  remote: boolean
  description?: string
}): boolean {
  const title = job.title.toLowerCase()
  const description = (job.description || '').toLowerCase()
  const url = job.url.toLocaleLowerCase()
  const location = getLocation()

  const locationMatch = job.location.toLowerCase() === location.toLowerCase()
  const remoteMatch = job.remote && !locationMatch
  const locationOk = locationMatch || remoteMatch

  const bannedKeywords: string[] = Blacklist.load()
  const isBlocked = bannedKeywords.some(
    (keyword: string) =>
      title.includes(keyword) || url.includes(keyword) || description.includes(keyword)
  )

  return locationOk && !isBlocked
}
