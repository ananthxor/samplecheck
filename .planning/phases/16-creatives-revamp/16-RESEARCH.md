# Phase 16: Creatives Revamp - Research

**Researched:** 2026-03-07
**Domain:** React Router v7, component routing, URL param state initialization, CSS layout integration
**Confidence:** HIGH (all findings verified by direct codebase inspection)

---

## Summary

This phase is a surgical routing and wiring task — not a new feature build. All components already exist in the codebase. The work is: (1) fix the route table so `/creatives/new` renders the 4-step `CreativesSelector` instead of `EditorPage`, (2) restore `templates-page.tsx` to point at `CreativeList`, (3) update dashboard card links from `/creatives?type=slug` to `/creatives/new?type=slug`, (4) teach `CreativesSelector` to read the `?type=` URL param and skip to step 1 when present, and (5) resolve a CSS layout conflict where `creatives.css` assumes a fixed top-nav that does not exist.

The slug-to-category mapping requires explicit resolution. The dashboard `ad-types.ts` uses five slugs (`interactive`, `animated`, `video`, `standard`, `native`) but `fmtData.ts` has five category keys (`interactive`, `animated`, `desktop`, `native`, `standard-banners`). Three slugs map cleanly; `video` has no matching category at all in fmtData (closest match is `animated` or `desktop`); `standard` must map to `standard-banners`. This discrepancy is the single most important design decision for the planner to make explicit.

The `CreativesSelector` component (`creatives-selector.tsx`) is a self-contained 4-step state machine (`step: 0|1|2|3|4`). It currently accepts no props and reads no URL params — initialization must be added. The `pickCategory` function already contains the full logic for advancing from step 0 to step 1 or step 2, so deep-linking into a pre-selected category is a matter of calling that logic on mount via `useEffect` or `useSearchParams`.

**Primary recommendation:** Add a `initialCategoryKey?: string` prop to `CreativesSelector`, call `pickCategory` inside a `useEffect` on mount when the prop is set, and pass it from a thin wrapper page that reads `useSearchParams`. Do NOT inline URL-param reading into `CreativesSelector` itself — keep it a pure presentational state machine so it remains testable and reusable.

---

## Standard Stack

### Core (all already installed — no new packages needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-router | ^7.13.0 | Routing, `useSearchParams`, `Link` | Already the project router |
| React | (workspace) | Component framework | Project standard |

### No new installations required

All components, CSS, and data files are already present. This phase is pure wiring.

---

## Architecture Patterns

### Current File Layout (as of research date)

```
apps/web/src/
├── features/
│   ├── dashboard/
│   │   ├── components/
│   │   │   ├── ad-type-card.tsx        # Link points to /creatives?type={slug}  ← CHANGE THIS
│   │   │   └── ad-type-grid.tsx
│   │   ├── data/
│   │   │   └── ad-types.ts             # AD_TYPES with slugs: interactive, animated, video, standard, native
│   │   └── pages/
│   │       └── dashboard-page.tsx
│   ├── creatives/
│   │   ├── components/
│   │   │   └── creative-list.tsx       # The "My Creatives" list — has "Create New" button navigating to /creatives?type=all  ← CHANGE THIS
│   │   ├── api/
│   │   │   └── creatives-api.ts
│   │   └── pages/
│   │       └── creatives-page.tsx      # Currently: if ?type → <TemplatesPage />, else → <CreativeList />  ← SIMPLIFY
│   └── templates/
│       ├── components/
│       │   └── FormElements.tsx
│       ├── data/
│       │   └── fmtData.ts              # adCategories with keys: interactive, animated, desktop, native, standard-banners
│       ├── pages/
│       │   ├── templates-page.tsx      # Currently: export { default } from './creatives-selector'  ← RESTORE
│       │   ├── creatives-selector.tsx  # 4-step browser — needs URL param support added
│       │   └── format-details-modal.tsx
│       └── styles/
│           ├── creatives.css           # Has margin-top: 84px assuming fixed top-nav  ← CSS FIX NEEDED
│           └── details.css
└── router.tsx                          # /creatives/new → EditorPage  ← CHANGE
```

### Pattern 1: Route Table Change (router.tsx)

**What:** Change `/creatives/new` to render `CreativesSelector` (wrapped in a thin page). Add it as a child of `AppShell`.

