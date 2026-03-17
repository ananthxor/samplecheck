---
phase: 04-template-library-ad-editor
plan: 02
subsystem: ui
tags: [react-hook-form, zod, supabase, iframe-preview, postMessage, tanstack-query, resizable-panels]

# Dependency graph
requires:
  - phase: 04-template-library-ad-editor
    provides: Template registry, Zod config schemas, getTemplateById/getConfigSchemaForFormat helpers, shadcn/ui components (form, resizable, tabs, select)
provides:
  - Creatives CRUD API with TanStack Query hooks (5 API functions, 5 hooks)
  - HTML renderer generating self-contained srcdoc with 3 format renderers (static-banner, multi-frame, in-feed) and placeholder for 11 others
  - postMessage CONFIG_UPDATE protocol for live iframe preview updates
  - Split-pane ad editor at /creatives/new and /creatives/:id/edit
  - Tabbed form with Content/Style/Settings tabs for all 14 format types
  - Device mode toggle (desktop/mobile) with phone-frame styling
  - Image upload to Supabase Storage creative-assets bucket
  - Save-to-database workflow creating/updating creatives table rows
affects: [04-03-my-creatives, phase-05-interactive-renderers, phase-06-animated-video-renderers]

# Tech tracking
tech-stack:
  added: []
  patterns: [iframe-srcdoc-preview, postMessage-config-update, split-pane-editor, format-specific-form-fields]

key-files:
  created:
    - apps/web/src/features/creatives/api/creatives-api.ts
    - apps/web/src/features/creatives/hooks/use-creatives.ts
    - apps/web/src/features/editor/lib/renderer.ts
    - apps/web/src/features/editor/lib/preview-message.ts
    - apps/web/src/features/editor/hooks/use-editor-state.ts
    - apps/web/src/features/editor/hooks/use-image-upload.ts
    - apps/web/src/features/editor/components/device-frame.tsx
    - apps/web/src/features/editor/components/editor-preview.tsx
    - apps/web/src/features/editor/components/image-upload.tsx
    - apps/web/src/features/editor/components/editor-form.tsx
    - apps/web/src/features/editor/components/editor-toolbar.tsx
    - apps/web/src/features/editor/components/editor-layout.tsx
    - apps/web/src/features/editor/pages/editor-page.tsx
  modified:
    - apps/web/src/router.tsx
    - packages/shared/src/index.ts

key-decisions:
  - "zodResolver cast to Resolver<TemplateConfig> -- Zod schema input types (with optionals) differ from output types (with defaults applied), requiring explicit cast for react-hook-form compatibility"
  - "ResizablePanelGroup uses orientation prop (not direction) -- react-resizable-panels v4 API uses orientation='horizontal'"
  - "Json type exported from shared package -- needed for template_data casting when saving creatives to Supabase"
  - "Temporary UUID for new creative image uploads -- generates crypto.randomUUID() at editor init for upload paths before actual creative ID exists"

patterns-established:
  - "iframe srcdoc + postMessage pattern for live ad preview without page reload"
  - "Format-specific form field rendering via switch on config.type"
  - "Creatives CRUD API pattern: thin Supabase wrapper + TanStack Query hooks with cache invalidation"
  - "Editor state hook pattern: config + dirty tracking + save state in single hook"

# Metrics
duration: 7min
completed: 2026-02-20
---

# Phase 4 Plan 02: Ad Editor & Live Preview Summary

**Split-pane ad editor with iframe srcdoc preview, postMessage live updates, creatives CRUD API, and save-to-database workflow for all 14 format types**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-20T05:28:10Z
- **Completed:** 2026-02-20T05:35:46Z
- **Tasks:** 2
- **Files modified:** 15

## Accomplishments
- Built creatives CRUD API with 5 Supabase wrapper functions and 5 TanStack Query hooks with cache invalidation
- Created HTML renderer producing self-contained srcdoc documents with embedded renderers for static-banner (centered layout with CTA), multi-frame (auto-rotating with fade transitions), and in-feed (native card layout), plus placeholder for 11 other formats
- Built split-pane editor with resizable panels (35/65 default), tabbed form (Content/Style/Settings) supporting all 14 format types including useFieldArray for array fields (carousel slides, multi-frame frames, accordion sections, quiz options)
- Implemented live preview via postMessage CONFIG_UPDATE protocol with 150ms debounce, device mode toggle (desktop with border / mobile with phone-frame appearance), and size selector dropdown
- Wired complete save workflow: new creatives saved as draft status with advertiser_id from auth context, existing creatives updated with re-save, toast notifications on success/error, URL updated to /creatives/{id}/edit after first save

## Task Commits

Each task was committed atomically:

1. **Task 1: Create creatives API, renderer, preview system, and editor hooks** - `70188b0` (feat)
2. **Task 2: Build editor UI components and wire editor page with routes** - `2d5255f` (feat)

