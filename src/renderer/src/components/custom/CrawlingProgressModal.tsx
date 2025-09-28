import { useEffect, useState } from 'react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription
} from '@/components/ui/alert-dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle } from 'lucide-react'

export type ProgressMessage = {
  id: string
  message: string
  timestamp: number
  type: 'info' | 'success' | 'error'
  source?: string
}

interface CrawlingProgressModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function CrawlingProgressModal({
  isOpen,
  onOpenChange
}: CrawlingProgressModalProps): JSX.Element {
  const [messages, setMessages] = useState<ProgressMessage[]>([])
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setMessages([])
      setIsComplete(false)
      return
    }

    // Listen for progress messages from main process
    const handleProgressMessage = (
      _event: Electron.IpcRendererEvent,
      progressData: unknown
    ): void => {
      const data = progressData as ProgressMessage
      setMessages((prev) => [...prev, data])

      // Check if this is a completion message
      if (
        data.message.includes('Total jobs found:') ||
        data.message.includes('unique jobs after deduplication') ||
        data.message.includes('Search completed')
      ) {
        setIsComplete(true)
        // Auto-close after 2 seconds when complete so users can read the summary
        setTimeout(() => {
          onOpenChange(false)
        }, 2000)
      }
    }

    // Set up IPC listener
    if (window.electronAPI?.onProgressMessage) {
      window.electronAPI.onProgressMessage(handleProgressMessage)
    }

    // Cleanup listener on unmount
    return (): void => {
      if (window.electronAPI?.removeProgressListener) {
        window.electronAPI.removeProgressListener(handleProgressMessage)
      }
    }
  }, [isOpen, onOpenChange])

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getMessageIcon = (type: string): JSX.Element => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-brand" />
      case 'error':
        return <div className="h-4 w-4 bg-red-500 rounded-full" />
      default:
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
    }
  }

  const getBadgeVariant = (type: string): 'default' | 'destructive' | 'secondary' => {
    switch (type) {
      case 'success':
        return 'default' as const
      case 'error':
        return 'destructive' as const
      default:
        return 'secondary' as const
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl max-h-[80vh]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {!isComplete && <Loader2 className="h-5 w-5 animate-spin" />}
            {isComplete && <CheckCircle className="h-5 w-5 text-brand" />}
            {isComplete ? 'Crawling Complete' : 'Crawling Job Sources...'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isComplete
              ? 'All job sources have been processed successfully.'
              : 'Searching across multiple job platforms in real-time.'}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <ScrollArea className="h-[400px] w-full">
          <div className="space-y-3 pr-4">
            {messages.length === 0 && !isComplete && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Initializing crawlers...</span>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className="flex items-start gap-3 p-3 bg-muted rounded-lg transition-all duration-200 hover:bg-muted/80"
              >
                {getMessageIcon(msg.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(msg.timestamp)}
                    </span>
                    {msg.source && (
                      <Badge variant={getBadgeVariant(msg.type)} className="text-xs">
                        {msg.source}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm break-words">{msg.message}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {isComplete && (
          <div className="text-center text-sm text-muted-foreground">
            Modal will close automatically in 2 seconds...
          </div>
        )}
      </AlertDialogContent>
    </AlertDialog>
  )
}
