import { useState, useRef } from 'react'
import { Upload, Download, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { parseTrackerExcel, downloadTrackerTemplate } from '../lib/tracker-excel'
import type { ParseResult } from '../lib/tracker-excel'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TrackerBulkUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Category = 'impression' | 'click' | 'conversion'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TrackerBulkUploadDialog({ open, onOpenChange }: TrackerBulkUploadDialogProps) {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<'idle' | 'previewing' | 'importing'>('idle')
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<Category>('impression')
  const [parsing, setParsing] = useState(false)

  function handleClose(open: boolean) {
    if (!open) {
      setStep('idle')
      setParseResult(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
    onOpenChange(open)
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setParsing(true)
    try {
      const result = await parseTrackerExcel(file)
      setParseResult(result)
      setStep('previewing')
    } catch {
      toast.error('Failed to read file')
    } finally {
      setParsing(false)
    }
  }

  async function handleConfirm() {
    if (!parseResult?.valid.length || !profile?.advertiser_id) return
    setStep('importing')
    try {
      const rows = parseResult.valid.map((row) => ({
        ...row,
        advertiser_id: profile.advertiser_id!,
      }))
      const { error } = await supabase.from('tracker_configs').insert(rows)
      if (error) throw new Error(error.message)
      toast.success(`${rows.length} tracker${rows.length === 1 ? '' : 's'} imported`)
      await queryClient.invalidateQueries({ queryKey: ['tracker-configs'] })
      handleClose(false)
    } catch (err) {
      toast.error(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setStep('previewing')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Upload Trackers</DialogTitle>
        </DialogHeader>

        {step === 'idle' && (
          <div className="space-y-6">
            {/* Sample template download */}
            <div className="rounded-lg border bg-muted/50 p-4">
              <p className="text-sm font-medium mb-3">1. Download a sample template</p>
              <div className="flex items-center gap-3">
                <Select
                  value={selectedCategory}
                  onValueChange={(v) => setSelectedCategory(v as Category)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="impression">Impression</SelectItem>
                    <SelectItem value="click">Click</SelectItem>
                    <SelectItem value="conversion">Conversion</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadTrackerTemplate(selectedCategory)}
                >
                  <Download className="mr-2 size-4" />
                  Download Template
                </Button>
              </div>
            </div>

            {/* File upload */}
            <div>
              <p className="text-sm font-medium mb-3">2. Upload your completed file</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                id="tracker-upload-input"
              />
              <label htmlFor="tracker-upload-input">
                <Button
                  variant="outline"
                  className="w-full h-20 border-dashed cursor-pointer"
                  disabled={parsing}
                  asChild
                >
                  <span>
                    <Upload className="mr-2 size-4" />
                    {parsing ? 'Parsing...' : 'Click to select .xlsx file'}
                  </span>
                </Button>
              </label>
            </div>
          </div>
        )}

        {step === 'previewing' && parseResult && (
          <div className="space-y-4">
            {/* Summary badges */}
            <div className="flex items-center gap-3">
              <Badge variant="default">{parseResult.valid.length} valid rows</Badge>
              {parseResult.errors.length > 0 && (
                <Badge variant="destructive">{parseResult.errors.length} errors</Badge>
              )}
            </div>

            {/* Errors list */}
            {parseResult.errors.length > 0 && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-1 max-h-32 overflow-y-auto">
                {parseResult.errors.map((e) => (
                  <div key={e.row} className="flex items-start gap-2 text-sm text-destructive">
                    <AlertCircle className="size-4 mt-0.5 shrink-0" />
                    <span>Row {e.row}: {e.message}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Preview table (valid rows) */}
            {parseResult.valid.length > 0 && (
              <div className="max-h-64 overflow-y-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Tracker URL</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parseResult.valid.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                          {row.tracker_url}
                        </TableCell>
                        <TableCell>{row.tracker_type}</TableCell>
                        <TableCell>{row.category}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {parseResult.valid.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No valid rows found. Fix the errors above and re-upload.
              </p>
            )}
          </div>
        )}

        {step === 'importing' && (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground text-sm">Importing trackers...</p>
          </div>
        )}

        <DialogFooter>
          {step === 'idle' && (
            <Button variant="outline" onClick={() => handleClose(false)}>
              Cancel
            </Button>
          )}
          {step === 'previewing' && (
            <>
              <Button variant="outline" onClick={() => { setStep('idle'); setParseResult(null) }}>
                Back
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!parseResult || parseResult.valid.length === 0}
              >
                Import {parseResult?.valid.length ?? 0} Trackers
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
