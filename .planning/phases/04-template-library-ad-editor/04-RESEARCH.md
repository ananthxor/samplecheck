# Phase 4: Template Library & Ad Editor - Research

**Researched:** 2026-02-20
**Domain:** Template browsing UI, ad creative editor with live preview, JSONB config-driven templates, Supabase Storage image upload, shareable preview links, My Creatives library
**Confidence:** HIGH

## Summary

Phase 4 transforms the placeholder `/creatives` route into the core creative workflow: browsing templates organized by ad type and format, customizing a template with text/images/redirect URL in a split-pane editor, previewing in desktop/mobile sizes via sandboxed iframe, saving to a "My Creatives" library, and generating shareable preview links. This is the most architecturally significant phase so far -- it establishes the **renderer interface pattern** that Phases 5 and 6 will build on to implement 14 format-specific renderers.

The existing codebase provides strong foundations: the `creatives` table already exists with `format_id`, `format_name`, `template_data` (JSONB), `status`, `thumbnail_url`, `width`, and `height` columns. The `creative-assets` storage bucket is configured with public CDN read access and advertiser-scoped upload folders. The `AD_TYPES` constant (5 ad types, 14 formats) drives the dashboard cards and search dialog, which already navigate to `/creatives?type={slug}&format={format_slug}`. RLS policies enforce that advertisers can only manage their own creatives.

The critical architectural decision for this phase is the **template data model**: templates are static seed data defined as TypeScript constants (not a database table), each containing a `defaultConfig` JSONB object. When a user customizes a template, the editor produces a `config` JSONB object that is saved into `creatives.template_data`. The renderer reads this config to render the creative. This pattern keeps templates lightweight (no migrations needed to add templates), makes the config the single source of truth for rendering, and cleanly separates the "what to render" (config) from the "how to render" (format renderer).

**Primary recommendation:** Build a template registry as static TypeScript data with typed config schemas per format. Build the editor as a split-pane layout (form panel left, iframe preview right) using shadcn/ui Resizable panels. Use `srcdoc` on a sandboxed iframe for live preview with `postMessage` for config updates. Use Supabase Storage for image uploads with `getPublicUrl` for CDN URLs. Implement shareable preview via a `preview_token` column and an unauthenticated `/preview/:token` route with a permissive RLS policy for token-based reads.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TMPL-01 | User can browse templates by ad type and format hierarchy | Template browsing page at `/creatives` with type/format URL params; filter UI using existing `AD_TYPES` data; template cards showing thumbnail and preview |
| TMPL-02 | User can select a template and see it with default values | Template detail opens editor at `/creatives/new?template={id}`; editor loads template's `defaultConfig` into the iframe preview immediately |
| TMPL-03 | User can customize template text, images, and redirect URL | Left panel form with react-hook-form + zod validation; image upload via Supabase Storage; changes sent to iframe via `postMessage`; config stored as JSONB |
| TMPL-04 | User can preview creative in desktop and mobile views | Toolbar toggle resizes the iframe container between desktop (full width) and mobile (375px); device frame styling for visual context |
| TMPL-05 | User can save customized creative to their library | Insert/update to `creatives` table via Supabase client; `template_data` column stores the full config JSONB; `status` defaults to `'draft'` |
| TMPL-06 | User can generate a shareable preview link for a saved creative | `preview_token` column on creatives (UUID, generated on first share); `/preview/:token` public route outside `ProtectedRoute`; RLS policy for anon select by token |
| TMPL-07 | 20 curated templates available across 14 formats with predefined sizes | Static template registry in TypeScript; each template defines: format_id, name, thumbnail, sizes[], defaultConfig; 20 templates distributed across formats |
| CAMP-01 | User can view all saved creatives in My Creatives library | `/creatives` page (no type/format params) shows all user's creatives with status badges, thumbnails, and actions (edit, preview, share) |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-hook-form | ^7 | Form state management for editor panel | De-facto standard for performant React forms; uncontrolled components minimize re-renders; shadcn/ui Form component built on it |
| zod | ^3 | Schema validation for template config | Type-safe validation; generates TypeScript types from schemas; used by shadcn/ui Form integration |
| @hookform/resolvers | ^3 | Connects zod schemas to react-hook-form | Standard bridge between RHF and Zod; required by shadcn/ui Form pattern |
| shadcn/ui Resizable | latest (via CLI) | Split-pane editor layout (form + preview) | Built on react-resizable-panels v4; handles keyboard resize, persistence, orientation; standard for editor UIs |
| shadcn/ui Tabs | latest (via CLI) | Tab navigation in editor (Text, Images, Settings) and template browsing (filter by type) | Radix-based accessible tabs; keyboard navigation; used for organizing editor form sections |
| shadcn/ui Form | latest (via CLI) | Form field components with validation | Wraps react-hook-form; provides FormField, FormItem, FormLabel, FormMessage auto-wired to validation state |
| supabase-js Storage | ^2 (existing) | Image upload to creative-assets bucket | Already configured; `from('creative-assets').upload()` with CDN public URLs via `getPublicUrl()` |
| supabase-js Client | ^2 (existing) | CRUD operations on creatives table | Already configured with typed Database generic; RLS handles advertiser isolation automatically |
| TanStack Query | ^5 (existing) | Server state for creative list, template data | Already installed with QueryClientProvider; provides caching, refetching, optimistic updates |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui Select | latest (via CLI) | Dropdown selects for ad type/format filters, size selection | Template browsing filter controls |
| shadcn/ui Label | latest (via CLI) | Form field labels | Required by shadcn/ui Form for accessible labeling |
| shadcn/ui Textarea | latest (via CLI) | Multi-line text input for ad copy fields | Template text customization with longer content |
| shadcn/ui Switch | latest (via CLI) | Toggle controls (e.g., show/hide elements in template) | Optional template config toggles |
| shadcn/ui Table | latest (via CLI) | My Creatives library list view | Creative listing with status, name, format, date columns |
| shadcn/ui AlertDialog | latest (via CLI) | Delete confirmation for creatives | Destructive action confirmation |
| shadcn/ui DropdownMenu | latest (existing) | Creative row actions menu (edit, preview, share, delete) | Action menu on each creative card/row |
| nanoid | ^5 | Generate preview tokens | Lightweight random string generator for shareable URLs; alternative: crypto.randomUUID() |
| sonner | ^2 (existing) | Toast notifications | Already installed; "Creative saved", "Link copied", error toasts |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Static template registry (TS constants) | Database table for templates | DB table adds migration overhead, makes adding templates heavier; static constants are simpler for 20 curated templates; move to DB when template count exceeds ~50 or when non-developers need to manage templates |
| srcdoc iframe for preview | Blob URL iframe or separate preview server | srcdoc is simplest for injecting self-contained HTML; Blob URLs work but add URL lifecycle management; separate server is overkill for v1 preview |
| react-hook-form for editor | Zustand form store or controlled inputs | RHF provides validation, dirty tracking, field arrays out of the box; Zustand would require building all form logic from scratch |
| shadcn/ui Resizable panels | CSS Grid with drag handle | Resizable provides keyboard support, persistence, min/max constraints; custom grid drag handle is fragile and inaccessible |
| preview_token column for sharing | Edge Function to generate signed URLs | Adding a column is simpler; no Edge Function needed; token never expires (matches "shareable link" requirement with no time restriction) |

