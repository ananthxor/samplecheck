import { useState } from 'react'
import { Monitor, Smartphone, Save, Loader2, Globe, EyeOff, ExternalLink, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { TemplateSize } from '@/features/templates/formats/registry'
import { CampaignFormDialog } from '@/features/campaigns/components/campaign-form-dialog'

interface CampaignOption {
  id: string
  name: string
}

interface EditorToolbarProps {
  onSave: () => void
  isSaving: boolean
  isDirty: boolean
  deviceMode: 'desktop' | 'mobile'
  onDeviceModeChange: (mode: 'desktop' | 'mobile') => void
  creativeName: string
  onNameChange: (name: string) => void
  formatId: string
  sizes: TemplateSize[]
  selectedSize: TemplateSize
  onSizeChange: (size: TemplateSize) => void
  /** Available campaigns for the current advertiser */
  campaigns: CampaignOption[]
  /** Currently selected campaign ID (null = none chosen) */
  campaignId: string | null
  /** Called when user picks a campaign */
  onCampaignChange: (id: string) => void
  /** Current published status of the creative */
  status: string
  /** Whether a publish/unpublish action is in progress */
  isPublishing: boolean
  /** Called to toggle between draft ↔ active. Undefined for new (unsaved) creatives. */
  onPublish?: () => void
  /** Full URL to open the live preview (only available when status === 'active'). */
  previewUrl?: string
  /** When true, shows a "Custom" option in the size dropdown with width/height inputs */
  customSizable?: boolean
}

/**
 * Top toolbar bar for the editor.
 * Contains creative name, campaign selector, format badge,
 * device toggle, size selector, and action buttons.
 */
export function EditorToolbar({
  onSave,
  isSaving,
  isDirty,
  deviceMode,
  onDeviceModeChange,
  creativeName,
  onNameChange,
  formatId,
  sizes,
  selectedSize,
  onSizeChange,
  campaigns,
  campaignId,
  onCampaignChange,
  status,
  isPublishing,
  onPublish,
  previewUrl,
  customSizable,
}: EditorToolbarProps) {
  const isActive = status === 'active'
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false)

  // Custom size state (only used when customSizable is true)
  const isPresetSize = sizes.some(
    (s) => s.width === selectedSize.width && s.height === selectedSize.height
  )
  const [isCustomMode, setIsCustomMode] = useState(!isPresetSize && customSizable)
  const [customWidth, setCustomWidth] = useState(selectedSize.width)
  const [customHeight, setCustomHeight] = useState(selectedSize.height)
  return (
    <div className="flex items-center justify-between gap-3 border-b bg-background px-4 py-2">
      {/* Left: Name + campaign selector + format badge */}
      <div className="flex items-center gap-2 min-w-0">
        <Input
          value={creativeName}
          onChange={(e) => onNameChange(e.target.value)}
          className="h-8 max-w-[200px] font-medium"
          placeholder="Creative name"
        />

        {/* Campaign selector — required field */}
        <Select
          value={campaignId ?? ''}
          onValueChange={onCampaignChange}
        >
          <SelectTrigger
            className={`h-8 w-[160px] ${!campaignId ? 'border-amber-400 text-amber-600 dark:border-amber-500 dark:text-amber-400' : ''}`}
            title={!campaignId ? 'Campaign is required before saving' : undefined}
          >
            <SelectValue placeholder="Select campaign" />
          </SelectTrigger>
          <SelectContent>
            {campaigns.length === 0 ? (
              <div className="px-2 py-3 text-center text-xs text-muted-foreground">
                No campaigns yet
              </div>
            ) : (
              campaigns.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => setCampaignDialogOpen(true)}
          title="Create new campaign"
        >
          <Plus />
        </Button>
        <CampaignFormDialog
          open={campaignDialogOpen}
          onOpenChange={setCampaignDialogOpen}
          onCreated={(created) => onCampaignChange(created.id)}
        />

        <Badge variant="secondary" className="shrink-0">
          {formatId}
        </Badge>
      </div>

      {/* Center: Device toggle + size selector */}
      <div className="flex items-center gap-2">
        <div className="flex rounded-md border">
          <Button
            type="button"
            variant={deviceMode === 'desktop' ? 'default' : 'ghost'}
            size="icon-sm"
            onClick={() => onDeviceModeChange('desktop')}
            title="Desktop preview"
            className="rounded-r-none"
          >
            <Monitor />
          </Button>
          <Button
            type="button"
            variant={deviceMode === 'mobile' ? 'default' : 'ghost'}
            size="icon-sm"
            onClick={() => onDeviceModeChange('mobile')}
            title="Mobile preview"
            className="rounded-l-none"
          >
            <Smartphone />
          </Button>
        </div>

        <Select
          value={isCustomMode ? 'custom' : `${selectedSize.width}x${selectedSize.height}`}
          onValueChange={(val) => {
            if (val === 'custom') {
              setIsCustomMode(true)
              setCustomWidth(selectedSize.width)
              setCustomHeight(selectedSize.height)
              return
            }
            setIsCustomMode(false)
            const size = sizes.find(
              (s) => `${s.width}x${s.height}` === val
            )
            if (size) onSizeChange(size)
          }}
        >
          <SelectTrigger className="h-8 w-[130px]">
            <SelectValue>
              {isCustomMode ? 'Custom' : `${selectedSize.width}×${selectedSize.height}`}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {sizes.map((size) => (
              <SelectItem
                key={`${size.width}x${size.height}`}
                value={`${size.width}x${size.height}`}
              >
                {size.label}
              </SelectItem>
            ))}
            {customSizable && (
              <SelectItem value="custom">Custom Size</SelectItem>
            )}
          </SelectContent>
        </Select>

        {customSizable && isCustomMode && (
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min={50}
              max={1920}
              value={customWidth}
              onChange={(e) => setCustomWidth(Number(e.target.value))}
              onBlur={() => {
                const w = Math.max(50, Math.min(1920, customWidth || 300))
                const h = Math.max(50, Math.min(1080, customHeight || 250))
                setCustomWidth(w)
                setCustomHeight(h)
                onSizeChange({ width: w, height: h, label: `${w}×${h}` })
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
              }}
              className="h-8 w-[70px] text-center text-xs"
              title="Width (50–1920)"
            />
            <span className="text-xs text-muted-foreground">×</span>
            <Input
              type="number"
              min={50}
              max={1080}
              value={customHeight}
              onChange={(e) => setCustomHeight(Number(e.target.value))}
              onBlur={() => {
                const w = Math.max(50, Math.min(1920, customWidth || 300))
                const h = Math.max(50, Math.min(1080, customHeight || 250))
                setCustomWidth(w)
                setCustomHeight(h)
                onSizeChange({ width: w, height: h, label: `${w}×${h}` })
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
              }}
              className="h-8 w-[70px] text-center text-xs"
              title="Height (50–1080)"
            />
          </div>
        )}
      </div>

      {/* Right: Status badge + Save + Publish */}
      <div className="flex items-center gap-2">
        {/* Status badge */}
        <Badge
          variant={isActive ? 'default' : 'secondary'}
          className={isActive ? 'bg-green-600 hover:bg-green-600 text-white' : ''}
        >
          {isActive ? 'Live' : 'Draft'}
        </Badge>

        <Button
          type="button"
          onClick={onSave}
          disabled={!isDirty || isSaving}
          size="sm"
          variant="outline"
        >
          {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
          {isDirty ? 'Save' : 'Saved'}
        </Button>

        {/* Publish / Unpublish */}
        <Button
          type="button"
          onClick={onPublish}
          disabled={isPublishing || !onPublish}
          size="sm"
          variant={isActive ? 'outline' : 'default'}
          title={!onPublish ? 'Save the creative first' : undefined}
        >
          {isPublishing ? (
            <Loader2 className="animate-spin" />
          ) : isActive ? (
            <EyeOff />
          ) : (
            <Globe />
          )}
          {isActive ? 'Unpublish' : 'Publish'}
        </Button>

        {/* Live preview — only when published */}
        {isActive && previewUrl && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            asChild
            title="Open live preview with real tracking"
          >
            <a href={previewUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink />
              Preview
            </a>
          </Button>
        )}
      </div>
    </div>
  )
}