## Files Created/Modified
- `apps/web/src/features/creatives/api/creatives-api.ts` - Supabase CRUD wrapper (fetchCreatives, fetchCreativeById, createCreative, updateCreative, deleteCreative)
- `apps/web/src/features/creatives/hooks/use-creatives.ts` - TanStack Query hooks with cache invalidation for all CRUD operations
- `apps/web/src/features/editor/lib/renderer.ts` - generatePreviewHtml producing self-contained HTML with embedded JS renderers
- `apps/web/src/features/editor/lib/preview-message.ts` - CONFIG_UPDATE postMessage type and sendConfigUpdate helper
- `apps/web/src/features/editor/hooks/use-editor-state.ts` - Editor state management: config, dirty tracking, save state, selected size
- `apps/web/src/features/editor/hooks/use-image-upload.ts` - Supabase Storage upload with advertiser-scoped paths
- `apps/web/src/features/editor/components/device-frame.tsx` - Desktop/mobile preview container with phone-frame styling
- `apps/web/src/features/editor/components/editor-preview.tsx` - Iframe preview with srcdoc + postMessage updates (150ms debounce)
- `apps/web/src/features/editor/components/image-upload.tsx` - Upload component with preview, clear, and loading state
- `apps/web/src/features/editor/components/editor-form.tsx` - Tabbed form with format-specific field sets for all 14 formats
- `apps/web/src/features/editor/components/editor-toolbar.tsx` - Toolbar with name input, format badge, device toggle, size selector, save button
- `apps/web/src/features/editor/components/editor-layout.tsx` - ResizablePanelGroup layout wiring toolbar, form, and preview
- `apps/web/src/features/editor/pages/editor-page.tsx` - Page component handling new/edit modes with save workflow
- `apps/web/src/router.tsx` - Added /creatives/new and /creatives/:id/edit lazy routes before /creatives
- `packages/shared/src/index.ts` - Added Json type export for template_data casting

## Decisions Made
- **zodResolver type cast:** The Zod schema's inferred input type includes `string | undefined` for optional fields with defaults, but TemplateConfig (the output type after defaults are applied) has plain `string`. Cast `zodResolver(schema) as Resolver<TemplateConfig>` to satisfy react-hook-form's strict type checking.
- **orientation prop:** react-resizable-panels v4 uses `orientation="horizontal"` not `direction`. Fixed after build error surfaced the API difference.
- **Json type export:** Added `Json` to the shared package exports so editor-page.tsx can cast `config as unknown as Json` when saving template_data to Supabase.
- **Temporary UUID for uploads:** New creatives don't have a database ID until first save. A `crypto.randomUUID()` generated at editor initialization provides a stable path prefix for image uploads. After save, the URL with the actual creative ID replaces the editor URL.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed zodResolver type mismatch with TemplateConfig**
- **Found during:** Task 2 (editor-form.tsx build)
- **Issue:** Zod schema input types have optional fields (`imageUrl?: string | undefined`) while TemplateConfig output types have required fields (`imageUrl: string`), causing TypeScript error with react-hook-form resolver
- **Fix:** Cast `zodResolver(schema) as Resolver<TemplateConfig>` -- safe because form defaultValues always provide concrete values
- **Files modified:** apps/web/src/features/editor/components/editor-form.tsx
- **Verification:** `tsc --noEmit` and `pnpm run build` pass cleanly

**2. [Rule 1 - Bug] Fixed ResizablePanelGroup direction prop**
- **Found during:** Task 2 (editor-layout.tsx build)
- **Issue:** Used `direction="horizontal"` but react-resizable-panels v4 API expects `orientation`
- **Fix:** Changed to `orientation="horizontal"`
- **Files modified:** apps/web/src/features/editor/components/editor-layout.tsx
- **Verification:** Build passes, no type errors

**3. [Rule 3 - Blocking] Exported Json type from shared package**
- **Found during:** Task 2 (editor-page.tsx build)
- **Issue:** `Json` type was defined in database.types.ts but not re-exported from the shared package index, causing import error
- **Fix:** Added `Json` to the export list in packages/shared/src/index.ts
- **Files modified:** packages/shared/src/index.ts
- **Verification:** Import resolves, build passes

---

**Total deviations:** 3 auto-fixed (2 bugs, 1 blocking)
**Impact on plan:** All auto-fixes necessary for correct compilation. No scope creep.

## Issues Encountered
None beyond the 3 auto-fixed build errors documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Editor is fully functional for creating and editing creatives with all 14 format types
- The generatePreviewHtml + postMessage pattern is established for Phases 5 (interactive renderers) and 6 (animated/video renderers) to extend with format-specific renderers
- Creatives CRUD API and hooks are ready for Plan 03 (My Creatives page) to consume
- The renderer currently has full implementations for static-banner, multi-frame, and in-feed; other formats show a placeholder that Phases 5/6 will replace
- Plan 03 will add fetchCreativeByToken (preview token column) and the public preview page

## Self-Check: PASSED

- All 13 created files verified present on disk
- Commit 70188b0 (Task 1) verified in git log
- Commit 2d5255f (Task 2) verified in git log
- TypeScript compilation: clean (no errors)
- Production build: clean (5.99s)
