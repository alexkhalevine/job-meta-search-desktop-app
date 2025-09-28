# steps to execute

1. always start with reading CLAUDE.me
2. read README.md to understand the purpose of the project

# tech stack

1. electron
2. electron-vite
3. react
4. typescript
5. icons from lucide-react
6. [shadcn](https://ui.shadcn.com/)

# commands

1. release:
   - run "git add ."
   - run "git commit -m" and add short but meaningful commit message
   - run "npm version patch" (automatically pushes code and tags, triggers GitHub release with release notes)

# future steps

1. refactor crawlers follow ETL pattern
2. visualize ingestion pipeline steps
3. use simple ETL pattern for crawlers, example:

```
export type NormalizedItem = {
  id: string;
  company: string
  location: string
  remote: boolean
  description: string
  url: string
  source: string
  links?: Array<{ title: string; link: string }>
  scrapedAt: string; // ISO
};

export type ExtractResult = unknown; // each crawler returns its raw shape
export type Crawler = {
  name: string;
  extract: () => Promise<ExtractResult[]>;
  normalize: (raw: ExtractResult) => NormalizedItem | null;
};

// store.ts — in-memory “L” of ETL
const data: NormalizedItem[] = [];
export const store = {
  upsertMany(items: NormalizedItem[]) {
    const seen = new Set<string>();
    // dedupe by id
    for (const it of items) {
      seen.add(it.id);
      const i = data.findIndex((d) => d.id === it.id);
      if (i >= 0) data[i] = it;
      else data.push(it);
    }
    // optional: drop items not seen this run (comment out if not wanted)
    // for (let i = data.length - 1; i >= 0; i--) if (!seen.has(data[i].id)) data.splice(i,1);
  },
  all() {
    return data.slice().sort((a, b) => b.scrapedAt.localeCompare(a.scrapedAt));
  },
};
```

```
// crawlers.ts — “E” and “T”
import type { Crawler, NormalizedItem } from "./types.js";

// Crawler A: returns [{id,title,link}]
const crawlerA: Crawler = {
  name: "siteA",
  async extract() {
    // replace with real scraping; here: fake data
    return [{ id: "a-1", title: "Alpha", link: "https://a/alpha" }];
  },
  normalize(raw): NormalizedItem | null {
    const r = raw as { id: string; title: string; link: string };
    if (!r?.id || !r?.link) return null;
    return {
      id: `siteA:${r.id}`,
      title: r.title?.trim() || "(no title)",
      url: r.link,
      source: "siteA",
      scrapedAt: new Date().toISOString(),
    };
  },
};

// Crawler B: returns [{slug,headline,url}]
const crawlerB: Crawler = {
  name: "siteB",
  async extract() {
    return [{ slug: "b-42", headline: "Beta", url: "https://b/beta" }];
  },
  normalize(raw): NormalizedItem | null {
    const r = raw as { slug: string; headline: string; url: string };
    if (!r?.slug || !r?.url) return null;
    return {
      id: `siteB:${r.slug}`,
      title: r.headline?.trim() || "(no title)",
      url: r.url,
      source: "siteB",
      scrapedAt: new Date().toISOString(),
    };
  },
};


```