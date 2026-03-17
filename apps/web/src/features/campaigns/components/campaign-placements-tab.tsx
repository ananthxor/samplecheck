import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { StatusBadge } from './status-badge'
import {
  generateDfpTag,
  generateEmbedTag,
  getServeBaseUrl,
} from '../lib/tag-generator'
import type { Tables } from '@scrolltoday/shared'

interface CampaignPlacementsTabProps {
  campaignId: string
  creatives: Tables<'creatives'>[]
}

export function CampaignPlacementsTab({
  creatives,
}: CampaignPlacementsTabProps) {
  const [copied, setCopied] = useState<string | null>(null)
  const serveBaseUrl = getServeBaseUrl()

  async function handleCopy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }

  if (creatives.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
        <p className="text-sm text-muted-foreground">
          No creatives assigned to this campaign yet.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {creatives.length} creative(s) assigned. Copy ad tags for active or
        paused creatives.
      </p>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Creative</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">DFP/GAM Tag</th>
              <th className="px-4 py-3 text-left font-medium">Embed Code</th>
            </tr>
          </thead>
          <tbody>
            {creatives.map((creative) => {
              const width = creative.width ?? 300
              const height = creative.height ?? 250
              const dfpTag = generateDfpTag({
                creativeId: creative.id,
                width,
                height,
                serveBaseUrl,
              })
              const embedTag = generateEmbedTag({
                creativeId: creative.id,
                width,
                height,
                serveBaseUrl,
              })
              const canCopy =
                creative.status === 'active' || creative.status === 'paused'

              return (
                <tr key={creative.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3">
                    <div className="max-w-[240px]">
                      <p className="truncate font-medium">{creative.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {creative.format_name}
                        {creative.width && creative.height && (
                          <span>
                            {' '}
                            &middot; {creative.width}&times;{creative.height}
                          </span>
                        )}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={creative.status} />
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!canCopy}
                      title={
                        !canCopy
                          ? 'Activate this creative to enable tag export'
                          : undefined
                      }
                      onClick={() =>
                        handleCopy(dfpTag, creative.id + '-dfp')
                      }
                    >
                      {copied === creative.id + '-dfp' ? (
                        <Check className="mr-1 size-3.5 text-green-600" />
                      ) : (
                        <Copy className="mr-1 size-3.5" />
                      )}
                      {copied === creative.id + '-dfp' ? 'Copied!' : 'DFP'}
                    </Button>
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!canCopy}
                      title={
                        !canCopy
                          ? 'Activate this creative to enable tag export'
                          : undefined
                      }
                      onClick={() =>
                        handleCopy(embedTag, creative.id + '-embed')
                      }
                    >
                      {copied === creative.id + '-embed' ? (
                        <Check className="mr-1 size-3.5 text-green-600" />
                      ) : (
                        <Copy className="mr-1 size-3.5" />
                      )}
                      {copied === creative.id + '-embed' ? 'Copied!' : 'Embed'}
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
