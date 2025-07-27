import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { BadgeCheckIcon, BadgeX, FolderSearch } from 'lucide-react'

import { useEffect, useState } from 'react'
import { ThemeProvider } from './components/theme-provider'
import { ModeToggle } from './components/mode-toggle'
import { Separator } from './components/ui/separator'
import { Input } from './components/ui/input'
import { Button } from './components/ui/button'
import { Label } from './components/ui/label'

interface JobPost {
  title: string
  company: string
  location: string
  remote: boolean
  description: string
  url: string
  source: string
}

function AppComponent(): JSX.Element {
  const [searchQuery, setSearchQuery] = useState('nachhaltigkeit')
  const [location, setLocation] = useState('wien')
  const [jobs, setJobs] = useState<JobPost[]>([])
  const [blacklist, setBlacklist] = useState<Array<string>>([])
  const [discardedJobCount, setDiscardedJobCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (): Promise<void> => {
    console.log('Window object:', window)
    console.log('ElectronAPI available:', !!window.electronAPI)
    console.log('ElectronAPI object:', window.electronAPI)

    if (!window.electronAPI) {
      setError('Electron API not available. Make sure the preload script is loaded.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await window.electronAPI.searchJobs({
        searchQuery,
        location
      })

      if (result.success && result.data) {
        setJobs(result.data)
        setDiscardedJobCount(result.meta.discardedCount)
      } else {
        setError(result.error || 'Unknown error occurred')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search jobs')
    } finally {
      setIsLoading(false)
    }
  }

  const loadBlacklist = async () => {
    const blacklist = await window.electronAPI.loadBlacklist()

    if (blacklist && blacklist.length > 0) {
      setBlacklist(blacklist)
    }
  }

  useEffect(() => {
    loadBlacklist()
  }, [])

  const copyJobUrl = async (url: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(url)
      console.log('URL copied to clipboard:', url)
      // You could add a toast notification here if desired
    } catch (err) {
      console.error('Failed to copy URL:', err)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
  }

  return (
    <div className="App p-10">
      <header className="App-header">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-lg">Job Search</h1>
          <p className="text-sm">Search for jobs using our intelligent scraper</p>
          <ModeToggle />
        </div>

        <Separator />

        <div className="mt-10 mb-10">
          <div className="mb-5">
            <Label htmlFor="searchQuery">Search Keywords</Label>
            <Input
              id="searchQuery"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g., nachhaltigkeit, sustainability"
            />
          </div>

          <div className="mb-5">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., wien, vienna"
            />
          </div>

          <div id="blaclist-container" className="mb-5">
            <p className="text-sm mb-2">Blacklist</p>
            <div>
              {blacklist.map((blacklistText: string) => {
                return (
                  <Button key={blacklistText} className="mr-2 mb-2" variant={'outline'}>
                    <BadgeX />
                    {blacklistText}
                  </Button>
                )
              })}
            </div>
          </div>

          <Button
            variant={'outline'}
            onClick={handleSearch}
            disabled={isLoading || !searchQuery.trim()}
            className="search-button"
          >
            {isLoading ? 'Searching...' : 'Search Jobs'}
          </Button>
        </div>

        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}

        <Separator />

        {jobs.length > 0 && (
          <div className="mt-5">
            <Badge variant="default" className="mr-5">
              <FolderSearch className="mr-2" />
              Found {jobs.length} jobs
            </Badge>

            <Badge variant="secondary">
              <BadgeCheckIcon className="mr-2" />
              Discarded {discardedJobCount} jobs
            </Badge>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>title</TableHead>
                  <TableHead>company</TableHead>
                  <TableHead>location</TableHead>
                  <TableHead>description</TableHead>
                  <TableHead>source</TableHead>
                  <TableHead>action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody className="jobs-list" style={{ overflowY: 'auto', maxHeight: '400px' }}>
                {jobs.map((job, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{job.title}</TableCell>
                    <TableCell>{job.company}</TableCell>
                    <TableCell>
                      {job.location} {job.remote && '🏠 Remote'}
                    </TableCell>
                    <TableCell>{job.description}</TableCell>
                    <TableCell className="text-right">{job.source}</TableCell>
                    <TableCell className="w-80 text-right">
                      <Button
                        onClick={() => copyJobUrl(job.url)}
                        className="view-job-button"
                        variant={'outline'}
                      >
                        Copy URL
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </header>
    </div>
  )
}

function App(): JSX.Element {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AppComponent />
    </ThemeProvider>
  )
}

export default App
