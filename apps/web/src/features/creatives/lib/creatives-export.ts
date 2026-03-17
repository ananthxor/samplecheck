import { utils, writeFile } from 'xlsx'
import type { Tables } from '@scrolltoday/shared'
import { PLATFORMS } from '@/features/campaigns/lib/platform-macros'
import type { PlatformConfig } from '@/features/campaigns/lib/platform-macros'
import { generatePlatformTag } from '@/features/campaigns/lib/tag-generator'

// ---------------------------------------------------------------------------
// Creative Tag Excel Export
// ---------------------------------------------------------------------------
// Generates Excel files matching the Airtory Test2.xls format:
//   - Creative info header rows (name, type, format, dimensions, etc.)
//   - One column per platform with the platform-specific embed code
// ---------------------------------------------------------------------------

function buildTag(creative: Tables<'creatives'>, platform: PlatformConfig): string {
  if (!creative.bundle_url) return ''
  return generatePlatformTag(
    {
      bundleUrl: creative.bundle_url,
      creativeId: creative.id,
      width: creative.width ?? 300,
      height: creative.height ?? 250,
    },
    platform
  )
}

/**
 * Export an Excel file with all platform tags for a creative.
 * Layout matches the Airtory Test2.xls reference format.
 */
export function exportAllPlatformTags(creative: Tables<'creatives'>): void {
  const wb = utils.book_new()

  // --- Build the sheet as a 2D array (aoa) for full layout control ---
  const aoa: (string | number)[][] = []

  // Row 1: Header
  aoa.push(['CREATIVE INFORMATION'])
  // Rows 2-7: Creative metadata
  aoa.push(['Creative Name', creative.name])
  aoa.push(['Format', creative.format_name])
  aoa.push(['Dimensions', `${creative.width ?? 300}x${creative.height ?? 250}`])
  aoa.push(['Status', creative.status])
  aoa.push(['Creative ID', creative.id])
  // Row 7: Empty separator
  aoa.push([])

  // Row 8: Platform names header
  const platformNames = PLATFORMS.map((p) => p.name)
  aoa.push(platformNames)

  // Row 9: Platform-specific embed codes
  const tags = PLATFORMS.map((p) => buildTag(creative, p))
  aoa.push(tags)

  const ws = utils.aoa_to_sheet(aoa)

  // Set column widths — first col wider for labels, rest auto
  ws['!cols'] = [{ wch: 25 }, ...PLATFORMS.map(() => ({ wch: 40 }))]

  utils.book_append_sheet(wb, ws, 'Platform Tags')
  writeFile(wb, `${creative.name || 'creative'}.xlsx`)
}

/**
 * Export an Excel file with a single platform's tag.
 */
export function exportSelectedPlatformTag(
  creative: Tables<'creatives'>,
  platform: PlatformConfig
): void {
  const wb = utils.book_new()

  const aoa: (string | number)[][] = []
  aoa.push(['CREATIVE INFORMATION'])
  aoa.push(['Creative Name', creative.name])
  aoa.push(['Format', creative.format_name])
  aoa.push(['Dimensions', `${creative.width ?? 300}x${creative.height ?? 250}`])
  aoa.push(['Status', creative.status])
  aoa.push(['Creative ID', creative.id])
  aoa.push([])
  aoa.push([platform.name])
  aoa.push([buildTag(creative, platform)])

  const ws = utils.aoa_to_sheet(aoa)
  ws['!cols'] = [{ wch: 25 }, { wch: 60 }]

  utils.book_append_sheet(wb, ws, platform.name)
  writeFile(wb, `${creative.name || 'creative'}.xlsx`)
}
