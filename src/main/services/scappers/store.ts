import { NormalizedItem } from './types'

const data: NormalizedItem[] = []

export const store = {
  upsertMany(items: NormalizedItem[]): void {
    const seen = new Set<string>()
    // dedupe by id
    for (const it of items) {
      seen.add(it.id)
      const i = data.findIndex((d) => d.id === it.id)
      if (i >= 0) data[i] = it
      else data.push(it)
    }
    // optional: drop items not seen this run (comment out if not wanted)
    // for (let i = data.length - 1; i >= 0; i--) if (!seen.has(data[i].id)) data.splice(i,1);
  },
  all(): NormalizedItem[] {
    return data.slice().sort((a, b) => b.scrapedAt.localeCompare(a.scrapedAt))
  }
}
