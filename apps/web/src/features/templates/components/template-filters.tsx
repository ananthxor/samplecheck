import { AD_TYPES } from '@/features/dashboard/data/ad-types'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface TemplateFiltersProps {
  selectedType: string | null
  selectedFormat: string | null
  onTypeChange: (type: string | null) => void
  onFormatChange: (format: string | null) => void
}

export function TemplateFilters({
  selectedType,
  selectedFormat,
  onTypeChange,
  onFormatChange,
}: TemplateFiltersProps) {
  // Build format options based on selected type
  const formatOptions = selectedType
    ? AD_TYPES.find((t) => t.id === selectedType)?.formats ?? []
    : AD_TYPES.flatMap((t) => t.formats)

  const hasActiveFilter = selectedType !== null || selectedFormat !== null

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Ad Type select */}
      <Select
        value={selectedType ?? 'all'}
        onValueChange={(value) => {
          const newType = value === 'all' ? null : value
          onTypeChange(newType)
          // Reset format when type changes
          onFormatChange(null)
        }}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Ad Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          {AD_TYPES.map((adType) => (
            <SelectItem key={adType.id} value={adType.id}>
              {adType.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Format select */}
      <Select
        value={selectedFormat ?? 'all'}
        onValueChange={(value) => {
          onFormatChange(value === 'all' ? null : value)
        }}
      >
        <SelectTrigger className="w-[220px]">
          <SelectValue placeholder="Format" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Formats</SelectItem>
          {formatOptions.map((format) => (
            <SelectItem key={format.id} value={format.id}>
              {format.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear filters */}
      {hasActiveFilter && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onTypeChange(null)
            onFormatChange(null)
          }}
          className="gap-1 text-muted-foreground"
        >
          <X className="size-4" />
          Clear filters
        </Button>
      )}
    </div>
  )
}