**Current state:**
```typescript
// router.tsx — CURRENT (wrong for this phase)
{
  path: '/creatives/new',
  lazy: async () => {
    const { default: Component } = await import(
      '@/features/editor/pages/editor-page'
    )
    return { Component }
  },
},
```

**Target state:**
```typescript
// router.tsx — TARGET
{
  path: '/creatives/new',
  lazy: async () => {
    const { default: Component } = await import(
      '@/features/templates/pages/creatives-new-page'
    )
    return { Component }
  },
},
```

The planner should create a NEW thin page `creatives-new-page.tsx` in `templates/pages/` rather than modifying `creatives-selector.tsx` directly. This keeps concerns separated.

### Pattern 2: URL Param Reading (React Router v7)

**What:** The thin page reads `?type=` and passes it to `CreativesSelector`.

**Source:** Direct codebase inspection — `creatives-page.tsx` and `editor-page.tsx` already use this exact pattern.

```typescript
// Source: apps/web/src/features/creatives/pages/creatives-page.tsx (verified)
import { useSearchParams } from 'react-router'

export default function CreativesNewPage() {
  const [searchParams] = useSearchParams()
  const typeSlug = searchParams.get('type') // e.g. "interactive", "animated"
  return <CreativesSelector initialCategoryKey={typeSlug ?? undefined} />
}
```

### Pattern 3: CreativesSelector Initialization via useEffect

**What:** `CreativesSelector` receives `initialCategoryKey?: string` prop and uses `useEffect` to call `pickCategory` once on mount if the key is present.

**Current state of `Creatives` component (verified in creatives-selector.tsx):**
```typescript
// Source: apps/web/src/features/templates/pages/creatives-selector.tsx (verified)
export default function Creatives() {
    const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0);
    const [activeCatId, setActiveCatId] = useState<string | null>(null);
    // ... no props, no URL param reading

    const pickCategory = (id: string) => {
        const cat = adCategories.find((c) => c.id === id)!;
        setActiveCatId(id);
        setActiveSizeId(cat.hasAdSizes ? null : "_direct");
        setSelectedFormatId(null);
        resetCustomData();
        setSearch("");
        setDirection("forward");
        setStep(cat.hasAdSizes ? 1 : 2);  // ← 1 = Ad Size step, 2 = Ad Format step
        // ...
    };
```

**Target — add prop + useEffect:**
```typescript
interface CreativesProps {
    initialCategoryKey?: string;
}

export default function Creatives({ initialCategoryKey }: CreativesProps = {}) {
    // ... existing state ...

    // On mount: if initialCategoryKey is provided, skip step 0
    useEffect(() => {
        if (!initialCategoryKey) return;
        const cat = adCategories.find((c) => c.key === initialCategoryKey);
        if (cat) pickCategory(cat.id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // run once on mount only
```

Note: `pickCategory` looks up by `id`, but `initialCategoryKey` is a `key` string. The lookup must use `c.key === initialCategoryKey` to find the category first, then pass `cat.id` to `pickCategory`.

### Pattern 4: CreativesPage Simplification

**What:** `creatives-page.tsx` currently has branching logic for `?type` params. After this phase, it should always render `CreativeList` — no branching needed.

**Current (wrong):**
```typescript
// apps/web/src/features/creatives/pages/creatives-page.tsx — CURRENT
if (typeFilter || formatFilter) {
  return <TemplatesPage />
}
return <CreativeList />
```

**Target (simple):**
```typescript
// TARGET
export default function CreativesPage() {
  return <CreativeList />
}
```

### Pattern 5: templates-page.tsx Restore

**Current (wrong):**
```typescript
// apps/web/src/features/templates/pages/templates-page.tsx — CURRENT
export { default } from './creatives-selector'
```

**Target (restored to meaningful state or removed entirely):**
`templates-page.tsx` is no longer needed as a routing target after this phase. The planner can either:
- Option A: Restore it to re-export `CreativeList` (keeps backward compat)
- Option B: Delete it (clean) — but must verify no other imports reference it

`creatives-page.tsx` currently imports `TemplatesPage` — once `creatives-page.tsx` is simplified to just render `CreativeList`, the import of `TemplatesPage` is also removed, so `templates-page.tsx` can be deleted.

### Anti-Patterns to Avoid

