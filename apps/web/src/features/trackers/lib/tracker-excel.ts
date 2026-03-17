import { read, utils, writeFile } from 'xlsx'
import { trackerConfigSchema } from '@/features/campaigns/lib/tracker-types'
import type { TrackerConfigFormData } from '@/features/campaigns/lib/tracker-types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ParseResult {
  valid: TrackerConfigFormData[]
  errors: { row: number; message: string }[]
}

// ---------------------------------------------------------------------------
// parseTrackerExcel
// ---------------------------------------------------------------------------

/**
 * Parse an Excel file into tracker config rows.
 * Accepts headers in both human-readable and snake_case forms:
 *   "Name" | "name"
 *   "Tracker URL" | "tracker_url"
 *   "Type" | "tracker_type"
 *   "Category" | "category"
 * Normalizes values to lowercase for enum fields before Zod validation.
 */
export function parseTrackerExcel(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer)
        const wb = read(data, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]!]
        if (!ws) {
          resolve({ valid: [], errors: [{ row: 0, message: 'Empty or unreadable file' }] })
          return
        }
        const rows = utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })

        const valid: TrackerConfigFormData[] = []
        const errors: { row: number; message: string }[] = []

        rows.forEach((rawRow, i) => {
          const result = trackerConfigSchema.safeParse({
            name: String(rawRow['Name'] ?? rawRow['name'] ?? '').trim(),
            tracker_url: String(rawRow['Tracker URL'] ?? rawRow['tracker_url'] ?? '').trim(),
            tracker_type: String(rawRow['Type'] ?? rawRow['tracker_type'] ?? 'pixel').toLowerCase().trim(),
            category: String(rawRow['Category'] ?? rawRow['category'] ?? 'impression').toLowerCase().trim(),
          })
          if (result.success) {
            valid.push(result.data)
          } else {
            errors.push({
              row: i + 2, // Excel row 1 = header, row 2 = first data row
              message: result.error.issues[0]?.message ?? 'Invalid row',
            })
          }
        })

        resolve({ valid, errors })
      } catch {
        resolve({ valid: [], errors: [{ row: 0, message: 'Failed to parse file. Is it a valid .xlsx file?' }] })
      }
    }
    reader.readAsArrayBuffer(file)
  })
}

// ---------------------------------------------------------------------------
// downloadTrackerTemplate
// ---------------------------------------------------------------------------

/**
 * Download a sample tracker template Excel file for a given category.
 * Produces one sample data row + header row.
 */
export function downloadTrackerTemplate(category: 'impression' | 'click' | 'conversion'): void {
  const sampleData = [
    {
      Name: `My ${category} tracker`,
      'Tracker URL': 'https://tracking.example.com/pixel?cb=%%CACHEBUSTER%%',
      Type: 'pixel',
      Category: category,
    },
  ]
  const ws = utils.json_to_sheet(sampleData)
  const wb = utils.book_new()
  utils.book_append_sheet(wb, ws, 'Trackers')
  writeFile(wb, `tracker-template-${category}.xlsx`)
}
