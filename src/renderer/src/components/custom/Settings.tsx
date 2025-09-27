import { CheckCircle2Icon, Settings, Terminal } from 'lucide-react'
import { Button } from '../ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '../ui/sheet'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Separator } from '../ui/separator'
import { useEffect, useState } from 'react'
import { Badge } from '../ui/badge'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'

type SettingsType = {
  secrets?: {
    SERPAPI_KEY: string
  }
  serpQuota?: number
}

export const SettingsComponent = (): JSX.Element => {
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettings] = useState<SettingsType>()
  const [settingsUpdated, setSettingsUpdated] = useState<boolean>(false)
  const [newKey, setNewKey] = useState<string>('')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async (): Promise<SettingsType | void> => {
    if (!window.electronAPI) {
      setError('Electron API not available. Make sure the preload script is loaded.')
      return
    }

    try {
      const result = await window.electronAPI.loadSettings()

      if (result.success && result.data) {
        setSettings(result.data as SettingsType)
      } else {
        setSettingsUpdated(false)
        setError(result.error || 'Unknown error occurred')
      }
    } catch (err) {
      setSettingsUpdated(false)
      setError(err instanceof Error ? err.message : 'Failed to search jobs')
    }
  }

  const updateKey = async (): Promise<void> => {
    if (!newKey) {
      return
    }

    if (!window.electronAPI) {
      setError('Electron API not available. Make sure the preload script is loaded.')
      return
    }

    try {
      const result = await window.electronAPI.updateSerpApiKey(newKey)

      if (result) {
        setError(null)
        setSettingsUpdated(true)
      } else {
        throw new Error('could not update SERP API key')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search jobs')
    }
  }

  return (
    <>
      {settingsUpdated && (
        <Alert>
          <CheckCircle2Icon />
          <AlertTitle>Success! Your changes have been saved</AlertTitle>
          <AlertDescription>New key is saved in your settings.</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <Terminal />
          <AlertTitle>Heads up!</AlertTitle>
          <AlertDescription>
            You can add components and dependencies to your app using the cli.
          </AlertDescription>
        </Alert>
      )}
      <Sheet>
        <SheetTrigger>
          <Button variant={'outline'}>
            <Settings />
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader className="mb-5">
            <SheetTitle>Application settings</SheetTitle>
            <SheetDescription>Add keys, update your preferences.</SheetDescription>
          </SheetHeader>
          <Separator />
          {settings && (
            <div className="mt-5">
              <div className="flex justify-between">
                <Label htmlFor="searchQuery">
                  <a href="https://serpapi.com/dashboard">SERP API key</a>
                </Label>
                <Badge>Remaining quota: {settings?.serpQuota}</Badge>
              </div>
              <Input
                id="searchQuery"
                type="text"
                onChange={(e) => setNewKey(e.target.value)}
                placeholder={settings?.secrets?.SERPAPI_KEY}
                className="mt-2"
                value={newKey}
              />

              <Button className="mt-5" variant={'secondary'} onClick={updateKey}>
                Update
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
