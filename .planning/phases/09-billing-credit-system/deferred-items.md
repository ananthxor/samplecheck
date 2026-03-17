# Deferred Items - Phase 09

## Pre-existing Build Errors (Out of Scope)

**File:** `apps/web/src/features/campaigns/pages/campaign-detail-page.tsx`
**Errors:**
- TS6133: 'Loader2' is declared but its value is never read (line 10)
- TS6133: 'Badge' is declared but its value is never read (line 25)
- TS6133: 'STATUS_VARIANT' is declared but its value is never read (line 63)

**Origin:** Phase 7 (campaign management). These unused imports existed before Phase 9 execution.
**Impact:** Build fails due to `tsc -b` strict mode, but these are unused variable warnings, not logic errors.
**Recommendation:** Remove unused imports in a cleanup pass.
