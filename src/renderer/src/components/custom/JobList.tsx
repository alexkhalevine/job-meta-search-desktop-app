import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Button } from '../ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useState } from 'react'

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

export const JobList = ({ jobs }: { jobs: JobPost[] }): JSX.Element => {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

  const copyJobUrl = async (url: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(url)
      console.log('URL copied to clipboard:', url)
      setCopiedUrl(url)
      setTimeout(() => setCopiedUrl(null), 2000)
    } catch (err) {
      console.error('Failed to copy URL:', err)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopiedUrl(url)
      setTimeout(() => setCopiedUrl(null), 2000)
    }
  }
  const Links = (job: JobPost): JSX.Element[] => {
    return (
      job.links?.map((linkResult: { title: string; link: string }) => (
        <TooltipProvider key={linkResult.link}>
          <Tooltip open={copiedUrl === linkResult.link}>
            <TooltipTrigger asChild>
              <Button className="mr-2 mb-2" onClick={() => copyJobUrl(linkResult.link)}>
                {linkResult.title}
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-teal-500">
              <p>Link copied.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )) || []
    )
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
              {job.description.length > 100 ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p>{job.description.substring(0, 100)}...</p>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-96">
                    <p className="p-5">{job.description}</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                job.description
              )}
            </TableCell>
            <TableCell className="text-left">{job.source}</TableCell>
            <TableCell className="w-70 text-left">
              {job.links && job.links.length > 0 ? (
                Links(job)
              ) : (
                <TooltipProvider>
                  <Tooltip open={copiedUrl === job.url}>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => copyJobUrl(job.url)}
                        className="view-job-button"
                        variant={'outline'}
                      >
                        Click to copy link
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Link copied.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
