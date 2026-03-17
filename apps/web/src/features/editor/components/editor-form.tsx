import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { TemplateConfig } from '@/features/templates/formats/registry'
import { getConfigSchemaForFormat, getFormat } from '@/features/templates/formats/registry'
import { Form } from '@/components/ui/form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DynamicFormFields } from './dynamic-form-fields'
import { SharePanel } from '@/features/creatives/components/share-panel'

interface EditorFormProps {
  config: TemplateConfig
  onChange: (config: TemplateConfig) => void
  creativeId: string
  /** Advertiser ID for credit checks in the Share panel */
  advertiserId: string | null
  /** Creative metadata needed for embed code generation in the Embed tab */
  creativeMeta?: {
    name: string
    width: number | null
    height: number | null
    bundle_url: string | null
    format_name: string
    status: 'draft' | 'active' | 'paused' | 'archived'
  }
}

/**
 * Left panel of the editor with a tabbed form for customizing the template.
 * Uses react-hook-form + zod for validation, with format-specific field sets
 * driven by the modular FormatDefinition system.
 */
export function EditorForm({ config, onChange, creativeId, advertiserId, creativeMeta }: EditorFormProps) {
  const schema = getConfigSchemaForFormat(config.type)
  const format = getFormat(config.type)

  const form = useForm<TemplateConfig>({
    resolver: zodResolver(schema) as unknown as Resolver<TemplateConfig>,
    defaultValues: config,
    mode: 'onChange',
  })

  // Skip the first immediate fire from form.watch — it fires on subscription
  // before the user has made any change, causing an unnecessary parent state
  // update that can race with the iframe's postMessage listener not yet being
  // registered.
  const isFirstWatch = useRef(true)

  // Propagate form changes to parent on every value change
  useEffect(() => {
    const subscription = form.watch((values) => {
      if (isFirstWatch.current) {
        isFirstWatch.current = false
        return
      }
      if (values && values.type) {
        onChange(values as TemplateConfig)
      }
    })
    return () => subscription.unsubscribe()
  }, [form, onChange])

  const fields = format?.fields ?? []

  return (
    <div className="h-full min-w-0 overflow-y-auto overflow-x-hidden p-4">
      <Form {...form}>
        <form className="space-y-4">
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="content" className="flex-1">
                Content
              </TabsTrigger>
              <TabsTrigger value="style" className="flex-1">
                Style
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex-1">
                Settings
              </TabsTrigger>
              <TabsTrigger value="embed" className="flex-1">
                Embed
              </TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4 pt-4">
              <DynamicFormFields
                fields={fields}
                tab="content"
                creativeId={creativeId}
              />
            </TabsContent>

            <TabsContent value="style" className="space-y-4 pt-4">
              <DynamicFormFields
                fields={fields}
                tab="style"
                creativeId={creativeId}
              />
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 pt-4">
              <DynamicFormFields
                fields={fields}
                tab="settings"
                creativeId={creativeId}
              />
            </TabsContent>

            <TabsContent value="embed" className="space-y-4 pt-4">
              {creativeMeta ? (
                <SharePanel
                  creative={{
                    id: creativeId,
                    ...creativeMeta,
                    advertiser_id: advertiserId ?? '',
                  }}
                />
              ) : (
                <div className="rounded-md border border-dashed p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Save the creative first to access embed codes.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </form>
      </Form>
    </div>
  )
}
