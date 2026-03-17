import { useState, useMemo } from 'react'
import { Copy, Check, Download } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { generatePlatformTag } from '@/features/campaigns/lib/tag-generator'
import { PLATFORMS, DEFAULT_PLATFORM_ID, getPlatform } from '@/features/campaigns/lib/platform-macros'
import type { Tables } from '@scrolltoday/shared'
import { exportAllPlatformTags, exportSelectedPlatformTag } from '../lib/creatives-export'

interface PlatformTagPanelProps {
  creative: Pick<Tables<'creatives'>, 'id' | 'name' | 'width' | 'height' | 'bundle_url' | 'format_name' | 'status'>
}

/**
 * Reusable panel showing platform-specific embed codes with selector,
 * copy, and Excel download. Used in both the Share dialog and the editor.
 */
export function PlatformTagPanel({ creative }: PlatformTagPanelProps) {
  const [platformId, setPlatformId] = useState(DEFAULT_PLATFORM_ID)
  const [copied, setCopied] = useState(false)

  const selectedPlatform = getPlatform(platformId)!

  const embedTag = useMemo(() => {
    if (!creative.bundle_url) return ''
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

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(embedTag)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }

  if (!creative.bundle_url) {
    return (
      <div className="rounded-md border border-dashed p-4 text-center">
        <p className="text-sm text-muted-foreground">
          Publish the creative first to get platform-specific embed codes.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Platform selector + actions */}
      <div className="flex items-center gap-2">
        <Select value={platformId} onValueChange={setPlatformId}>
          <SelectTrigger className="w-[200px]">
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
          onClick={() => void handleCopy()}
          title="Copy embed tag"
        >
          {copied ? (
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
          title="Download selected platform tag"
        >
          <Download className="mr-1 size-4" />
          Download
        </Button>
      </div>

      {/* Embed code */}
      <Textarea
        readOnly
        value={embedTag}
        rows={6}
        className="font-mono text-xs resize-none break-all [field-sizing:fixed]"
      />

      {/* Download all */}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => exportAllPlatformTags(creative as Tables<'creatives'>)}
      >
        <Download className="mr-2 size-4" />
        Download All Platform Tags (Excel)
      </Button>
    </div>
  )
}
