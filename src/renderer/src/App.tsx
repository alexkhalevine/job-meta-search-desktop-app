import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

import { useState } from 'react'

interface JobPost {
  title: string
  company: string
  location: string
  remote: boolean
  description: string
  url: string
  source: string
}

function App(): JSX.Element {
  const [searchQuery, setSearchQuery] = useState('nachhaltigkeit')
  const [location, setLocation] = useState('wien')
  const [jobs, setJobs] = useState<JobPost[]>([])
  const [discardedJobCount, setDiscardedJobCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
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

  const copyJobUrl = async (url: string) => {
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
    <div className="App">
      <header className="App-header">
        <h1>AI Job Search</h1>
        <p>Search for jobs using our intelligent scraper</p>

        <div className="search-form">
          <div className="form-group">
            <label htmlFor="searchQuery">Search Keywords:</label>
            <input
              id="searchQuery"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g., nachhaltigkeit, sustainability"
            />
          </div>

          <div className="form-group">
            <label htmlFor="location">Location:</label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., wien, vienna"
            />
          </div>

          <button
            onClick={handleSearch}
            disabled={isLoading || !searchQuery.trim()}
            className="search-button"
          >
            {isLoading ? 'Searching...' : 'Search Jobs'}
          </button>
        </div>

        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}

        {jobs.length > 0 && (
          <div className="results">
            <h2>
              Found {jobs.length} jobs. <small>(discarded {discardedJobCount})</small>
            </h2>
            <div className="jobs-list" style={{ overflowY: 'auto', maxHeight: '400px' }}>
              {jobs.map((job, index) => (
                <div key={index} className="job-card">
                  <h3 className="job-title">{job.title}</h3>
                  <p className="job-company">🏢 {job.company}</p>
                  <p className="job-location">
                    📍 {job.location} {job.remote && '🏠 Remote'}
                  </p>
                  <p className="job-description">{job.description}</p>
                  <div className="job-footer">
                    <span className="job-source">Source: {job.source}</span>
                    <button onClick={() => copyJobUrl(job.url)} className="view-job-button">
                      Copy URL
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </header>
    </div>
  )
}

export default App
