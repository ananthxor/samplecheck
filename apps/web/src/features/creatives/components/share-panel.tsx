import { useState, useEffect, useMemo } from 'react'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { Copy, Check, Link2, Code2, CreditCard, Download } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Tables } from '@scrolltoday/shared'
import { updateCreative } from '../api/creatives-api'
import { useCreative } from '../hooks/use-creatives'
import { generatePlatformTag } from '@/features/campaigns/lib/tag-generator'
import { PLATFORMS, DEFAULT_PLATFORM_ID, getPlatform } from '@/features/campaigns/lib/platform-macros'
import { exportAllPlatformTags, exportSelectedPlatformTag } from '../lib/creatives-export'
import { fetchCreditBalance } from '@/features/billing/api/billing-api'
import { supabase } from '@/lib/supabase'

const SERVE_BASE = (import.meta.env.VITE_SERVE_BASE_URL as string | undefined) ?? ''

function getPreviewUrl(token: string): string {
  const cdnBase = import.meta.env.VITE_CDN_BASE_URL as string | undefined
  if (cdnBase) return `${cdnBase.replace(/\/$/, '')}/preview/${token}.html`
  return `${window.location.origin}/preview/${token}`
}

async function uploadPreviewToStorage(token: string, renderedHtml: string): Promise<void> {
  const noTrackScript = '<script>window.initStandardTracking=function(){};</script>'
  const html = renderedHtml.includes('<head>')
    ? renderedHtml.replace('<head>', '<head>' + noTrackScript)
    : renderedHtml
  const { error } = await supabase.storage
    .from('previews')
    .upload(`${token}.html`, new Blob([html], { type: 'text/html' }), {
      upsert: true,
      cacheControl: '3600',
    })
  if (error) throw new Error(`Preview upload failed: ${error.message}`)
}

function generateFallbackTag(creative: { id: string; width: number | null; height: number | null }): string {
  const w = creative.width ?? 300
  const h = creative.height ?? 250
  return `<script src="${SERVE_BASE}/serve-ad?id=${creative.id}&w=${w}&h=${h}&cb=%%CACHEBUSTER%%"></script>`
}

interface SharePanelProps {
  creative: Pick<Tables<'creatives'>,
    'id' | 'name' | 'width' | 'height' | 'bundle_url' | 'format_name' | 'status' | 'advertiser_id'>
}

/**
 * Reusable share & embed panel showing platform embed codes, Excel download,
 * and preview link generation. Used inline in the editor Embed tab and
 * wrapped in a Dialog for the creatives list.
 */
