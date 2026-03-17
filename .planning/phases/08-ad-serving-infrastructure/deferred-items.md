# Phase 8: Deferred Items

## Pre-existing Build Errors (Out of Scope)

These build errors exist before Phase 8 changes and are not caused by this phase's work:

1. **campaign-detail-page.tsx** - Unused imports: `Loader2`, `Badge`, `STATUS_VARIANT` (TS6133)
2. **editor-preview.tsx** - TemplateConfig type mismatch with renderer functions (TS2345) - lines 26, 34, 42
3. **preview-page.tsx** - Same TemplateConfig type mismatch (TS2345) - line 64

These should be addressed in a dedicated cleanup task or as part of the "Creatives save/reload fidelity rework" pending todo in STATE.md.
