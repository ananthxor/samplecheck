// ---------------------------------------------------------------------------
// CSV Export Utility
// ---------------------------------------------------------------------------

/**
 * Generate a CSV file and trigger a browser download.
 *
 * - Prefixes with UTF-8 BOM (\ufeff) for correct encoding in Excel / Google Sheets.
 * - Wraps cells containing commas, quotes, or newlines in double quotes
 *   with internal quotes doubled (RFC 4180 compliant).
 * - Revokes the object URL after triggering the download.
 */
export function exportToCsv(
  filename: string,
  headers: string[],
  rows: (string | number)[][]
): void {
  const BOM = '\ufeff'
  const headerLine = headers.join(',')
  const dataLines = rows.map((row) =>
    row
      .map((cell) => {
        const str = String(cell)
        // Escape cells containing commas, quotes, or newlines
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str
      })
      .join(',')
  )

  const csvContent = BOM + [headerLine, ...dataLines].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()

  URL.revokeObjectURL(url)
}
