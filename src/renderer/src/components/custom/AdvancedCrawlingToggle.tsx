import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { SettingsType } from './Settings'

interface AdvancedCrawlingToggleProps {
  onError: (error: string) => void
}

export const AdvancedCrawlingToggle = ({ onError }: AdvancedCrawlingToggleProps): JSX.Element => {
  const [advancedCrawlingEnabled, setAdvancedCrawlingEnabled] = useState(false)

  const handleAdvancedCrawlingToggle = async (checked: boolean): Promise<void> => {
    try {
      const result = await window.electronAPI.updateSettingsAdvancedCrawling(checked)

      if (result) {
        setAdvancedCrawlingEnabled(checked)
      } else {
        onError(`Failed to update advanced crawling setting: ${result}`)
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to update advanced crawling setting')
    }
  }

  const fetchSettings = async (): Promise<void> => {
    if (!window.electronAPI) {
      onError('Electron API not available. Make sure the preload script is loaded.')
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
      onError(err instanceof Error ? err.message : 'Failed to load settings')
      console.error('Settings loading error:', err)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  return (
    <div className="border border-slate-200 dark:border-slate-900 rounded-lg p-6 bg-background w-[600px]">
      <p className="text-sm mb-5 text-secondary font-bold">More filters</p>

      <Label className="flex items-center justify-between w-full">
        <Tooltip>
          <TooltipTrigger>Advanced search</TooltipTrigger>
          <TooltipContent>
            <p>Search complex pages, like jobs.wien.gv.at. Makes search slower</p>
          </TooltipContent>
        </Tooltip>
        <Switch
          id="enable-advanced-crawling-switch"
          checked={advancedCrawlingEnabled}
          onCheckedChange={handleAdvancedCrawlingToggle}
        />
      </Label>
    </div>
  )
}
