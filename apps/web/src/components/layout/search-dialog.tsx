import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  LayoutDashboard,
  Palette,
  Megaphone,
  BarChart3,
  Crosshair,
  CreditCard,
  BookOpen,
  Settings,
} from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { AD_TYPES } from '@/features/dashboard/data/ad-types'
import { findFormatById } from '@/features/templates/data/fmtData'
import type { LucideIcon } from 'lucide-react'

interface PlatformSection {
  name: string
  url: string
  icon: LucideIcon
}

const platformSections: PlatformSection[] = [
  { name: 'Dashboard', url: '/', icon: LayoutDashboard },
  { name: 'Creatives', url: '/creatives', icon: Palette },
  { name: 'Campaigns', url: '/campaigns', icon: Megaphone },
  { name: 'Trackers', url: '/trackers', icon: Crosshair },
  { name: 'Analytics', url: '/analytics', icon: BarChart3 },
  { name: 'Billing', url: '/billing', icon: CreditCard },
  { name: 'Guide', url: '/guide', icon: BookOpen },
  { name: 'Settings', url: '/settings', icon: Settings },
]

/** Flat list built once at module level — no per-render work */
const ALL_FORMATS = AD_TYPES.flatMap((type) =>
  type.formats.map((format) => {
    // Build the full URL: /creatives/new/{cat}/{size?}/{formatId}
    const info = findFormatById(format.id)
    let url = '/creatives/new'
    if (info) {
      const cat = info.category
      url = info.size
        ? `/creatives/new/${cat.key}/${info.size.key}/${format.id}`
        : `/creatives/new/${cat.key}/${format.id}`
    }
    return {
      id: format.id,
      name: format.name,
      typeName: type.name,
      typeIcon: type.icon,
      url,
      // pre-lowercased for fast search
      _lc: `${format.name} ${type.name}`.toLowerCase(),
    }
  }),
)

const MAX_FORMAT_RESULTS = 25

interface SearchDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function SearchDialog({ open: controlledOpen, onOpenChange }: SearchDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen

  const setOpen = useCallback(
    (value: boolean) => {
      if (onOpenChange) {
        onOpenChange(value)
      }
      if (!isControlled) {
        setInternalOpen(value)
      }
      // Reset query when closing
      if (!value) setQuery('')
    },
    [isControlled, onOpenChange],
  )

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(!open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [open, setOpen])

  const handleSelect = useCallback(
    (url: string) => {
      setOpen(false)
      navigate(url)
    },
    [navigate, setOpen],
  )

  /** Only compute matching formats when there's a query — avoids rendering 500 items on open */
  const filteredFormats = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    const matches = []
    for (const fmt of ALL_FORMATS) {
      if (fmt._lc.includes(q)) {
        matches.push(fmt)
        if (matches.length >= MAX_FORMAT_RESULTS) break
      }
    }
    return matches
  }, [query])

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Search"
      description="Search across ad formats and platform sections"
    >
      <CommandInput
        placeholder="Search ad formats, sections..."
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Platform Sections">
          {platformSections.map((section) => {
            const SectionIcon = section.icon
            return (
              <CommandItem
                key={section.url}
                value={section.name}
                onSelect={() => handleSelect(section.url)}
              >
                <SectionIcon className="mr-2 h-4 w-4" />
                <span>{section.name}</span>
              </CommandItem>
            )
          })}
        </CommandGroup>
        {filteredFormats.length > 0 && (
          <CommandGroup heading="Ad Formats">
            {filteredFormats.map((fmt) => {
              const TypeIcon = fmt.typeIcon
              return (
                <CommandItem
                  key={fmt.id}
                  value={`${fmt.name} ${fmt.typeName}`}
                  onSelect={() => handleSelect(fmt.url)}
                >
                  <TypeIcon className="mr-2 h-4 w-4" />
                  <span>
                    {fmt.name}{' '}
                    <span className="text-muted-foreground">({fmt.typeName})</span>
                  </span>
                </CommandItem>
              )
            })}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}
