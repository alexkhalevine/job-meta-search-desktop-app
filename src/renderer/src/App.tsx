import { Badge } from '@/components/ui/badge'
import { BadgeCheckIcon, BadgeX, FolderSearch } from 'lucide-react'

import { useEffect, useState } from 'react'
import { ThemeProvider } from './components/theme-provider'
import { ModeToggle } from './components/mode-toggle'
import { Separator } from './components/ui/separator'
import { Input } from './components/ui/input'
import { Button } from './components/ui/button'
import { Label } from './components/ui/label'
import { JobList } from './components/custom/JobList'
import { Popover, PopoverContent, PopoverTrigger } from './components/ui/popover'
import { SettingsComponent } from './components/custom/Settings'

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
  const [newBlacklistWord, setNewBlacklistWord] = useState('')
  const [discardedJobCount, setDiscardedJobCount] = useState<number>(0)
  const [discardedJobTitles, setDiscardedJobTitles] = useState<Array<string>>([])

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
        setDiscardedJobTitles(result.meta.discardedList)
      } else {
        setError(result.error || 'Unknown error occurred')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search jobs')
    } finally {
      setIsLoading(false)
    }
  }

  const loadBlacklist = async (): Promise<void> => {
    const blacklist = await window.electronAPI.loadBlacklist()

    if (blacklist && blacklist.length > 0) {
      setBlacklist(blacklist)
    }
  }

  const deleteFromBlacklist = async (wordToDelete: string): Promise<void> => {
    try {
      // Remove the word from the current blacklist array
      const updatedBlacklist = blacklist.filter((word) => word !== wordToDelete)

      // Save the updated blacklist to file
      const result = await window.electronAPI.updateBlacklist(updatedBlacklist)

      if (result.success) {
        // Update the UI state
        setBlacklist(updatedBlacklist)
        console.log(`Successfully deleted "${wordToDelete}" from blacklist`)
      } else {
        setError(`Failed to delete word: ${result.message}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete word from blacklist')
    }
  }

  const addToBlacklist = async (): Promise<void> => {
    try {
      const trimmedWord = newBlacklistWord.trim().toLowerCase()

      // Validation
      if (!trimmedWord) {
        setError('Please enter a word to add to the blacklist')
        return
      }

      // Check if word already exists
      if (blacklist.includes(trimmedWord)) {
        setError(`"${trimmedWord}" is already in the blacklist`)
        return
      }

      // Add the word to the current blacklist array
      const updatedBlacklist = [...blacklist, trimmedWord]

      // Save the updated blacklist to file
      const result = await window.electronAPI.updateBlacklist(updatedBlacklist)

      if (result.success) {
        // Update the UI state
        setBlacklist(updatedBlacklist)
        setNewBlacklistWord('') // Clear the input field
        setError(null) // Clear any previous errors
        console.log(`Successfully added "${trimmedWord}" to blacklist`)
      } else {
        setError(`Failed to add word: ${result.message}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add word to blacklist')
    }
  }

  useEffect(() => {
    loadBlacklist()
  }, [])

  return (
    <div className="App p-10">
      <header className="App-header">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-lg">Job Search</h1>
          <p className="text-sm">Search for jobs using our intelligent scraper</p>
          <div className="flex gap-2">
            <SettingsComponent />
            <ModeToggle />
          </div>
        </div>

        <Separator />

        <div className="mt-10 mb-10">
          <div className="flex gap-5">
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
          </div>

          <div id="blaclist-container" className="mb-5">
            <p className="text-sm mb-2">Blacklist</p>
            <div>
              {blacklist.map((blacklistText: string) => {
                return (
                  <Button
                    key={blacklistText}
                    className="delete-blacklisted-word mr-2 mb-2 group"
                    variant={'outline'}
                    onClick={() => deleteFromBlacklist(blacklistText)}
                  >
                    <BadgeX className="opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    {blacklistText}
                  </Button>
                )
              })}
            </div>
            <div className="mt-4 flex items-center gap-5">
              <Label htmlFor="newBlacklistWord" className="">
                Add blacklist word
              </Label>
              <Input
                id="newBlacklistWord"
                type="text"
                className="max-w-80"
                placeholder="e.g., pimp, dealer"
                value={newBlacklistWord}
                onChange={(e) => setNewBlacklistWord(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addToBlacklist()
                  }
                }}
              />
              <Button
                id="saveNewBlacklistWord"
                onClick={addToBlacklist}
                disabled={!newBlacklistWord.trim()}
                className=""
              >
                Save
              </Button>
            </div>
          </div>

          <Separator />

          <div className="flex justify-center mt-9">
            <Button
              variant={'destructive'}
              onClick={handleSearch}
              disabled={isLoading || !searchQuery.trim()}
              className="search-button"
            >
              {isLoading ? 'Searching...' : 'Search Jobs'}
            </Button>
          </div>
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

            <Popover>
              <PopoverTrigger>
                <Badge variant="secondary">
                  <BadgeCheckIcon className="mr-2" />
                  Discarded {discardedJobCount} jobs
                </Badge>
              </PopoverTrigger>
              <PopoverContent className="text-xs w-96">
                {discardedJobTitles.join(', ')}
              </PopoverContent>
            </Popover>

            <JobList jobs={jobs} />
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
