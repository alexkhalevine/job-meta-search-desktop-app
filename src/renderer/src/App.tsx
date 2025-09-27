import { Badge } from '@/components/ui/badge'
import { BadgeX, Clock4, FolderSearch, Trash } from 'lucide-react'

import { useEffect, useState } from 'react'
import { ThemeProvider } from './components/theme-provider'
import { ModeToggle } from './components/mode-toggle'
import { Separator } from './components/ui/separator'
import { Input } from './components/ui/input'
import { Button } from './components/ui/button'
import { Label } from './components/ui/label'
import { JobList } from './components/custom/JobList'
import { SettingsComponent, SettingsType } from './components/custom/Settings'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger
} from './components/ui/drawer'
import { ScrollArea } from './components/ui/scroll-area'
import { DiscardedJobList } from './components/custom/DiscardedJobList'
import { DevprodLogo } from './components/DevProdIcon'
import { TooltipProvider } from './components/ui/tooltip'
import { Switch } from '@/components/ui/switch'

export interface JobPost {
  title: string
  company: string
  location: string
  remote: boolean
  description: string
  url: string
  source: string
  links?: Array<{ title: string; link: string }>
}

export type DiscardedJobPostType = {
  job: JobPost
  blockReason: {
    locationCheckPassed: boolean
    wordCheckPassed: boolean
  }
}

function AppComponent(): JSX.Element {
  const [searchQuery, setSearchQuery] = useState('nachhaltigkeit')
  const [location, setLocation] = useState('wien')
  const [jobs, setJobs] = useState<JobPost[]>([])
  const [blacklist, setBlacklist] = useState<Array<string>>([])
  const [newBlacklistWord, setNewBlacklistWord] = useState('')
  const [discardedJobCount, setDiscardedJobCount] = useState<number>(0)
  const [discardedJobs, setDiscardedJobs] = useState<Array<DiscardedJobPostType>>([])

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cooldownActive, setCooldownActive] = useState(false)
  const [advancedCrawlingEnabled, setAdvancedCrawlingEnabled] = useState(false)

  const handleSearch = async (): Promise<void> => {
    if (cooldownActive) return
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
        setDiscardedJobCount(result.meta.discardedList.length)
        setDiscardedJobs(result.meta.discardedList)
      } else {
        setError(result.error || 'Unknown error occurred')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search jobs')
    } finally {
      setIsLoading(false)
      setCooldownActive(true)
      setTimeout(() => setCooldownActive(false), 10000)
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

  const handleAdvancedCrawlingToggle = async (checked: boolean): Promise<void> => {
    try {
      const result = await window.electronAPI.updateSettingsAdvancedCrawling(checked)

      if (result) {
        setAdvancedCrawlingEnabled(checked)
      } else {
        setError(`Failed to update advanced crawling setting: ${result}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update advanced crawling setting')
    }
  }

  const fetchSettings = async (): Promise<SettingsType | void> => {
    if (!window.electronAPI) {
      setError('Electron API not available. Make sure the preload script is loaded.')
      return
    }

    try {
      const result = await window.electronAPI.loadSettings()

      if (result.success && result.data) {
        const settings = result.data as SettingsType
        setAdvancedCrawlingEnabled(settings.enableAdvancedCrawling || false)
        console.log('Loaded settings:', settings)
        console.log('Advanced crawling enabled:', settings.enableAdvancedCrawling)
      } else {
        console.log('Failed to load settings:', result)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings')
      console.error('Settings loading error:', err)
    }
  }

  useEffect(() => {
    loadBlacklist()
    fetchSettings()
  }, [])

  return (
    <div className="p-10">
      <header className="border border-slate-200 dark:border-slate-900 rounded-lg p-6 bg-background">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-lg flex items-center">
            <b>Job Search by</b>
            <DevprodLogo width={140} />
          </h1>
          <p className="text-sm">Look for jobs using intelligent meta-search assistant.</p>
          <div className="flex gap-2">
            <SettingsComponent />
            <ModeToggle />
          </div>
        </div>

        <Separator />

        <div className="mt-10 mb-10 gap-5">
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

          <section className="flex">
            <div id="blacklist-container" className="my-5">
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
            <div className="border border-slate-200 dark:border-slate-900 rounded-lg p-6 bg-background w-[200px]">
              <p className="text-sm mb-2">Additional settings</p>
              <Label>Enable advanced crawling</Label>
              <Switch
                id="enable-advanced-crawling-switch"
                checked={advancedCrawlingEnabled}
                onCheckedChange={handleAdvancedCrawlingToggle}
              />
            </div>
          </section>
        </div>
      </header>

      <div className="flex justify-center my-9">
        <Button
          variant={'destructive'}
          onClick={handleSearch}
          disabled={isLoading || cooldownActive || !searchQuery.trim()}
          className="search-button"
        >
          {cooldownActive && <Clock4 />}
          {isLoading
            ? 'Searching...'
            : cooldownActive
              ? 'Cooldown, wait a moment for next search'
              : 'Search Jobs'}
        </Button>
      </div>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {jobs.length > 0 && (
        <div
          className="mt-5 mb-20 border border-slate-200 dark:border-slate-900 rounded-lg p-6 bg-background"
          id="job-list"
        >
          <Badge variant="default" className="mr-5">
            <FolderSearch className="mr-2" />
            Found {jobs.length} jobs
          </Badge>

          <Drawer>
            <DrawerTrigger>
              <Badge variant="secondary">
                <Trash className="mr-2" />
                View discarded {discardedJobCount} jobs
              </Badge>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Jobs I discarded due to blacklist settings</DrawerTitle>
                <DrawerDescription>Count: {discardedJobCount}</DrawerDescription>
              </DrawerHeader>
              <ScrollArea className="h-[450px] w-full rounded-md border p-4">
                <DiscardedJobList data={discardedJobs} />
              </ScrollArea>
              <DrawerFooter>
                <DrawerClose>
                  <Button variant="outline">Close</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>

          <JobList jobs={jobs} />
        </div>
      )}

      <div
        className={`${jobs.length > 0 ? 'relative mt-5 border-t' : 'fixed bottom-0 left-0 right-0 border-t'} bg-background/80 backdrop-blur-sm p-4 text-xs`}
        id="disclaimer-text"
      >
        <p>Disclaimer</p>
        <small>
          This tool does not save any public data from any 3th party job search engine or service in
          any data store.
        </small>
        <small className="pl-1">This is a non-profit personal productivity tool</small>
      </div>
    </div>
  )
}

function App(): JSX.Element {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <TooltipProvider>
        <AppComponent />
      </TooltipProvider>
    </ThemeProvider>
  )
}

export default App
