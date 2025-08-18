import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Button } from '../ui/button'
import { DiscardedJobPostType } from '@/App'

export const DiscardedJobList = ({
  data
}: {
  data: DiscardedJobPostType[]
}): JSX.Element | null => {
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
          <TableHead>discard reason</TableHead>
          <TableHead>source</TableHead>
          <TableHead>action</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody className="jobs-list" style={{ overflowY: 'auto', maxHeight: '400px' }}>
        {data.map((jobItem, index) => (
          <TableRow key={index}>
            <TableCell className="font-medium">{jobItem.job.title}</TableCell>
            <TableCell>{jobItem.job.company}</TableCell>
            <TableCell>
              {jobItem.job.location} {jobItem.job.remote && '🏠 Remote'}
            </TableCell>
            <TableCell>
              {jobItem.job.description.length > 300
                ? `${jobItem.job.description.substring(0, 300)}...`
                : jobItem.job.description}
            </TableCell>
            <TableCell className="w-[200px]">
              Location: {jobItem.blockReason.locationCheckPassed ? 'OK' : 'NOT OK'}
              <br />
              Blocked by blacklist word: {jobItem.blockReason.locationCheckPassed ? 'YES' : 'NO'}
            </TableCell>
            <TableCell className="text-right">{jobItem.job.source}</TableCell>
            <TableCell className="w-80 text-right">
              {jobItem.job.links && jobItem.job.links.length > 0 ? (
                Links(jobItem.job)
              ) : (
                <Button
                  onClick={() => copyJobUrl(jobItem.job.url)}
                  className="view-job-button"
                  variant={'outline'}
                >
                  Copy URL
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