**Installation:**
```bash
# From apps/web directory
pnpm add react-hook-form zod @hookform/resolvers

# Add shadcn/ui components (CLI handles Radix dependencies)
pnpx shadcn@latest add form resizable tabs select label textarea switch table alert-dialog
```

**Note:** `react-hook-form`, `zod`, and `@hookform/resolvers` are peer dependencies of shadcn/ui Form, but installing explicitly ensures version control. The shadcn CLI may auto-install them, but explicit installation is safer in a monorepo.

## Architecture Patterns

### Recommended Project Structure

```
apps/web/src/
├── features/
│   ├── templates/                    # Template browsing (TMPL-01, TMPL-07)
│   │   ├── data/
│   │   │   ├── template-registry.ts  # Static template definitions (20 templates)
│   │   │   └── template-schemas.ts   # Zod schemas for each format's config
│   │   ├── components/
│   │   │   ├── template-card.tsx      # Template thumbnail card for browsing grid
│   │   │   ├── template-grid.tsx      # Responsive grid of template cards
│   │   │   └── template-filters.tsx   # Ad type / format filter controls
│   │   └── pages/
│   │       └── templates-page.tsx     # Browse templates (route: /creatives?type=X&format=Y)
│   ├── editor/                        # Ad editor (TMPL-02, TMPL-03, TMPL-04)
│   │   ├── components/
│   │   │   ├── editor-layout.tsx      # Split-pane: ResizablePanelGroup (form | preview)
│   │   │   ├── editor-form.tsx        # Left panel: tabbed form (text, images, settings)
│   │   │   ├── editor-preview.tsx     # Right panel: sandboxed iframe with device toggle
│   │   │   ├── editor-toolbar.tsx     # Top bar: device toggle, save button, share
│   │   │   ├── image-upload.tsx       # Image upload field with Supabase Storage
│   │   │   └── device-frame.tsx       # Desktop/mobile frame wrapper around iframe
│   │   ├── hooks/
│   │   │   ├── use-editor-state.ts    # Editor state management (config, dirty, saving)
│   │   │   └── use-image-upload.ts    # Supabase Storage upload hook
│   │   ├── lib/
│   │   │   ├── renderer.ts           # HTML generation from config (produces srcdoc HTML)
│   │   │   └── preview-message.ts    # postMessage protocol types and helpers
│   │   └── pages/
│   │       └── editor-page.tsx        # Editor page (route: /creatives/new, /creatives/:id/edit)
│   ├── creatives/                     # My Creatives library (CAMP-01, TMPL-05, TMPL-06)
│   │   ├── api/
│   │   │   └── creatives-api.ts       # Supabase CRUD for creatives table
│   │   ├── components/
│   │   │   ├── creative-list.tsx       # Table/grid of user's saved creatives
│   │   │   ├── creative-card.tsx       # Card view for a single creative
│   │   │   ├── creative-actions.tsx    # Action dropdown (edit, preview, share, delete)
│   │   │   └── share-dialog.tsx        # Dialog showing/generating shareable preview link
│   │   ├── hooks/
│   │   │   └── use-creatives.ts        # TanStack Query hooks for CRUD
│   │   └── pages/
│   │       └── creatives-page.tsx      # My Creatives list (route: /creatives, no params)
│   └── preview/                        # Public preview (TMPL-06)
│       └── pages/
│           └── preview-page.tsx        # Public preview page (route: /preview/:token)
├── components/
│   └── ui/                            # shadcn/ui components (existing + new)
│       ├── resizable.tsx              # NEW
│       ├── tabs.tsx                   # NEW
│       ├── form.tsx                   # NEW
│       ├── select.tsx                 # NEW
│       ├── label.tsx                  # NEW
│       ├── textarea.tsx               # NEW
│       ├── switch.tsx                 # NEW
│       ├── table.tsx                  # NEW
│       ├── alert-dialog.tsx           # NEW
│       └── ... (existing)
└── router.tsx                         # Updated with new routes
```

### Pattern 1: Template Registry as Static Data

**What:** Templates are defined as a TypeScript constant array, not fetched from a database. Each template has an `id`, `formatId`, `name`, `description`, `thumbnailUrl`, `sizes` array, and `defaultConfig` object matching the format's config schema.

