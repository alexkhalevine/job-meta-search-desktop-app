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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useState } from 'react'

export const DiscardedJobList = ({
  data
}: {
  data: DiscardedJobPostType[]
}): JSX.Element | null => {
  const [showTooltip, setShowTooltip] = useState<string | null>(null)

  const copyJobUrl = async (url: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(url)
      console.log('URL copied to clipboard:', url)
      setShowTooltip(url)
      setTimeout(() => setShowTooltip(null), 2000)
    } catch (err) {
      console.error('Failed to copy URL:', err)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setShowTooltip(url)
      setTimeout(() => setShowTooltip(null), 2000)
    }
  }
  const Links = (job) => {
    return job.links.map((linkResult: { title: string; link: string }) => (
      <Tooltip key={linkResult.link} open={showTooltip === linkResult.link}>
        <TooltipTrigger asChild>
          <Button onClick={() => copyJobUrl(linkResult.link)}>
            {linkResult.title}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Link copied</p>
        </TooltipContent>
      </Tooltip>
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
                <Tooltip open={showTooltip === jobItem.job.url}>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => copyJobUrl(jobItem.job.url)}
                      className="view-job-button"
                      variant={'outline'}
                    >
                      Copy URL
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Link copied</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
