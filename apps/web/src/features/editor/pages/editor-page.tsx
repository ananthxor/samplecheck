import { useCallback, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import type { Json } from '@scrolltoday/shared'
import { useAuth } from '@/hooks/use-auth'
import { getTemplateById, getFormat } from '@/features/templates/formats/registry'
import type { TemplateSize, TemplateConfig } from '@/features/templates/formats/registry'
import { AD_TYPES } from '@/features/dashboard/data/ad-types'
import { useCreative, useCreateCreative, useUpdateCreative } from '@/features/creatives/hooks/use-creatives'
import { useCampaigns } from '@/features/campaigns/hooks/use-campaigns'
import { useEditorState } from '../hooks/use-editor-state'
import { EditorLayout } from '../components/editor-layout'
import { generatePreviewHtml } from '../lib/renderer'
import { generateCdnBundle, getBundleUrl } from '../lib/bundle-generator'
import { supabase } from '@/lib/supabase'

/**
 * Editor page component.
 * Route: /creatives/new?template={templateId} (new) or /creatives/:id/edit (edit existing)
 */
export default function EditorPage() {
  const navigate = useNavigate()
  const { id: editId } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const templateId = searchParams.get('template')
  const { activeAdvertiserId } = useAuth()

  const isEditMode = !!editId
  const { data: existingCreative, isLoading: isLoadingCreative } = useCreative(editId)

  // Resolve template for new creative mode
  const template = useMemo(() => {
    if (isEditMode) return null
    if (!templateId) return null
    return getTemplateById(templateId)
  }, [isEditMode, templateId])

  // Determine initial config
  const initialConfig = useMemo((): TemplateConfig | null => {
    if (isEditMode && existingCreative) {
      return existingCreative.template_data as unknown as TemplateConfig
    }
    if (template) {
      return template.defaultConfig
    }
    return null
  }, [isEditMode, existingCreative, template])

  // Generate stable temporary creative ID for new creatives (used for image uploads)
  const [tempCreativeId] = useState(() => crypto.randomUUID())
  const creativeId = editId ?? tempCreativeId

  // Available sizes
  const sizes = useMemo((): TemplateSize[] => {
    if (isEditMode && existingCreative) {
      const w = existingCreative.width ?? 300
      const h = existingCreative.height ?? 250
      const savedSize = { width: w, height: h, label: `${w}×${h}` }

      // For customSizable formats, include preset sizes from the format definition
      const formatType = (existingCreative.template_data as Record<string, unknown>)?.type as string | undefined
      const fmt = formatType ? getFormat(formatType) : undefined
      if (fmt?.customSizable && fmt.templates[0]?.sizes) {
        const presets = fmt.templates[0].sizes
        // Include saved size if it's not already in presets
        const alreadyInPresets = presets.some((s) => s.width === w && s.height === h)
        return alreadyInPresets ? presets : [savedSize, ...presets]
      }

      return [savedSize]
    }
    if (template) {
      return template.sizes
    }
    return [{ width: 300, height: 250, label: '300x250' }]
  }, [isEditMode, existingCreative, template])

  // Creative name
  const [creativeName, setCreativeName] = useState('')

  // Wait for data before rendering editor
  if (isEditMode && isLoadingCreative) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-muted-foreground">
        Loading creative...
      </div>
    )
  }

  if (!initialConfig) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <p className="text-lg font-medium">Template not found</p>
        <p className="text-sm text-muted-foreground">
          The requested template does not exist or could not be loaded.
        </p>
        <button
          className="text-sm text-primary underline"
          onClick={() => void navigate('/creatives')}
        >
          Back to templates
        </button>
      </div>
    )
  }

  return (
    <EditorPageInner
      initialConfig={initialConfig}
      creativeId={creativeId}
      editId={editId}
      sizes={sizes}
      initialName={
        isEditMode && existingCreative
          ? existingCreative.name
          : template?.name ?? 'Untitled Creative'
      }
      initialStatus={
        isEditMode && existingCreative ? (existingCreative.status ?? 'draft') : 'draft'
      }
      initialCampaignId={
        isEditMode && existingCreative ? (existingCreative.campaign_id ?? null) : null
      }
      creativeName={creativeName}
      setCreativeName={setCreativeName}
      advertiserId={activeAdvertiserId}
      initialBundleUrl={
        isEditMode && existingCreative ? (existingCreative.bundle_url ?? null) : null
      }
      initialFormatName={
        isEditMode && existingCreative
          ? existingCreative.format_name
          : template?.name ?? 'Unknown'
      }
    />
  )
}