- **Reading `useSearchParams` inside `CreativesSelector`:** Couples a reusable UI state machine to routing. Keep the selector pure — pass state in via props.
- **Putting the new route at `/creatives` with conditional rendering:** The requirement is two distinct URLs for two distinct views. Do not collapse them into one route with conditional logic.
- **Modifying `pickCategory` to also accept a `key` string:** `pickCategory` works with `id` strings internally. Add the `key→id` lookup only at the initialization boundary (the `useEffect`).
- **Removing the `useEffect` dependency array:** Without `[]`, the initialization fires on every render. It must run only once on mount.

---

## Slug-to-Category Mapping (CRITICAL)

This is the most important design decision for the planner to resolve explicitly.

### Dashboard slugs vs fmtData category keys

| Dashboard slug (ad-types.ts) | fmtData category key | fmtData category name | Match? |
|-------------------------------|---------------------|----------------------|--------|
| `interactive` | `interactive` | "Interactive Ads" | EXACT |
| `animated` | `animated` | "Animated Ads" | EXACT |
| `video` | _(none)_ | _(no video category exists)_ | MISSING |
| `standard` | `standard-banners` | "Standard Banners" | KEY MISMATCH |
| `native` | `native` | "Native Ads" | EXACT |

### Resolution options for `video`

The fmtData has no "Video Ads" category. The dashboard's `video` AdType has formats like "Video with End Card" and "Click to Play" which map to the old renderer-based templates (not fmtData). Options:

1. **Map `video` → `animated`** — closest category in fmtData (Animated Ads includes video formats)
2. **Map `video` → show all formats (step 0)** — treat as "no pre-selection, start at step 0"
3. **Add a `video` category to fmtData** — out of scope for this phase per the success criteria

**Recommendation:** Option 2 — when `?type=video`, render `CreativesSelector` without pre-selection (full 4-step flow starting at step 0). This is the safest, most honest behavior until a video category exists in fmtData.

### Resolution for `standard`

Dashboard slug `standard` must map to fmtData key `standard-banners`. The `initialCategoryKey` lookup uses `c.key === initialCategoryKey`. So either:
- Pass `standard-banners` from the dashboard (change `ad-types.ts` slug), or
- Add a slug normalization map in `creatives-new-page.tsx`

**Recommendation:** Add a normalization map in `creatives-new-page.tsx` — one small lookup object. This is less disruptive than changing `ad-types.ts` slugs (which might affect other features).

