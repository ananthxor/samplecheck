import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Tables } from '@scrolltoday/shared'
import { SharePanel } from './share-panel'

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  creative: Tables<'creatives'>
}

export function ShareDialog({
  open,
  onOpenChange,
  creative,
}: ShareDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Share &amp; Embed</DialogTitle>
          <DialogDescription>
            Select a platform to get the correct ad tag. Download all platform tags as Excel.
          </DialogDescription>
        </DialogHeader>

        <SharePanel creative={creative} />
      </DialogContent>
    </Dialog>
  )
}