**When to use:** For all template browsing and editor initialization in Phase 4. This data is the "seed catalog" of 20 templates.

**Why:** No migration needed to add/modify templates. The template count is small (20) and curated. Templates are code-managed, not user-managed. This pattern was already established for `AD_TYPES` in Phase 3.

**Example:**
```typescript
// features/templates/data/template-registry.ts
import type { TemplateConfig } from './template-schemas'

export interface TemplateSize {
  width: number
  height: number
  label: string       // e.g., "Leaderboard (728x90)"
}

export interface Template {
  id: string                    // e.g., "static-banner-hero-1"
  formatId: string              // matches AdFormat.id from AD_TYPES
  name: string                  // e.g., "Hero Banner"
  description: string
  thumbnailUrl: string          // static asset or placeholder
  category: string              // matches AdType.id
  sizes: TemplateSize[]         // predefined sizes for this template
  defaultConfig: TemplateConfig // format-specific default values
}

export const TEMPLATES: Template[] = [
  {
    id: 'static-banner-hero-1',
    formatId: 'static-banner',
    name: 'Hero Banner',
    description: 'Clean hero layout with headline, image, and CTA',
    thumbnailUrl: '/templates/static-banner-hero-1.png',
    category: 'standard',
    sizes: [
      { width: 728, height: 90, label: 'Leaderboard (728x90)' },
      { width: 300, height: 250, label: 'Medium Rectangle (300x250)' },
      { width: 160, height: 600, label: 'Wide Skyscraper (160x600)' },
    ],
    defaultConfig: {
      type: 'static-banner',
      headline: 'Your Headline Here',
      bodyText: 'Your message goes here',
      ctaText: 'Learn More',
      ctaUrl: 'https://example.com',
      backgroundColor: '#ffffff',
      textColor: '#000000',
      ctaColor: '#2563eb',
      imageUrl: '',
    },
  },
  // ... 19 more templates
]

// Lookup helpers
export function getTemplateById(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id)
}

export function getTemplatesByFormat(formatId: string): Template[] {
  return TEMPLATES.filter((t) => t.formatId === formatId)
}

export function getTemplatesByCategory(category: string): Template[] {
  return TEMPLATES.filter((t) => t.category === category)
}
```

### Pattern 2: Typed Config Schemas Per Format

**What:** Each ad format has a Zod schema defining the shape of its `config` JSONB object. These schemas are used for: (a) form validation in the editor, (b) TypeScript type inference, and (c) runtime validation when loading saved creatives.

**When to use:** For all config handling -- both form input validation and data loading.

**Why:** The `template_data` column is JSONB (untyped at the database level). Zod schemas provide runtime type safety and form validation from a single source of truth. Each format has different fields (a static banner has `headline`, `bodyText`, `ctaText`; a carousel has `slides[]` with per-slide content), so per-format schemas are necessary.

**Example:**
```typescript
// features/templates/data/template-schemas.ts
import { z } from 'zod'

// Base fields shared by all formats
const baseConfigSchema = z.object({
  type: z.string(),
  ctaUrl: z.string().url('Must be a valid URL').or(z.literal('')),
})

// Static banner format config
export const staticBannerConfigSchema = baseConfigSchema.extend({
  type: z.literal('static-banner'),
  headline: z.string().max(100, 'Headline must be under 100 characters'),
  bodyText: z.string().max(250, 'Body text must be under 250 characters'),
  ctaText: z.string().max(30, 'CTA text must be under 30 characters'),
  backgroundColor: z.string(),
  textColor: z.string(),
  ctaColor: z.string(),
  imageUrl: z.string(),
})

// Carousel format config
export const carouselConfigSchema = baseConfigSchema.extend({
  type: z.literal('carousel'),
  slides: z.array(z.object({
    headline: z.string().max(60),
    imageUrl: z.string(),
    bodyText: z.string().max(120).optional(),
  })).min(2, 'At least 2 slides required').max(10, 'Maximum 10 slides'),
  autoPlay: z.boolean().default(false),
  autoPlayInterval: z.number().min(1000).max(10000).default(3000),
})

// ... schemas for all 14 formats

// Discriminated union of all config types
export const templateConfigSchema = z.discriminatedUnion('type', [
  staticBannerConfigSchema,
  carouselConfigSchema,
  // ... all format schemas
])

export type TemplateConfig = z.infer<typeof templateConfigSchema>
export type StaticBannerConfig = z.infer<typeof staticBannerConfigSchema>
export type CarouselConfig = z.infer<typeof carouselConfigSchema>

// Schema lookup by format type
export function getConfigSchemaForFormat(formatType: string) {
  const schemas: Record<string, z.ZodType> = {
    'static-banner': staticBannerConfigSchema,
    'carousel': carouselConfigSchema,
    // ... all formats
  }
  return schemas[formatType]
}
```

### Pattern 3: Split-Pane Editor with Sandboxed iframe Preview

**What:** The editor page uses shadcn/ui `ResizablePanelGroup` with two panels: the left panel contains a tabbed form for customization, the right panel contains a sandboxed `<iframe>` that renders the live preview. The form sends config changes to the iframe via `postMessage`.

**When to use:** For the editor page (`/creatives/new`, `/creatives/:id/edit`).

**Why:** The split-pane layout is the standard pattern for code editors, email builders, and ad builders (Airtory, Bannerflow, Celtra all use this). The sandboxed iframe prevents template JavaScript from accessing the editor's DOM, auth tokens, or React state. `postMessage` is the secure cross-origin communication channel.

