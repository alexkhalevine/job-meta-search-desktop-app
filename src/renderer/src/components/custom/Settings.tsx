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

export const SettingsComponent = (): JSX.Element => {
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
        <div className="mt-5">
          <Label htmlFor="searchQuery">
            <a href="https://serpapi.com/dashboard">SERP API key</a>
          </Label>
          <Input
            id="searchQuery"
            type="text"
            onChange={onChangeSerpApiKey}
            placeholder="Enter here your key"
            className="mt-2"
          />
          <Button className="mt-5" variant={'secondary'}>
            Update
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
