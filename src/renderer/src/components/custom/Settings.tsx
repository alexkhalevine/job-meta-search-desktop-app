import { Settings } from 'lucide-react'
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

type SettingsType = {
  secrets?: {
    SERPAPI_KEY: string
  }
  serpQuota?: number
}

export const SettingsComponent = (): JSX.Element => {
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettings] = useState<SettingsType>()

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async (): Promise<SettingsType | any> => {
    if (!window.electronAPI) {
      setError('Electron API not available. Make sure the preload script is loaded.')
      return
    }

    try {
      const result = await window.electronAPI.loadSettings()

      if (result.success && result.data) {
        setSettings(result.data as SettingsType)
      } else {
        setError(result.error || 'Unknown error occurred')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search jobs')
    }
  }

  const onChangeSerpApiKey = () => {}
  return (
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
              onChange={onChangeSerpApiKey}
              placeholder={settings?.secrets?.SERPAPI_KEY}
              className="mt-2"
            />

            <Button className="mt-5" variant={'secondary'}>
              Update
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