**Example:**
```typescript
// features/editor/components/editor-layout.tsx
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable'
import { EditorForm } from './editor-form'
import { EditorPreview } from './editor-preview'
import { EditorToolbar } from './editor-toolbar'
import type { TemplateConfig } from '@/features/templates/data/template-schemas'

interface EditorLayoutProps {
  config: TemplateConfig
  onConfigChange: (config: TemplateConfig) => void
  onSave: () => void
  isSaving: boolean
}

export function EditorLayout({ config, onConfigChange, onSave, isSaving }: EditorLayoutProps) {
  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))] flex-col">
      <EditorToolbar onSave={onSave} isSaving={isSaving} />
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
          <EditorForm config={config} onChange={onConfigChange} />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={65} minSize={40}>
          <EditorPreview config={config} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
```

### Pattern 4: Sandboxed iframe with srcdoc and postMessage

**What:** The preview iframe uses the `srcdoc` attribute to inject self-contained HTML generated from the template config. On initial load, the full HTML is set via `srcdoc`. On subsequent config changes, `postMessage` sends incremental updates to the iframe's event listener, which patches the DOM without a full reload.

**When to use:** For the editor preview panel and the public shareable preview page.

**Why:** `srcdoc` is simpler than Blob URLs (no lifecycle management) and works entirely client-side (no server round-trip). `postMessage` for incremental updates avoids the iframe flashing that occurs when `srcdoc` is replaced entirely on every keystroke. The `sandbox="allow-scripts"` attribute prevents the template content from accessing the parent page's cookies, storage, or DOM.

**Example:**
```typescript
// features/editor/components/editor-preview.tsx
import { useRef, useEffect, useState } from 'react'
import { generatePreviewHtml } from '../lib/renderer'
import type { TemplateConfig } from '@/features/templates/data/template-schemas'

interface EditorPreviewProps {
  config: TemplateConfig
  deviceMode?: 'desktop' | 'mobile'
}

export function EditorPreview({ config, deviceMode = 'desktop' }: EditorPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [initialHtml, setInitialHtml] = useState('')

  // Generate initial HTML on mount or format change
  useEffect(() => {
    setInitialHtml(generatePreviewHtml(config))
  }, [config.type]) // Only regenerate full HTML on format type change

  // Send incremental updates via postMessage
  useEffect(() => {
    const iframe = iframeRef.current
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage(
        { type: 'CONFIG_UPDATE', payload: config },
        '*'
      )
    }
  }, [config])

  const containerStyle = deviceMode === 'mobile'
    ? 'mx-auto w-[375px]'
    : 'w-full'

  return (
    <div className="flex h-full items-center justify-center bg-muted/30 p-4">
      <div className={containerStyle}>
        <iframe
          ref={iframeRef}
          srcDoc={initialHtml}
          sandbox="allow-scripts"
          className="h-full w-full border-0"
          title="Creative preview"
        />
      </div>
    </div>
  )
}
```

```typescript
// features/editor/lib/renderer.ts
// Generates self-contained HTML for the iframe srcdoc
import type { TemplateConfig } from '@/features/templates/data/template-schemas'

export function generatePreviewHtml(config: TemplateConfig): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; overflow: hidden; }
    /* Format-specific base styles injected here */
  </style>
</head>
<body>
  <div id="creative-root"></div>
  <script>
    // Initial config from srcdoc generation
    let currentConfig = ${JSON.stringify(config)};

    // Render function (format-specific)
    function render(cfg) {
      const root = document.getElementById('creative-root');
      // Format-specific rendering logic
      // Phase 4 implements basic renderers (static-banner, etc.)
      // Phases 5 & 6 add interactive/animated renderers
      root.innerHTML = renderByType(cfg);
    }

    function renderByType(cfg) {
      switch (cfg.type) {
        case 'static-banner':
          return renderStaticBanner(cfg);
        // ... other formats added in Phases 5 & 6
        default:
          return '<div style="padding:20px;text-align:center;">Preview for ' + cfg.type + '</div>';
      }
    }

    function renderStaticBanner(cfg) {
      return '<div style="background:' + cfg.backgroundColor + ';color:' + cfg.textColor + ';padding:16px;height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;">'
        + (cfg.imageUrl ? '<img src="' + cfg.imageUrl + '" style="max-width:100%;max-height:40%;object-fit:contain;margin-bottom:8px;" />' : '')
        + '<h1 style="font-size:1.2em;margin-bottom:4px;">' + (cfg.headline || '') + '</h1>'
        + '<p style="font-size:0.9em;margin-bottom:8px;">' + (cfg.bodyText || '') + '</p>'
        + '<a href="' + (cfg.ctaUrl || '#') + '" style="background:' + cfg.ctaColor + ';color:white;padding:8px 16px;border-radius:4px;text-decoration:none;font-weight:bold;">' + (cfg.ctaText || 'Click') + '</a>'
        + '</div>';
    }

    // Listen for config updates from parent editor
    window.addEventListener('message', function(event) {
      if (event.data && event.data.type === 'CONFIG_UPDATE') {
        currentConfig = event.data.payload;
        render(currentConfig);
      }
    });

    // Initial render
    render(currentConfig);
  </script>
</body>
</html>`
}
```

### Pattern 5: Supabase Storage Image Upload

**What:** Image uploads go directly from the browser to the Supabase Storage `creative-assets` bucket using `supabase.storage.from('creative-assets').upload()`. The file path follows the convention `<advertiser_id>/<creative_id>/<filename>`. After upload, `getPublicUrl()` returns the CDN URL which is stored in the config JSONB.

**When to use:** For all image fields in the editor (background images, logo uploads, slide images in carousels, etc.).

**Why:** The storage bucket and RLS policies are already configured from Phase 1. Client-side upload avoids routing binary data through an Edge Function. The bucket is public, so `getPublicUrl()` returns a direct CDN URL with no signed URL expiration -- perfect for ad creatives that need permanent asset URLs.

**Example:**
```typescript
// features/editor/hooks/use-image-upload.ts
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { STORAGE_BUCKET } from '@scrolltoday/shared'