export function SharePanel({ creative }: SharePanelProps) {
  const queryClient = useQueryClient()

  // Fetch full creative for preview_token and rendered_html
  const { data: fullCreative } = useCreative(creative.id)

  // Local token set after generating a new link (takes precedence until cache refreshes)
  const [localToken, setLocalToken] = useState<string | null>(null)
  const [copiedEmbed, setCopiedEmbed] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [platformId, setPlatformId] = useState(DEFAULT_PLATFORM_ID)

  const { data: creditBalance } = useQuery({
    queryKey: ['credit-balance', creative.advertiser_id],
    queryFn: () => fetchCreditBalance(creative.advertiser_id!),
    enabled: !!creative.advertiser_id,
    staleTime: 60 * 1000,
  })
  const hasCredits = creditBalance === undefined || creditBalance > 0

  const token = localToken ?? fullCreative?.preview_token ?? null

  // Reset copied states when creative changes
  useEffect(() => {
    setCopiedEmbed(false)
    setCopiedLink(false)
    setLocalToken(null)
  }, [creative.id])

  // Re-sync preview HTML to storage when token exists
  useEffect(() => {
    if (!token || !fullCreative?.rendered_html) return
    void uploadPreviewToStorage(token, fullCreative.rendered_html as string)
  }, [token, fullCreative?.rendered_html])

  const selectedPlatform = getPlatform(platformId)!

  const embedTag = useMemo(() => {
    if (!creative.bundle_url) return generateFallbackTag(creative)
    return generatePlatformTag(
      {
        bundleUrl: creative.bundle_url,
        creativeId: creative.id,
        width: creative.width ?? 300,
        height: creative.height ?? 250,
      },
      selectedPlatform
    )
  }, [creative, selectedPlatform])

  const previewUrl = token ? getPreviewUrl(token) : null

  async function handleCopy(text: string, setter: (v: boolean) => void) {
    try {
      await navigator.clipboard.writeText(text)
      setter(true)
      setTimeout(() => setter(false), 2000)
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }

  async function handleGenerateLink() {
    const renderedHtml = fullCreative?.rendered_html as string | undefined
    if (!renderedHtml) {
      toast.error('Save the creative first before generating a preview link.')
      return
    }
    setIsGenerating(true)
    try {
      const newToken = crypto.randomUUID()
      await uploadPreviewToStorage(newToken, renderedHtml)
      await updateCreative(creative.id, { preview_token: newToken })
      setLocalToken(newToken)
      void queryClient.invalidateQueries({ queryKey: ['creatives'] })
      toast.success('Preview link generated')
    } catch (err) {
      toast.error(
        `Failed to generate link: ${err instanceof Error ? err.message : 'Unknown error'}`
      )
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* ── Platform Embed Code ────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Code2 className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Platform Embed Code</span>
          <span className="ml-auto text-xs text-muted-foreground">
            {creative.width ?? 300}&times;{creative.height ?? 250}
          </span>
        </div>

        {hasCredits ? (
          <>
            {/* Platform selector + copy + download */}
            <div className="flex items-center gap-2">
              <Select value={platformId} onValueChange={setPlatformId}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => void handleCopy(embedTag, setCopiedEmbed)}
                title="Copy embed tag"
              >
                {copiedEmbed ? (
                  <Check className="size-4 text-green-600" />
                ) : (
                  <Copy className="size-4" />
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => exportSelectedPlatformTag(creative as Tables<'creatives'>, selectedPlatform)}
                title="Download selected platform tag as Excel"
              >
                <Download className="mr-1 size-4" />
                Download
              </Button>
            </div>

            {/* Embed code display */}
            <Textarea
              readOnly
              value={embedTag}
              rows={6}
              className="font-mono text-xs resize-none break-all [field-sizing:fixed]"
            />

            <p className="text-xs text-muted-foreground">
              Paste into your ad platform. Creative must be published (active) to serve.
            </p>
          </>
        ) : (
          <div className="rounded-md border border-dashed p-4 text-center">
            <CreditCard className="mx-auto mb-2 size-5 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">No impression credits</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Purchase credits to unlock the embed tag and serve this ad.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-3">
              <a href="/billing">Buy Credits</a>
            </Button>
          </div>
        )}
      </div>

      {/* ── Download All Tags ──────────────────────────────── */}
      {hasCredits && (
        <div>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => exportAllPlatformTags(creative as Tables<'creatives'>)}
          >
            <Download className="mr-2 size-4" />
            Download All Platform Tags (Excel)
          </Button>
          <p className="mt-1 text-xs text-muted-foreground">
            Exports embed codes for all {PLATFORMS.length} platforms in one Excel file.
          </p>
        </div>
      )}

      {/* ── Preview Link ──────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Link2 className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Preview Link</span>
        </div>

        {previewUrl ? (
          <div className="flex items-center gap-2">
            <Input readOnly value={previewUrl} className="text-sm" />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => void handleCopy(previewUrl, setCopiedLink)}
              title="Copy preview link"
            >
              {copiedLink ? (
                <Check className="size-4 text-green-600" />
              ) : (
                <Copy className="size-4" />
              )}
              <span className="sr-only">Copy link</span>
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => void handleGenerateLink()}
            disabled={isGenerating}
            variant="outline"
            className="w-full"
          >
            <Link2 className="mr-2 size-4" />
            {isGenerating ? 'Generating...' : 'Generate Preview Link'}
          </Button>
        )}
        <p className="text-xs text-muted-foreground">
          Share this URL with anyone to preview the creative without logging in.
        </p>
      </div>
    </div>
  )
}
