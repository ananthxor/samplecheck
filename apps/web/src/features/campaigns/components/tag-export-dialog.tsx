import { useState } from 'react'
import { Copy, Check, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { generateDfpTag, generateEmbedTag, generateCdnTag, getServeBaseUrl } from '../lib/tag-generator'
import type { Tables } from '@scrolltoday/shared'

interface TagExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  creative: Tables<'creatives'>
}

export function TagExportDialog({
  open,
  onOpenChange,
  creative,
}: TagExportDialogProps) {
  const [copiedTab, setCopiedTab] = useState<string | null>(null)

  const width = creative.width ?? 300
  const height = creative.height ?? 250
  const serveBaseUrl = getServeBaseUrl()

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

  const cdnTag = creative.bundle_url
    ? generateCdnTag({
        bundleUrl: creative.bundle_url,
        creativeId: creative.id,
        width,
        height,
      })
    : null

  async function handleCopy(text: string, tab: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedTab(tab)
      setTimeout(() => setCopiedTab(null), 2000)
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Export Ad Tag</DialogTitle>
          <DialogDescription>
            Copy the ad tag for "{creative.name}" ({width}&times;{height})
          </DialogDescription>
        </DialogHeader>

        {creative.status === 'paused' && (
          <div className="flex items-start gap-2 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-900 dark:bg-yellow-950 dark:text-yellow-200">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>
              This creative is currently paused. The tag will not serve ads
              until the creative is set to Active.
            </span>
          </div>
        )}

        <Tabs defaultValue={cdnTag ? 'cdn' : 'dfp'}>
          <TabsList className="w-full">
            {cdnTag && (
              <TabsTrigger value="cdn" className="flex-1">
                CDN Tag
              </TabsTrigger>
            )}
            <TabsTrigger value="dfp" className="flex-1">
              DFP/GAM Tag
            </TabsTrigger>
            <TabsTrigger value="embed" className="flex-1">
              Embed Code
            </TabsTrigger>
          </TabsList>

          {cdnTag && (
            <TabsContent value="cdn" className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Recommended for GAM and any publisher. Self-contained bundle — tracking works from any domain, no server roundtrip on serve.
              </p>
              <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs font-mono whitespace-pre-wrap break-all">
                {cdnTag}
              </pre>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => handleCopy(cdnTag, 'cdn')}
              >
                {copiedTab === 'cdn' ? (
                  <Check className="mr-2 size-4 text-green-600" />
                ) : (
                  <Copy className="mr-2 size-4" />
                )}
                {copiedTab === 'cdn' ? 'Copied!' : 'Copy CDN Tag'}
              </Button>
            </TabsContent>
          )}

          <TabsContent value="dfp" className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Paste this tag into Google Ad Manager as a third-party creative.
            </p>
            <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs font-mono whitespace-pre-wrap break-all">
              {dfpTag}
            </pre>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => handleCopy(dfpTag, 'dfp')}
            >
              {copiedTab === 'dfp' ? (
                <Check className="mr-2 size-4 text-green-600" />
              ) : (
                <Copy className="mr-2 size-4" />
              )}
              {copiedTab === 'dfp' ? 'Copied!' : 'Copy DFP/GAM Tag'}
            </Button>
          </TabsContent>

          <TabsContent value="embed" className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Add this code directly to any webpage to display the ad.
            </p>
            <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs font-mono whitespace-pre-wrap break-all">
              {embedTag}
            </pre>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => handleCopy(embedTag, 'embed')}
            >
              {copiedTab === 'embed' ? (
                <Check className="mr-2 size-4 text-green-600" />
              ) : (
                <Copy className="mr-2 size-4" />
              )}
              {copiedTab === 'embed' ? 'Copied!' : 'Copy Embed Code'}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
