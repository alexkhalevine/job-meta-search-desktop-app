import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Button } from '../ui/button'

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

export const JobList = ({ jobs }: { jobs: any[] }): JSX.Element => {
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
  const Links = (job) => {
    return job.links.map((linkResult: { title: string; link: string }) => (
      <Button key={linkResult.link} onClick={() => copyJobUrl(linkResult.link)}>
        {linkResult.title}
      </Button>
    ))
  }
  return (
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
            <TableCell>
              {job.description.length > 300
                ? `${job.description.substring(0, 300)}...`
                : job.description}
            </TableCell>
            <TableCell className="text-right">{job.source}</TableCell>
            <TableCell className="w-80 text-right">
              {job.links && job.links.length > 0 ? (
                Links(job)
              ) : (
                <Button
                  onClick={() => copyJobUrl(job.url)}
                  className="view-job-button"
                  variant={'outline'}
                >
                  Click to copy link
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