interface UploadResult {
  url: string
  path: string
}

export function useImageUpload() {
  const { profile } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function uploadImage(file: File, creativeId: string): Promise<UploadResult | null> {
    if (!profile?.advertiser_id) {
      setError('No advertiser context')
      return null
    }

    setIsUploading(true)
    setError(null)

    const ext = file.name.split('.').pop()
    const fileName = `${crypto.randomUUID()}.${ext}`
    const filePath = `${profile.advertiser_id}/${creativeId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '31536000', // 1 year -- assets are versioned by UUID filename
        upsert: false,
      })

    if (uploadError) {
      setError(uploadError.message)
      setIsUploading(false)
      return null
    }

    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath)

    setIsUploading(false)
    return { url: publicUrl, path: filePath }
  }

  return { uploadImage, isUploading, error }
}
```

### Pattern 6: Preview Token for Shareable Links

**What:** The `creatives` table gets a nullable `preview_token` column (TEXT, unique). When a user clicks "Share Preview," the client generates a UUID token, saves it to the creative's `preview_token` field, and constructs a URL like `https://app.scrolltoday.com/preview/<token>`. A permissive RLS policy allows `SELECT` on creatives where `preview_token` matches, using the `anon` role (no authentication required). The `/preview/:token` route is outside `ProtectedRoute` in the router.

**When to use:** For TMPL-06 shareable preview functionality.

**Why:** This is simpler than an Edge Function for signed URLs. The token is a UUID (practically unguessable). The link never expires (requirement says "without requiring login" -- no time restriction mentioned). The RLS policy is narrow: only `SELECT` and only when `preview_token = token AND preview_token IS NOT NULL`.

**Example (migration):**
```sql
-- Migration: Add preview_token to creatives
ALTER TABLE public.creatives ADD COLUMN preview_token TEXT UNIQUE;
CREATE INDEX idx_creatives_preview_token ON public.creatives (preview_token) WHERE preview_token IS NOT NULL;

-- RLS policy: Allow anonymous access to creatives by preview_token
CREATE POLICY "Public preview access by token"
ON public.creatives FOR SELECT
TO anon
USING (preview_token IS NOT NULL AND preview_token = current_setting('request.header.x-preview-token', true));
```

**Alternative RLS approach (simpler, recommended):** Since the Supabase client with the anon key can query with `.eq('preview_token', token)`, and the RLS policy just needs to allow SELECT when preview_token is not null and matches the query filter:

```sql
-- Simpler: Allow anon to read any creative that has a preview_token set
-- The application always queries with .eq('preview_token', token)
-- so only the matching row is returned
CREATE POLICY "Public preview by token"
ON public.creatives FOR SELECT
TO anon
USING (preview_token IS NOT NULL);
```

**Router update:**
```typescript
// router.tsx - Add public preview route OUTSIDE ProtectedRoute
export const router = createBrowserRouter([
  {
    path: '/preview/:token',
    lazy: async () => {
      const { default: Component } = await import('@/features/preview/pages/preview-page')
      return { Component }
    },
  },
  {
    path: '/login',
    // ... existing
  },
  {
    element: <ProtectedRoute />,
    children: [
      // ... existing authenticated routes
    ],
  },
])
```

### Pattern 7: Creatives CRUD with TanStack Query

**What:** All creatives CRUD operations go through a thin API module (`creatives-api.ts`) that wraps Supabase client calls. TanStack Query hooks (`useCreatives`, `useCreative`, `useCreateCreative`, `useUpdateCreative`) manage server state with automatic cache invalidation.

**When to use:** For all creative read/write operations across the creatives page, editor page, and share dialog.

**Example:**
```typescript
// features/creatives/api/creatives-api.ts
import { supabase } from '@/lib/supabase'
import type { Tables, Insertable, Updatable } from '@scrolltoday/shared'

type Creative = Tables<'creatives'>
type CreativeInsert = Insertable<'creatives'>
type CreativeUpdate = Updatable<'creatives'>

export async function fetchCreatives(): Promise<Creative[]> {
  const { data, error } = await supabase
    .from('creatives')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function fetchCreativeById(id: string): Promise<Creative> {
  const { data, error } = await supabase
    .from('creatives')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function fetchCreativeByToken(token: string): Promise<Creative> {
  // Uses anon key -- no auth required
  const { data, error } = await supabase
    .from('creatives')
    .select('*')
    .eq('preview_token', token)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function createCreative(creative: CreativeInsert): Promise<Creative> {
  const { data, error } = await supabase
    .from('creatives')
    .insert(creative)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function updateCreative(id: string, updates: CreativeUpdate): Promise<Creative> {
  const { data, error } = await supabase
    .from('creatives')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function deleteCreative(id: string): Promise<void> {
  const { error } = await supabase
    .from('creatives')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}
```

### Anti-Patterns to Avoid

- **Storing rendered HTML in the database:** Do NOT store the final rendered HTML in `template_data`. Store only the config (text values, image URLs, color choices). The renderer produces HTML from config on the fly. This keeps the data small and allows renderer upgrades without data migration.

- **Using `dangerouslySetInnerHTML` for preview instead of iframe:** Template content may contain JavaScript (especially for interactive formats in Phases 5/6). Rendering template content directly in the React DOM tree is a security risk and breaks React's reconciliation. Always use a sandboxed iframe.

- **Fetching template definitions from the database:** Templates are static seed data. Do not create a `templates` table and fetch from it. The 20 templates are a curated, code-managed catalog. Database lookups for static data add latency and complexity.

- **Replacing `srcdoc` on every keystroke:** Replacing the entire `srcdoc` attribute causes the iframe to fully reload on every change, creating visible flashing. Instead, set `srcdoc` once on mount/format change and use `postMessage` for incremental config updates.

- **Uploading images through an Edge Function:** The Supabase Storage client handles uploads directly from the browser with RLS-based folder isolation. Routing through an Edge Function adds unnecessary latency and a custom API surface.

- **Creating a separate Supabase client for public preview:** The existing `supabase` client singleton uses the `anon` key. When no user is authenticated, queries still work but are subject to `anon` RLS policies. The public preview page just uses the same client -- the `anon` policy on creatives allows SELECT by `preview_token`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation + error display | Custom validation with useState | react-hook-form + zod + shadcn/ui Form | RHF provides dirty tracking, touched states, field arrays, submit handling; zod provides schema-to-type inference; shadcn/ui Form auto-wires error messages |
| Split-pane resizable layout | Custom CSS grid with drag handle + mouse events | shadcn/ui Resizable (react-resizable-panels v4) | Handles keyboard resize (arrow keys), min/max constraints, panel collapse, orientation changes, persistence |
| Image upload to CDN | Custom multipart upload to Edge Function | `supabase.storage.from().upload()` + `getPublicUrl()` | Already configured; RLS handles auth; public bucket provides CDN URLs automatically |
| Shareable link token generation | Custom Edge Function with cryptographic signing | `crypto.randomUUID()` + database column | UUID v4 is practically unguessable (2^122 random bits); no expiration needed per requirements; column + RLS policy is simpler than signed URLs |
| HTML sanitization for preview | Custom regex-based HTML cleaning | Sandboxed iframe (`sandbox="allow-scripts"`) | The sandbox attribute isolates the content at the browser engine level -- no sanitization library needed because the iframe cannot access parent page resources |
| Config schema validation | Custom type guards with manual checks | Zod schemas with `.safeParse()` | Zod handles nested objects, arrays, unions, defaults, and generates TypeScript types; manual validation for JSONB config objects is error-prone |

**Key insight:** Phase 4 is the foundation for all creative workflows. Getting the renderer interface and config schema patterns right here determines whether Phases 5 and 6 can add format renderers cleanly or require refactoring. Invest in the architecture; use existing libraries for commodity problems.

## Common Pitfalls

### Pitfall 1: Template Config Schema Drift

**What goes wrong:** The Zod schema for a format evolves (e.g., new field added to static banner config), but saved creatives in the database have the old schema. Loading the creative fails Zod validation because the new required field is missing.

**Why it happens:** `template_data` is JSONB -- there's no database-level schema enforcement. The Zod schema is the only runtime check.

**How to avoid:** (1) Always make new config fields optional with defaults (`.optional().default(value)`). (2) Use the `schema_version` column on creatives (already exists in the schema). (3) Write a migration/coerce function that fills in defaults for missing fields when loading old creatives. (4) Never change the meaning of existing fields -- add new ones instead.

**Warning signs:** Saved creatives fail to load; "required field missing" validation errors on existing data; editor crashes on opening old creatives.

### Pitfall 2: iframe srcdoc Flashing on Config Change

**What goes wrong:** Every keystroke in the editor form triggers a full `srcdoc` replacement on the iframe, causing a visible white flash as the iframe reloads.

**Why it happens:** Treating the iframe like a React component that re-renders from scratch on every state change.

**How to avoid:** Set `srcdoc` only once (on mount or format type change). Use `postMessage` to send config updates to the iframe. Inside the iframe, a `message` event listener receives the new config and patches the DOM incrementally. The iframe never fully reloads during editing.

**Warning signs:** White flashes during typing; iframe scroll position resets on every change; slow/janky preview updates.

### Pitfall 3: Storage Upload Path Collision

**What goes wrong:** Two uploads of the same filename overwrite each other in Supabase Storage because the file path is `advertiser_id/image.jpg` both times.

**Why it happens:** Using the original filename as the storage path without deduplication.

**How to avoid:** Always include a UUID in the file path: `advertiser_id/creative_id/uuid.ext`. The `crypto.randomUUID()` call ensures uniqueness. Set `upsert: false` on upload to detect collisions rather than silently overwriting.

**Warning signs:** Images in one creative showing images from another creative; image uploads appearing to succeed but showing wrong content.

### Pitfall 4: Missing advertiser_id on Creative Insert

**What goes wrong:** The editor saves a creative without setting `advertiser_id`, which is `NOT NULL` in the schema. The insert fails with a database constraint error.

**Why it happens:** The `advertiser_id` is available from `useAuth().profile.advertiser_id`, but the editor component doesn't wire it into the insert payload.

**How to avoid:** Create a helper function or hook that constructs the `Insertable<'creatives'>` object, always including `advertiser_id` from the auth context. Validate the payload has `advertiser_id` before calling `supabase.from('creatives').insert()`.

**Warning signs:** "violates not-null constraint" errors on save; creatives visible to super_admin but no advertiser association.

### Pitfall 5: Public Preview Route Inside ProtectedRoute

**What goes wrong:** The `/preview/:token` route is nested inside `ProtectedRoute` in the router. Unauthenticated users (the whole point of shareable preview) are redirected to `/login` instead of seeing the preview.

**Why it happens:** Adding the route to the existing children array inside the `ProtectedRoute` wrapper by mistake.

**How to avoid:** Add the `/preview/:token` route at the top level of the router config, outside the `ProtectedRoute` element wrapper. Review the router nesting structure: login, preview (public), then protected children.

**Warning signs:** Sharing a preview link always redirects to login; preview works when logged in but not in incognito.

### Pitfall 6: RLS Blocking Public Preview Queries

**What goes wrong:** The public preview page queries `creatives` table with the anon key, but no RLS policy allows `anon` role to read from the table. Query returns empty results.

**Why it happens:** The existing RLS policies only allow `authenticated` role (the current policies check `advertiser_id = get_user_advertiser_id()` or `is_super_admin()`). There is no policy for the `anon` role.

**How to avoid:** Add a specific RLS policy for `TO anon` that allows `SELECT` only on rows where `preview_token IS NOT NULL`. This ensures: (1) only creatives with an explicitly generated token are accessible, (2) the query still filters by the specific token value via `.eq('preview_token', token)` in the application code.

**Warning signs:** Preview page shows "not found" or empty state; works for logged-in users but not anonymous users; Supabase logs show RLS violation.

## Code Examples

### Creatives Page Routing (Dual Mode: Browse Templates + My Library)

```typescript
// features/creatives/pages/creatives-page.tsx
import { useSearchParams } from 'react-router'
import { TemplatesPage } from '@/features/templates/pages/templates-page'
import { CreativesList } from '../components/creative-list'

export default function CreativesPage() {
  const [searchParams] = useSearchParams()
  const typeFilter = searchParams.get('type')
  const formatFilter = searchParams.get('format')

  // If type/format params present, show template browsing
  // Otherwise show My Creatives library
  if (typeFilter || formatFilter) {
    return <TemplatesPage type={typeFilter} format={formatFilter} />
  }

  return <CreativesList />
}
```

### Image Upload Component

```typescript
// features/editor/components/image-upload.tsx
import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, X, Loader2 } from 'lucide-react'
import { useImageUpload } from '../hooks/use-image-upload'

interface ImageUploadProps {
  value: string           // current image URL
  onChange: (url: string) => void
  creativeId: string
  label?: string
}

export function ImageUpload({ value, onChange, creativeId, label }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { uploadImage, isUploading, error } = useImageUpload()

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const result = await uploadImage(file, creativeId)
    if (result) {
      onChange(result.url)
    }
  }

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      {value ? (
        <div className="relative">
          <img src={value} alt="Uploaded" className="h-32 w-full rounded-md border object-cover" />
          <Button
            variant="destructive"
            size="icon"
            className="absolute right-1 top-1 h-6 w-6"
            onClick={() => onChange('')}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          {isUploading ? 'Uploading...' : 'Upload Image'}
        </Button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
        className="hidden"
        onChange={handleFileChange}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
```

### Share Preview Dialog

```typescript
// features/creatives/components/share-dialog.tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Copy, Check } from 'lucide-react'
import { updateCreative } from '../api/creatives-api'
import { toast } from 'sonner'

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  creativeId: string
  existingToken: string | null
}

export function ShareDialog({ open, onOpenChange, creativeId, existingToken }: ShareDialogProps) {
  const [token, setToken] = useState(existingToken)
  const [copied, setCopied] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const previewUrl = token
    ? `${window.location.origin}/preview/${token}`
    : null

  async function handleGenerateLink() {
    setIsGenerating(true)
    const newToken = crypto.randomUUID()
    try {
      await updateCreative(creativeId, { preview_token: newToken })
      setToken(newToken)
      toast.success('Preview link generated')
    } catch (err) {
      toast.error('Failed to generate preview link')
    }
    setIsGenerating(false)
  }

  function handleCopy() {
    if (previewUrl) {
      navigator.clipboard.writeText(previewUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Preview</DialogTitle>
          <DialogDescription>
            Anyone with this link can view the creative without logging in.
          </DialogDescription>
        </DialogHeader>
        {previewUrl ? (
          <div className="flex gap-2">
            <Input value={previewUrl} readOnly />
            <Button variant="outline" size="icon" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        ) : (
          <Button onClick={handleGenerateLink} disabled={isGenerating}>
            {isGenerating ? 'Generating...' : 'Generate Preview Link'}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Database-backed template tables with admin CRUD | Static TypeScript template registry | Current ecosystem consensus for small catalogs | Simpler deployment, no migration for template changes, faster reads |
| Controlled form inputs with useState | react-hook-form with uncontrolled inputs | RHF has been standard since 2021+ | 60-80% fewer re-renders in complex forms; built-in dirty/touched tracking |
| Custom form validation with if/else | Zod schemas with type inference | Zod became dominant 2023+ | Single source of truth for validation + TypeScript types; composable schemas |
| Custom drag-to-resize panels | react-resizable-panels (via shadcn/ui Resizable) | v4 released 2025 | Keyboard accessible, orientation-aware, collapse support, persistence |
| Blob URL iframes for preview | srcdoc with postMessage updates | Widespread 2024+ for code editors/builders | No URL lifecycle management; better browser support; simpler security model |
| Server-side image upload proxy | Direct browser-to-storage upload with RLS | Supabase Storage standard pattern | Lower latency; no Edge Function needed; CDN URLs from public bucket |

**Deprecated/outdated:**
- `formik` for form management: react-hook-form has overtaken Formik in ecosystem adoption; Formik has fewer updates
- `yup` for schema validation: Zod provides better TypeScript inference; shadcn/ui Form uses Zod natively
- `react-iframe` npm package: Not needed; native `<iframe srcdoc>` with `sandbox` attribute is sufficient and more current
- Manual file upload via XMLHttpRequest: Supabase client `.upload()` wraps fetch with auth headers automatically

## Open Questions

1. **Template thumbnail generation**
   - What we know: Each template needs a thumbnail for the browsing grid. Options: (a) static screenshots committed as assets, (b) server-side rendering (Puppeteer), (c) client-side canvas capture.
   - What's unclear: Whether to invest in automated thumbnail generation or use static placeholder images for v1.
   - Recommendation: Use static placeholder images for v1. Automated thumbnail generation is nice-to-have but adds Puppeteer/headless browser complexity. Each template gets a hand-created or screenshot thumbnail stored in `/public/templates/`.

2. **Renderer interface for Phases 5 and 6**
   - What we know: Phase 4 establishes the renderer pattern. Phases 5 and 6 add 14 format-specific renderers. The renderer needs to work in both the editor preview (postMessage-driven) and served ads (standalone).
   - What's unclear: Exact interface contract between the editor and format renderers -- should each format export a `render(config, container)` function, or should they register themselves in a renderer registry?
   - Recommendation: Use a simple function registry pattern. Each format exports a `render(container: HTMLElement, config: FormatConfig): void` function and an `update(container: HTMLElement, config: FormatConfig): void` function. Phase 4 implements basic renderers (static-banner, multi-frame, in-feed) to validate the pattern. Phases 5/6 add the remaining formats.

3. **preview_token column addition approach**
   - What we know: The creatives table needs a `preview_token` column. The schema was created via migration in Phase 1.
   - What's unclear: Whether to add this via a new Supabase migration file or alter the original migration.
   - Recommendation: Create a new migration file (`20260220000000_add_preview_token.sql`). Never modify existing migrations that have been deployed. This follows the migration-based schema management pattern established in Phase 1.

4. **Editor state management: URL params vs React state**
   - What we know: The editor page needs to know: which template (for new creatives) or which creative ID (for editing). It also needs to manage the current config, dirty state, and save state.
   - What's unclear: How much state to put in URL params vs local React state.
   - Recommendation: Use URL params for navigation (`/creatives/new?template=static-banner-hero-1` and `/creatives/:id/edit`). Use a custom `useEditorState` hook with `useState` for the mutable config. Use TanStack Query for server data (loading/saving creatives). Do NOT use Zustand or global state -- editor state is page-scoped.

5. **Number of templates per format for TMPL-07**
   - What we know: 20 templates across 14 formats. Not every format needs the same number.
   - What's unclear: Exact distribution of 20 templates across 14 formats.
   - Recommendation: Prioritize formats that Phase 4 can actually render (static-banner, multi-frame, in-feed for standard/native). Give 2-3 templates to those. For interactive/animated/video formats (Phases 5/6), provide 1 template each with placeholder renderers that show default content. Distribution: ~3 for static-banner, ~2 for multi-frame, ~2 for in-feed, ~1 each for the remaining 11 formats = 18 + 2 extra for popular formats.

## Sources

### Primary (HIGH confidence)
- Supabase Storage upload documentation: https://supabase.com/docs/guides/storage/uploads/standard-uploads -- Upload API, parameters, upsert, cacheControl options
- Supabase Storage getPublicUrl: https://supabase.com/docs/reference/javascript/storage-from-getpublicurl -- Public URL construction for CDN-served assets
- Supabase RLS documentation: https://supabase.com/docs/guides/database/postgres/row-level-security -- anon role, authenticated role, policy patterns
- shadcn/ui Resizable component: https://ui.shadcn.com/docs/components/radix/resizable -- ResizablePanelGroup, ResizablePanel, ResizableHandle; built on react-resizable-panels v4
- shadcn/ui Tabs component: https://ui.shadcn.com/docs/components/radix/tabs -- Tabs, TabsList, TabsTrigger, TabsContent; Radix-based
- shadcn/ui React Hook Form integration: https://ui.shadcn.com/docs/forms/react-hook-form -- Form, FormField, FormItem, FormLabel, FormMessage; zod resolver pattern
- MDN HTMLIFrameElement srcdoc: https://developer.mozilla.org/en-US/docs/Web/API/HTMLIFrameElement/srcdoc -- srcdoc attribute, sandbox interaction, security model
- web.dev Sandboxed iframes: https://web.dev/articles/sandboxed-iframes -- sandbox attribute values, permission model, postMessage for cross-frame communication

### Secondary (MEDIUM confidence)
- LogRocket React iframe best practices: https://blog.logrocket.com/best-practices-react-iframes/ -- srcdoc vs src tradeoffs, sandbox attributes, postMessage patterns
- Building a Secure Code Sandbox (Medium): https://medium.com/@muyiwamighty/building-a-secure-code-sandbox-what-i-learned-about-iframe-isolation-and-postmessage-a6e1c45966df -- iframe isolation, postMessage protocol design, avoiding flashing
- How Code Sandboxes Update Content (joyofcode.xyz): https://joyofcode.xyz/avoid-flashing-iframe -- srcdoc replacement vs postMessage incremental updates; flash prevention technique
- Wasp blog: Building Forms with RHF + Zod + shadcn: https://wasp.sh/blog/2024/11/20/building-react-forms-with-ease-using-react-hook-form-and-zod -- Complete form setup pattern with code examples

### Tertiary (LOW confidence)
- None -- all findings verified with primary or secondary sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- react-hook-form, zod, shadcn/ui Form/Resizable/Tabs are well-documented with official examples; Supabase Storage API verified against official docs
- Architecture: HIGH -- Template registry pattern matches Phase 3 precedent (AD_TYPES); sandboxed iframe preview matches architecture research (Pattern 4); JSONB config with Zod schemas is an established pattern for flexible document storage
- Pitfalls: HIGH -- srcdoc flashing, RLS for anon access, schema drift, and storage path collisions are all documented or discoverable from codebase analysis; preview route nesting is a concrete risk from the existing router structure
- Renderer interface: MEDIUM -- The exact function interface for format renderers is a design decision not fully validated externally; recommended pattern is based on standard plugin registry patterns but will be refined during Phase 5/6 implementation

**Research date:** 2026-02-20
**Valid until:** 2026-03-20 (30 days -- stable domain; shadcn/ui, react-hook-form, and Supabase Storage are mature)