```typescript
// Normalization map in creatives-new-page.tsx
const SLUG_TO_CATEGORY_KEY: Record<string, string> = {
  interactive: 'interactive',
  animated: 'animated',
  // video: no mapping — falls through to undefined (step 0)
  standard: 'standard-banners',
  native: 'native',
};
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| URL param reading | Custom URL parsing | `useSearchParams` from `react-router` | Already in use in this codebase in 3 places |
| Lazy route loading | Eager imports | `lazy:` pattern already in router.tsx | Consistent with all other routes |
| Category lookup | String matching heuristics | Direct `c.key === slug` lookup on `adCategories` | Keys are stable string identifiers |

**Key insight:** Everything needed already exists. The only new code is: one thin page, one prop addition, one `useEffect`, and one normalization map. Total new lines: ~50.

---

## Common Pitfalls

### Pitfall 1: CSS Layout Conflict — margin-top: 84px

**What goes wrong:** `creatives.css` has `.cr-page { margin-top: 84px; }` which assumes a fixed top-navigation bar 84px tall. This project uses a sidebar layout (`AppShell` → `SidebarProvider` → `SidebarInset`) with no fixed top navbar. The `84px` margin will create a large blank gap at the top of the page.

**Why it happens:** The CSS was copied from the Scroll Today Creatives project which had a different layout shell.

**How to avoid:** Override or remove `margin-top: 84px` on `.cr-page` when rendered inside this app. Options:
- Add `margin-top: 0` in `creatives-new-page.tsx` or in the page wrapper div
- Conditionally remove it via a wrapper class
- Accept the gap if AppHeader provides equivalent spacing (verify by inspecting AppHeader height)

**Warning signs:** When the page renders, there will be a big white gap above the stepper.

### Pitfall 2: useEffect Infinite Loop on pickCategory

**What goes wrong:** If `pickCategory` is listed in the `useEffect` dependency array, the effect re-runs whenever `pickCategory` is recreated (which is every render since it's defined inline in the component body). This causes an infinite render loop.

**Why it happens:** `pickCategory` is not memoized with `useCallback` in the current code.

**How to avoid:** Use `[]` as the dependency array (run once on mount). Add an `eslint-disable` comment to suppress the exhaustive-deps warning, since this is intentional.

### Pitfall 3: `creatives/new` Route Conflict

**What goes wrong:** The current router has `/creatives/new` pointing to `EditorPage`. If this route is changed to `CreativesNewPage`, the editor will need a different way to access "create new creative" after a format is selected in the browser.

**Why it happens:** The phase description says the selector replaces `/creatives/new`, but `EditorPage` also used this path.

**How to avoid:** The selector's step 3 "Customize" and step 4 "Publish" are its own built-in customization + publish flow (confirmed in `creatives-selector.tsx` — it has `handleFinalize` logic). The new `/creatives/new` route shows the selector, and the editor is accessed via `/creatives/:id/edit` for existing creatives. The "Create New" button from `CreativeList` must also be updated (currently navigates to `/creatives?type=all` — change to `/creatives/new`).

### Pitfall 4: category.id vs category.key Confusion

**What goes wrong:** `pickCategory` takes a category `id` string (e.g., `"cat-1"`), but URL params and dashboard slugs use `key` strings (e.g., `"interactive"`). Passing a `key` to `pickCategory` will silently fail — `adCategories.find((c) => c.id === "interactive")` returns `undefined`, and `pickCategory` will crash with a non-null assertion (`!`).

**Why it happens:** The component's internal API uses auto-generated IDs (`cat-1`, `cat-2`, ...) while the external slug system uses human-readable keys.

**How to avoid:** Always do a two-step lookup: `key → category object → category.id`, then pass the `id` to `pickCategory`.

### Pitfall 5: CreativeList "Create New" and "Browse Templates" Buttons Not Updated

**What goes wrong:** `creative-list.tsx` has two navigation calls that go to `/creatives?type=all`:
```typescript
onClick={() => navigate('/creatives?type=all')}  // appears in two places
```
These must be changed to `/creatives/new`. If forgotten, clicking "Create New" from the list will loop back to the list (since `creatives-page.tsx` will no longer do format-browsing).

**Warning signs:** Clicking "Create New" or "Browse Templates" from the Creatives list page goes nowhere useful.

---

## Code Examples

Verified patterns from direct codebase inspection:

### Reading URL Params (existing pattern in this codebase)
```typescript
// Source: apps/web/src/features/creatives/pages/creatives-page.tsx (verified)
import { useSearchParams } from 'react-router'

const [searchParams] = useSearchParams()
const typeFilter = searchParams.get('type')  // returns null if absent
```

### Lazy Route (existing pattern in router.tsx)
```typescript
// Source: apps/web/src/router.tsx (verified)
{
  path: '/creatives/new',
  lazy: async () => {
    const { default: Component } = await import(
      '@/features/templates/pages/creatives-new-page'
    )
    return { Component }
  },
},
```

### Category key lookup (derived from fmtData structure, verified)
```typescript
// Source: apps/web/src/features/templates/data/fmtData.ts (verified)
// adCategories[0].key === "interactive"
// adCategories[1].key === "animated"
// adCategories[2].key === "desktop"
// adCategories[3].key === "native"
// adCategories[4].key === "standard-banners"

const cat = adCategories.find((c) => c.key === normalizedKey);
if (cat) pickCategory(cat.id);  // pickCategory uses cat.id internally
```

### pickCategory signature (verified in creatives-selector.tsx)
```typescript
// Source: apps/web/src/features/templates/pages/creatives-selector.tsx (verified)
const pickCategory = (id: string) => {
    const cat = adCategories.find((c) => c.id === id)!;  // uses .id, not .key
    setActiveCatId(id);
    setActiveSizeId(cat.hasAdSizes ? null : "_direct");
    setSelectedFormatId(null);
    resetCustomData();
    setSearch("");
    setDirection("forward");
    setStep(cat.hasAdSizes ? 1 : 2);
    // ...
};
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| `/creatives?type=slug` routing (pre-phase) | `/creatives/new?type=slug` routing (post-phase) | Clean separation of list vs. creation flow |
| `templates-page.tsx` re-exports selector | `templates-page.tsx` removed or restored | Removes confusion |
| `creatives-page.tsx` conditionally renders selector | `creatives-page.tsx` always renders `CreativeList` | Simpler, cleaner |
| `CreativesSelector` has no external initialization | `CreativesSelector` accepts `initialCategoryKey` prop | Enables deep-linking |

---

## Open Questions