// ---------------------------------------------------------------------------
// Inner component that has guaranteed initialConfig
// ---------------------------------------------------------------------------

function EditorPageInner({
  initialConfig,
  creativeId,
  editId,
  sizes,
  initialName,
  initialStatus,
  initialCampaignId,
  creativeName,
  setCreativeName,
  advertiserId,
  initialBundleUrl,
  initialFormatName: _initialFormatName,
}: {
  initialConfig: TemplateConfig
  creativeId: string
  editId: string | undefined
  sizes: TemplateSize[]
  initialName: string
  initialStatus: string
  initialCampaignId: string | null
  creativeName: string
  setCreativeName: (name: string) => void
  advertiserId: string | null
  initialBundleUrl: string | null
  initialFormatName: string
}) {
  const navigate = useNavigate()
  const createCreative = useCreateCreative()
  const updateCreative = useUpdateCreative()

  // Campaigns for the dropdown — scoped to the active advertiser
  const { data: campaignsData } = useCampaigns(advertiserId ?? undefined)
  const campaigns = useMemo(
    () => (campaignsData ?? []).map((c) => ({ id: c.id, name: c.name })),
    [campaignsData]
  )

  const {
    config,
    updateConfig,
    isDirty,
    isSaving,
    setIsSaving,
    selectedSize,
    setSelectedSize,
    resetDirty,
  } = useEditorState(initialConfig, editId)

  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop')
  const [creativeStatus, setCreativeStatus] = useState(initialStatus)
  const [isPublishing, setIsPublishing] = useState(false)
  const [campaignId, setCampaignId] = useState<string | null>(initialCampaignId)
  const [bundleUrl, setBundleUrl] = useState<string | null>(initialBundleUrl)

  // Derive customSizable flag from the format definition
  const formatDef = useMemo(() => getFormat(initialConfig.type), [initialConfig.type])
  const customSizable = formatDef?.customSizable ?? false

  // Set initial name and size once
  const [initialized, setInitialized] = useState(false)
  if (!initialized) {
    if (!creativeName) setCreativeName(initialName)
    if (sizes[0]) {
      setSelectedSize({ width: sizes[0].width, height: sizes[0].height })
    }
    setInitialized(true)
  }

  const displayName = creativeName || initialName

  // Look up format_name from AD_TYPES
  const formatName = useMemo(() => {
    for (const adType of AD_TYPES) {
      const format = adType.formats.find((f) => f.id === config.type)
      if (format) return format.name
    }
    return config.type
  }, [config.type])

  const handleSave = useCallback(async () => {
    if (!advertiserId) {
      toast.error('No advertiser account found. Cannot save creative.')
      return
    }

    if (!campaignId) {
      toast.error('Please select a campaign before saving.')
      return
    }

    setIsSaving(true)

    try {
      // Generate pre-rendered HTML for ad serving (avoids duplicating renderers in Edge Functions)
      const renderedHtml = generatePreviewHtml(config)

      if (editId) {
        // Update existing creative
        const updated = await updateCreative.mutateAsync({
          id: editId,
          updates: {
            name: displayName,
            campaign_id: campaignId,
            template_data: config as unknown as Json,
            rendered_html: renderedHtml,
            width: selectedSize.width || null,
            height: selectedSize.height || null,
          },
        })
        // If a preview link exists, keep the storage file in sync so the link
        // always reflects the latest saved version (fire-and-forget).
        if (updated.preview_token) {
          const noTrackScript = '<script>window.initStandardTracking=function(){};</script>'
          const previewHtml = renderedHtml.includes('<head>')
            ? renderedHtml.replace('<head>', '<head>' + noTrackScript)
            : renderedHtml
          void supabase.storage
            .from('previews')
            .upload(`${updated.preview_token}.html`, new Blob([previewHtml], { type: 'text/html' }), {
              upsert: true,
              cacheControl: '3600',
            })
            .then(({ error }) => {
              if (error) console.warn('Preview file sync failed:', error.message)
            })
        }
        toast.success('Creative saved')
        resetDirty()
      } else {
        // Create new creative
        const created = await createCreative.mutateAsync({
          advertiser_id: advertiserId,
          campaign_id: campaignId,
          name: displayName,
          format_id: config.type,
          format_name: formatName,
          template_data: config as unknown as Json,
          rendered_html: renderedHtml,
          width: selectedSize.width || null,
          height: selectedSize.height || null,
          status: 'draft',
        })
        toast.success('Creative saved')
        // Navigate to edit URL with real ID
        void navigate(`/creatives/${created.id}/edit`, { replace: true })
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to save creative'
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }, [
    advertiserId,
    campaignId,
    config,
    createCreative,
    displayName,
    editId,
    formatName,
    navigate,
    resetDirty,
    selectedSize,
    setIsSaving,
    updateCreative,
  ])

  const handlePublish = useCallback(async () => {
    if (!editId || !advertiserId) return
    setIsPublishing(true)
    try {
      const nextStatus = creativeStatus === 'active' ? 'draft' : 'active'

      // Enrich config with tracking IDs so the CDN bundle has them baked in.
      // (serve-ad injects __ST_SERVE_CONFIG__ at runtime, but CDN bundles are fully static.)
      const configForRender = {
        ...config,
        id: editId,
        advertiserId: advertiserId ?? '',
        campaignId: campaignId ?? '',
      }
      const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) ?? ''
      const trackUrl = supabaseUrl ? `${supabaseUrl}/functions/v1/track-event` : ''
      const renderedHtml = generatePreviewHtml(configForRender, trackUrl)

      // Upload CDN bundle when publishing (active). Clear it when unpublishing.
      let bundleUrl: string | null = null
      if (nextStatus === 'active') {
        const bundleJs = generateCdnBundle({
          renderedHtml,
          width: selectedSize.width || 300,
          height: selectedSize.height || 250,
        })
        const { error: uploadError } = await supabase.storage
          .from('ad-bundles')
          .upload(`${editId}.js`, new Blob([bundleJs], { type: 'application/javascript' }), {
            upsert: true,
            cacheControl: '3600',
          })
        if (uploadError) throw new Error(`Bundle upload failed: ${uploadError.message}`)
        bundleUrl = getBundleUrl(editId)
      }

      await updateCreative.mutateAsync({
        id: editId,
        updates: {
          name: displayName,
          template_data: config as unknown as Json,
          rendered_html: renderedHtml,
          bundle_url: bundleUrl,
          width: selectedSize.width || null,
          height: selectedSize.height || null,
          status: nextStatus,
        },
      })
      setCreativeStatus(nextStatus)
      setBundleUrl(bundleUrl)
      resetDirty()
      toast.success(
        nextStatus === 'active'
          ? 'Creative published — CDN bundle generated.'
          : 'Creative unpublished and set to draft.'
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update status'
      toast.error(message)
    } finally {
      setIsPublishing(false)
    }
  }, [
    editId,
    advertiserId,
    config,
    creativeStatus,
    displayName,
    selectedSize,
    updateCreative,
    resetDirty,
  ])

  // Preview URL — only available for saved, published creatives
  const previewUrl =
    editId && creativeStatus === 'active'
      ? `/test-ad.html?cid=${editId}&w=${selectedSize.width}&h=${selectedSize.height}`
      : undefined

  const handleConfigChange = useCallback(
    (newConfig: TemplateConfig) => {
      updateConfig(newConfig)
    },
    [updateConfig]
  )

  const handleSizeChange = useCallback(
    (size: TemplateSize) => {
      setSelectedSize({ width: size.width, height: size.height })
    },
    [setSelectedSize]
  )

  return (
    <EditorLayout
      config={config}
      onConfigChange={handleConfigChange}
      onSave={() => void handleSave()}
      isSaving={isSaving}
      isDirty={isDirty}
      deviceMode={deviceMode}
      onDeviceModeChange={setDeviceMode}
      creativeName={displayName}
      onNameChange={setCreativeName}
      formatId={config.type}
      sizes={sizes}
      selectedSize={
        sizes.find(
          (s) =>
            s.width === selectedSize.width && s.height === selectedSize.height
        ) ?? (customSizable
          ? { width: selectedSize.width, height: selectedSize.height, label: `${selectedSize.width}×${selectedSize.height}` }
          : sizes[0] ?? { width: 300, height: 250, label: '300x250' })
      }
      onSizeChange={handleSizeChange}
      campaigns={campaigns}
      campaignId={campaignId}
      onCampaignChange={setCampaignId}
      creativeId={creativeId}
      status={creativeStatus}
      isPublishing={isPublishing}
      onPublish={editId ? () => void handlePublish() : undefined}
      previewUrl={previewUrl}
      advertiserId={advertiserId}
      customSizable={customSizable}
      creativeMeta={editId ? {
        name: displayName,
        width: selectedSize.width || null,
        height: selectedSize.height || null,
        bundle_url: bundleUrl,
        format_name: formatName,
        status: creativeStatus as 'draft' | 'active' | 'paused' | 'archived',
      } : undefined}
    />
  )
}
