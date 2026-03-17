# Technology Stack: ScrollToday v2.0 Feature Additions

**Project:** ScrollToday v2.0
**Researched:** 2026-02-25
**Scope:** NEW dependencies only for v2.0 features. Existing stack (React 19, Recharts 3.7, Supabase, shadcn/ui, React Query, React Hook Form + Zod) is validated and not re-researched.

---

## New Dependencies Required

### 1. Excel Export & Import: SheetJS (xlsx)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| xlsx (SheetJS CE) | 0.20.3 | Read and write .xlsx files in the browser | Only library that handles both export AND import of Excel files. Proper ESM module that works with Vite out of the box. ~200KB gzipped (full build). Actively maintained via cdn.sheetjs.com. |

**Covers features:** XLS/Excel export for analytics reports, Bulk Excel upload for trackers.

**Installation (via CDN tarball, NOT npm registry):**
```bash
pnpm install --save https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
```

**Why SheetJS over ExcelJS:**
- ExcelJS (4.4.0) doubles Vite bundle size (~1.08MB) due to Node.js polyfills (`fs`, `stream`). Requires Vite `optimizeDeps` workarounds.
- SheetJS 0.20.3 is a proper ESM module designed for bundlers. No special Vite config needed.
- SheetJS handles both reading uploaded .xlsx files (via `XLSX.read(arrayBuffer)`) and writing new ones (via `XLSX.writeFile()`), so one library covers both the export and bulk-upload features.
- ExcelJS's styling features (cell colors, borders) are irrelevant -- ScrollToday exports data tables, not styled spreadsheets.

