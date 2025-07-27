import { Blacklist } from './bannedKeywords'
import { LOCATION } from './env'

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

  const locationMatch = job.location.toLowerCase().includes(LOCATION)
  const remoteMatch = job.remote && !locationMatch
  const locationOk = locationMatch || remoteMatch

  const bannedKeywords = Blacklist.load()
  console.log('bannedKeywords', bannedKeywords)

  const isBlocked = bannedKeywords.some(
    (keyword) => title.includes(keyword) || url.includes(keyword) || description.includes(keyword)
  )

  return locationOk && !isBlocked
}
