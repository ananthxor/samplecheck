import type { TemplateConfig, TemplateSize } from '@/features/templates/formats/registry'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable'
import { EditorToolbar } from './editor-toolbar'
import { EditorForm } from './editor-form'
import { EditorPreview } from './editor-preview'

interface CampaignOption {
  id: string
  name: string
}

interface EditorLayoutProps {
  config: TemplateConfig
  onConfigChange: (config: TemplateConfig) => void
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
  campaigns: CampaignOption[]
  campaignId: string | null
  onCampaignChange: (id: string) => void
  creativeId: string
  status: string
  isPublishing: boolean
  onPublish?: () => void
  previewUrl?: string
  /** Advertiser ID for the current creative */
  advertiserId: string | null
  /** Creative metadata for the Embed tab (null for unsaved creatives) */
  creativeMeta?: {
    name: string
    width: number | null
    height: number | null
    bundle_url: string | null
    format_name: string
    status: 'draft' | 'active' | 'paused' | 'archived'
  }
  /** When true, the editor toolbar shows a "Custom" size option with width/height inputs */
  customSizable?: boolean
}

/**
 * Main editor layout with toolbar, resizable split-pane form and preview.
 */
export function EditorLayout({
  config,
  onConfigChange,
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
  creativeId,
  status,
  isPublishing,
  onPublish,
  previewUrl,
  advertiserId,
  creativeMeta,
  customSizable,
}: EditorLayoutProps) {
  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))] min-w-0 w-full flex-col">
      <EditorToolbar
        onSave={onSave}
        isSaving={isSaving}
        isDirty={isDirty}
        deviceMode={deviceMode}
        onDeviceModeChange={onDeviceModeChange}
        creativeName={creativeName}
        onNameChange={onNameChange}
        formatId={formatId}
        sizes={sizes}
        selectedSize={selectedSize}
        onSizeChange={onSizeChange}
        campaigns={campaigns}
        campaignId={campaignId}
        onCampaignChange={onCampaignChange}
        status={status}
        isPublishing={isPublishing}
        onPublish={onPublish}
        previewUrl={previewUrl}
        customSizable={customSizable}
      />

      <ResizablePanelGroup orientation="horizontal" className="min-w-0 flex-1">
        <ResizablePanel defaultSize="40%" minSize="25%" maxSize="55%">
          <EditorForm
            config={config}
            onChange={onConfigChange}
            creativeId={creativeId}
            advertiserId={advertiserId}
            creativeMeta={creativeMeta}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize="60%" minSize="35%">
          <EditorPreview
            config={config}
            deviceMode={deviceMode}
            width={selectedSize.width || undefined}
            height={selectedSize.height || undefined}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