1. **What does `/creatives/new` do AFTER format selection completes?**
   - What we know: Step 3 ("Customize") and step 4 ("Publish") in `CreativesSelector` are fully self-contained with their own `handleFinalize` function that generates a random 24-char ID and formats a date string. This is prototype/stub logic — it does not save to Supabase.
   - What's unclear: Should the selector's "Publish" button eventually call the creatives API and redirect to `/creatives/:id/edit`? Or is the whole flow self-contained for now?
   - Recommendation: For this phase, leave the existing stub logic in place. Do not wire up API calls — that would expand scope significantly.

2. **Should the `video` slug map to `animated` or show step 0?**
   - What we know: There is no `video` category in fmtData. The closest is `animated` (includes video formats). Dashboard has 2 video formats: "Video with End Card" and "Click to Play".
   - Recommendation: Map to step 0 (no pre-selection) for now. Document this clearly so it can be revisited when a video category is added to fmtData.

3. **CSS margin-top: 84px — accept or fix?**
   - What we know: `AppShell` uses a sidebar layout. `AppHeader` height is not hardcoded in the shell — it uses standard flex layout within `SidebarInset`. The 84px top margin in `creatives.css` will create visible blank space.
   - Recommendation: Override with `margin-top: 0` in the page wrapper. A zero-margin div wrapping `.cr-page` is the cleanest fix without touching the copied CSS file.

---

## Sources

### Primary (HIGH confidence — direct codebase inspection)

- `apps/web/src/router.tsx` — current route definitions, `/creatives/new` → `EditorPage`, lazy loading pattern
- `apps/web/src/features/templates/pages/creatives-selector.tsx` — full component, state machine, `pickCategory` function
- `apps/web/src/features/templates/data/fmtData.ts` — all 5 categories with keys, 498 formats structure
- `apps/web/src/features/dashboard/data/ad-types.ts` — 5 AD_TYPES slugs
- `apps/web/src/features/dashboard/components/ad-type-card.tsx` — current Link href: `/creatives?type={slug}`
- `apps/web/src/features/creatives/components/creative-list.tsx` — "Create New" navigates to `/creatives?type=all` (2 places)
- `apps/web/src/features/creatives/pages/creatives-page.tsx` — current branching logic + `useSearchParams` pattern
- `apps/web/src/features/templates/pages/templates-page.tsx` — current state: `export { default } from './creatives-selector'`
- `apps/web/src/components/layout/app-shell.tsx` — sidebar layout, no fixed top nav
- `apps/web/src/features/templates/styles/creatives.css` — `margin-top: 84px` CSS issue

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — React Router v7 confirmed in package.json, `useSearchParams` pattern verified in 3 existing files
- Architecture: HIGH — all component structures verified by direct file reads
- Pitfalls: HIGH — CSS issue, ID vs key confusion, and stale navigation links all verified by direct inspection
- Slug mapping: HIGH — all category keys and dashboard slugs verified by direct inspection; the `video` gap is a confirmed fact not an assumption

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (stable codebase, no fast-moving dependencies)

---

## File Change Summary (for Planner)

| File | Action | What Changes |
|------|--------|-------------|
| `apps/web/src/router.tsx` | MODIFY | `/creatives/new` → import `creatives-new-page` instead of `editor-page` |
| `apps/web/src/features/templates/pages/creatives-new-page.tsx` | CREATE NEW | Thin page: reads `?type=`, normalizes slug, renders `<Creatives initialCategoryKey={...} />` |
| `apps/web/src/features/templates/pages/creatives-selector.tsx` | MODIFY | Add `initialCategoryKey?: string` prop + `useEffect` initialization |
| `apps/web/src/features/templates/pages/templates-page.tsx` | DELETE or RESTORE | No longer used as route target; remove import from `creatives-page.tsx` first |
| `apps/web/src/features/creatives/pages/creatives-page.tsx` | MODIFY | Remove branching logic, always render `<CreativeList />` |
| `apps/web/src/features/creatives/components/creative-list.tsx` | MODIFY | Change 2x `navigate('/creatives?type=all')` to `navigate('/creatives/new')` |
| `apps/web/src/features/dashboard/components/ad-type-card.tsx` | MODIFY | Change `Link to="/creatives?type={slug}"` to `Link to="/creatives/new?type={slug}"` |
| `apps/web/src/features/templates/styles/creatives.css` | MODIFY (optional) | Override `margin-top: 84px` or wrap in page with `mt-0` |