**Why NOT the npm registry version:**
- The npm registry `xlsx` package is stuck at 0.18.5 (5+ years old) with known security vulnerabilities. SheetJS stopped publishing to npm. The official distribution is via `cdn.sheetjs.com` tarballs. This is well-documented and widely adopted. [Source: SheetJS official docs](https://docs.sheetjs.com/docs/getting-started/installation/nodejs/)

**Confidence:** HIGH -- verified via official SheetJS documentation and Vite framework guide.

---

### 2. Chart-to-PNG Download: html-to-image

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| html-to-image | ^1.11.13 | Convert DOM nodes (Recharts charts) to PNG data URLs | Lightweight (~15KB), TypeScript types included, works by SVG foreignObject approach. 870K+ weekly downloads. No Canvas fallback issues with SVG-based Recharts output. |

**Covers feature:** PNG download of individual charts.

**Installation:**
```bash
pnpm install --save --filter @scrolltoday/web html-to-image
```

**Why html-to-image over alternatives:**

| Option | Verdict | Reason |
|--------|---------|--------|
| html-to-image | **Use this** | Modern fork of dom-to-image with TypeScript support, active maintenance, smallest bundle. SVG-based approach works well with Recharts (which renders SVG). |
| html2canvas | Reject | 1.4.1 is 4+ years stale. Canvas-based approach can have rendering inconsistencies with SVG charts. Larger bundle. |
| html2canvas-pro | Reject | Fork with fixes, but still canvas-based. Unnecessary when SVG approach works. |
| recharts-to-png | Reject | Wrapper around html2canvas. Adds unnecessary abstraction layer. Version 3.0.1 has uncertain Recharts v3 compatibility. Using html-to-image directly with a DOM ref is simpler and more reliable. |

**Usage pattern (no extra library needed for file download):**
```typescript
import { toPng } from 'html-to-image'

async function downloadChartAsPng(chartRef: HTMLDivElement, filename: string) {
  const dataUrl = await toPng(chartRef, { backgroundColor: '#ffffff' })
  const link = document.createElement('a')
  link.download = filename
  link.href = dataUrl
  link.click()
}
```

**Why NO file-saver dependency:** The project already uses the native `Blob` + `URL.createObjectURL` + anchor click pattern in `csv-export.ts`. The same pattern works for PNG download. `html-to-image` returns a data URL directly, so even the Blob step is unnecessary -- just set it as the anchor `href`. The `file-saver` package (2.0.5) hasn't been updated in 5 years and adds nothing over native browser APIs.

**Confidence:** HIGH -- html-to-image is well-established, TypeScript-native, and the SVG approach aligns with Recharts' SVG rendering.

---

### 3. Date Range Picker: react-day-picker + date-fns

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| react-day-picker | ^9.x | Calendar-based date range picker | Powers shadcn/ui's Calendar and DatePicker components. Required peer dependency for the shadcn/ui date picker with range selection. |
| date-fns | ^4.1.0 | Date formatting and manipulation | Required by react-day-picker. Tree-shakable (only import what you use). Functional API, no mutation. Used for formatting dates in the custom report builder's date range controls. |

**Covers feature:** Custom report builder with date range presets and custom date selection.

**Installation:**
```bash
pnpm install --save --filter @scrolltoday/web react-day-picker date-fns
```

**Context:** The existing `DateRangeSelect` component uses a simple `<Select>` dropdown with hardcoded presets (`7d`, `30d`, `90d`, `this-month`, `last-month`) and native `Date` arithmetic. This works for the current analytics page. However, the custom report builder requires:
- Arbitrary date range selection via calendar UI (not just presets)
- Visual calendar with range highlighting
- Preset buttons alongside the calendar

The shadcn/ui `DatePicker` with range mode provides this. It requires `react-day-picker` and `date-fns` as peer dependencies. Adding shadcn/ui Calendar and DatePicker components:

```bash
npx shadcn@latest add calendar
# This installs the Calendar component (uses react-day-picker internally)
# Then build a DateRangePicker composing Calendar + Popover
```

**Why date-fns is acceptable despite existing native Date usage:**
- The existing native Date code in `analytics-types.ts` handles simple preset calculations. That code stays as-is.
- `date-fns` is only needed as a `react-day-picker` peer dependency and for the report builder's more complex date formatting needs (locale-aware display, `format`, `startOfMonth`, `endOfMonth`).
- Tree-shaking means only imported functions are bundled. Typical usage adds ~3-5KB gzipped.
- Do NOT refactor existing native Date code to use date-fns. Both can coexist.

**Confidence:** HIGH -- shadcn/ui Calendar component documentation explicitly requires react-day-picker + date-fns.

---

## NO New Dependencies Required

These v2.0 features are implemented with the **existing stack** and do NOT need additional libraries:

### Hourly Breakdown Chart with Tooltip Interactions
- **Recharts 3.7** (already installed) supports `BarChart` with custom `<Tooltip content={<CustomTooltip />} />`.
- The hourly data comes from a new Supabase query grouping `ad_events` by hour. The chart rendering is standard Recharts.
- Custom tooltip component receives `{ active, payload, label }` props -- build a styled tooltip using existing shadcn/ui primitives.
- Time formatting for X-axis labels: use `Intl.DateTimeFormat` (native) or the newly-added `date-fns/format` for `HH:00` formatting.

### Billing Spend Summary Table with Pagination
- **shadcn/ui Table** (already installed at `components/ui/table.tsx`) provides the table markup.
- **shadcn/ui Pagination** component can be added via `npx shadcn@latest add pagination` -- this is a copy-paste component, not an npm dependency.
- **Client-side pagination** is sufficient. Billing transactions are typically hundreds of rows, not thousands. Use simple `Array.slice()` with page state.
- Do NOT add TanStack Table for this. TanStack Table is powerful but overkill for a simple paginated table with no sorting/filtering. The existing `TransactionTable` component pattern (manual `<Table>` markup) works fine with pagination state added.

### Custom Report Builder with Metric Checkboxes
- **shadcn/ui Checkbox** (already installed at `components/ui/checkbox.tsx`) for metric selection.
- **React Hook Form + Zod** (already installed) for the report builder form state (selected metrics, date range, data resolution).
- **Recharts** for rendering the resulting chart with only selected metrics.
- The "data resolution" dropdown (daily/weekly/monthly) is a `<Select>` component (already exists).

### Guide/Help Page (Static Content)
- Pure React components with shadcn/ui layout primitives (Card, Tabs, Separator).
- No CMS, no Markdown parser, no additional dependencies needed.
- Content is hardcoded in TSX. If content volume grows significantly later, add `@mdx-js/react` at that point -- not now.

---

## Alternatives Considered and Rejected

| Category | Recommended | Alternative | Why Rejected |
|----------|-------------|-------------|--------------|
| Excel I/O | SheetJS 0.20.3 (CDN) | ExcelJS 4.4.0 | Doubles Vite bundle size. Node.js polyfill issues in browser. Overkill styling features unused. |
| Excel I/O | SheetJS 0.20.3 (CDN) | xlsx 0.18.5 (npm) | Outdated, known vulnerabilities. Same library but 2+ years behind. |
| DOM-to-image | html-to-image 1.11.x | html2canvas 1.4.1 | Stale (4 years). Canvas-based, worse with SVG charts. Larger bundle. |
| DOM-to-image | html-to-image 1.11.x | recharts-to-png 3.0.1 | Wrapper around html2canvas. Uncertain Recharts v3 compat. Unnecessary abstraction. |
| File download | Native Blob+anchor | file-saver 2.0.5 | 5 years unmaintained. Native API does the same thing. Project already uses this pattern. |
| Date picker | react-day-picker 9 + date-fns 4 | react-datepicker | Does not integrate with shadcn/ui design system. Would require custom styling to match. |
| Date picker | react-day-picker 9 + date-fns 4 | dayjs | dayjs is smaller but date-fns is required by react-day-picker anyway. Adding dayjs alongside would be redundant. |
| Pagination | shadcn/ui Pagination + manual state | TanStack Table | Overkill for a single paginated table. Adds ~50KB. Manual pagination with `useState` is 20 lines of code. |
| Markdown | None (hardcoded TSX) | @mdx-js/react | Help page has fixed content. MDX adds build complexity for no benefit. Revisit if content becomes dynamic. |

---

## Installation Summary

```bash
# New npm dependencies for v2.0 (run from monorepo root)
pnpm install --save --filter @scrolltoday/web https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
pnpm install --save --filter @scrolltoday/web html-to-image
pnpm install --save --filter @scrolltoday/web react-day-picker date-fns

# New shadcn/ui components (copy-paste, no npm deps)
cd apps/web
npx shadcn@latest add calendar
npx shadcn@latest add pagination
npx shadcn@latest add popover  # if not already present, needed for DateRangePicker
```

**Total new npm packages: 4** (`xlsx`, `html-to-image`, `react-day-picker`, `date-fns`)
**Estimated bundle size impact:** ~220KB gzipped total (SheetJS ~200KB, html-to-image ~15KB, date-fns tree-shaken ~5KB, react-day-picker ~10KB). Consider lazy-loading the Excel export path via `React.lazy` + dynamic `import()` since SheetJS is the largest addition and only used on export actions.

---

## Integration Points with Existing Stack

| New Library | Integrates With | How |
|-------------|-----------------|-----|
| SheetJS (xlsx) | `csv-export.ts` pattern | Follow same Blob + anchor click download pattern. Replace CSV generation with `XLSX.utils.json_to_sheet()` + `XLSX.writeFile()`. |
| SheetJS (xlsx) | React Hook Form (bulk upload) | File input `<input type="file" accept=".xlsx,.xls" />` reads via `FileReader.readAsArrayBuffer()`, then `XLSX.read(buffer)` to parse. Validate rows with Zod schema before inserting via `trackers-api.ts`. |
| html-to-image | `MetricsChart` component | Add a `ref` to the chart's wrapper `<div>`, pass to `toPng()`. Download button triggers capture. |
| html-to-image | shadcn/ui chart.tsx `ChartContainer` | ChartContainer already wraps `ResponsiveContainer`. Add a forwarded ref for PNG capture. |
| react-day-picker | shadcn/ui Calendar | shadcn/ui Calendar IS react-day-picker with Tailwind styling. Just add the component. |
| date-fns | Report builder date display | `format(date, 'MMM d, yyyy')` for display. `startOfMonth`, `endOfMonth`, `subDays` for preset calculations in the report builder only. |

---

## What NOT to Add

| Do NOT Install | Why Not | What to Use Instead |
|----------------|---------|-------------------|
| `file-saver` | Unmaintained (5yr). Native `URL.createObjectURL` + anchor click does the same thing. Already used in `csv-export.ts`. | Native Blob + anchor pattern |
| `@tanstack/react-table` | Only one table needs pagination (billing). Manual pagination is trivial (~20 LOC). | `useState` + `Array.slice()` + shadcn/ui Pagination |
| `jspdf` | No PDF export requirement in v2.0 scope. | N/A |
| `moment` / `dayjs` | date-fns covers the need (react-day-picker peer dep). Adding a second date library is wasteful. | `date-fns` |
| `xlsx` from npm registry | Version 0.18.5 is outdated with security vulnerabilities. | SheetJS 0.20.3 from CDN tarball |
| `recharts-to-png` | Unnecessary wrapper. html-to-image is more direct and reliable with Recharts v3. | `html-to-image` directly |
| `react-markdown` / `@mdx-js/react` | Help page is static content. No CMS. TSX components suffice. | Hardcoded TSX |
| `papaparse` | Already have a working CSV export utility. SheetJS also handles CSV if needed. | Existing `csv-export.ts` + SheetJS |

---

## Version Compatibility Matrix

| New Package | Works With | Verified |
|-------------|------------|----------|
| xlsx 0.20.3 | Vite 6, ESM imports | YES -- SheetJS docs confirm framework/bundler support, ESM module |
| xlsx 0.20.3 | TypeScript 5.7 | YES -- ships with type declarations |
| html-to-image 1.11.x | React 19, any DOM element | YES -- framework-agnostic, operates on DOM refs |
| html-to-image 1.11.x | Recharts 3.7 SVG output | YES -- SVG foreignObject approach handles Recharts SVG |
| react-day-picker 9.x | React 19 | YES -- peer dependency `react@^16.8 \|\| ^17 \|\| ^18 \|\| ^19` |
| react-day-picker 9.x | shadcn/ui Calendar | YES -- shadcn/ui Calendar is built on react-day-picker |
| date-fns 4.1.x | react-day-picker 9.x | YES -- required peer dependency |
| date-fns 4.1.x | TypeScript 5.7 | YES -- first-class TypeScript support |

---

## Bundle Size Optimization Notes

1. **Lazy-load SheetJS:** The `xlsx` package is ~200KB gzipped. Since export/import actions are user-initiated (button clicks), use dynamic `import()`:
   ```typescript
   async function exportToExcel(data: any[]) {
     const XLSX = await import('xlsx')
     // ... generate and download
   }
   ```
   This keeps SheetJS out of the initial bundle and loads it only when the user clicks "Export to Excel".

2. **html-to-image is small:** At ~15KB, it can be statically imported without concern.

3. **date-fns tree-shaking:** Only import the specific functions you use:
   ```typescript
   import { format, startOfMonth, endOfMonth, subDays } from 'date-fns'
   ```
   Do NOT use `import * as dateFns from 'date-fns'`.

---

## Sources

- SheetJS CDN installation docs: https://docs.sheetjs.com/docs/getting-started/installation/nodejs/ -- HIGH confidence
- SheetJS Vite/framework integration: https://docs.sheetjs.com/docs/getting-started/installation/frameworks/ -- HIGH confidence
- SheetJS npm registry warning: https://cdn.sheetjs.com/xlsx/ -- HIGH confidence
- html-to-image npm: https://www.npmjs.com/package/html-to-image (v1.11.13, 870K weekly downloads) -- HIGH confidence
- html-to-image GitHub: https://github.com/bubkoo/html-to-image -- HIGH confidence
- ExcelJS bundle size issue: https://github.com/exceljs/exceljs/issues/1577 -- MEDIUM confidence
- ExcelJS browser compatibility issue: https://github.com/exceljs/exceljs/issues/810 -- MEDIUM confidence
- shadcn/ui Date Picker docs: https://ui.shadcn.com/docs/components/radix/date-picker -- HIGH confidence
- shadcn/ui Calendar docs: https://ui.shadcn.com/docs/components/radix/calendar -- HIGH confidence
- shadcn/ui Pagination docs: https://ui.shadcn.com/docs/components/radix/pagination -- HIGH confidence
- react-day-picker official site: https://daypicker.dev/ -- HIGH confidence
- date-fns npm (v4.1.0): https://www.npmjs.com/package/date-fns -- HIGH confidence
- Recharts v3 custom tooltip: https://recharts.github.io/en-US/api/Tooltip/ -- HIGH confidence
- recharts-to-png uncertain v3 compat: https://github.com/brammitch/recharts-to-png -- MEDIUM confidence
- Native file download pattern (MDN): https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL_static -- HIGH confidence

---

*Stack research for: ScrollToday v2.0 feature additions*
*Researched: 2026-02-25*
*Scope: New dependencies only -- existing stack validated and unchanged*
