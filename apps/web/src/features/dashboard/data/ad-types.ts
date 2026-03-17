import {
  MousePointerClick,
  Sparkles,
  Monitor,
  Image,
  Newspaper,
  Volume2,
  Tv,
  Share2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { adCategories } from '@/features/templates/data/fmtData'

export interface AdFormat {
  id: string
  name: string
  slug: string
  description: string
}

export interface AdType {
  id: string
  name: string
  slug: string
  description: string
  icon: LucideIcon
  formats: AdFormat[]
}

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  interactive: MousePointerClick,
  animated: Sparkles,
  desktop: Monitor,
  native: Newspaper,
  'standard-banners': Image,
}

export const AD_TYPES: AdType[] = adCategories.map((cat) => {
  const allFormats = [
    ...cat.formats,
    ...cat.adSizes.flatMap((s) => s.formats),
  ]
  return {
    id: cat.id,
    name: cat.name,
    slug: cat.key,
    description: cat.description,
    icon: CATEGORY_ICONS[cat.key] ?? Image,
    formats: allFormats.map((f) => ({
      id: f.id,
      name: f.name,
      slug: f.id,
      description: f.longDescription ?? '',
    })),
  }
})

export interface PlatformSuiteItem {
  id: string
  name: string
  description: string
  icon: LucideIcon
  comingSoon: true
}

export const PLATFORM_SUITE: PlatformSuiteItem[] = [
  {
    id: 'audio',
    name: 'Audio',
    description: 'Audio ad creation and distribution',
    icon: Volume2,
    comingSoon: true,
  },
  {
    id: 'adctv',
    name: 'ADCTV',
    description: 'Connected TV ad builder',
    icon: Tv,
    comingSoon: true,
  },
  {
    id: 'social-display',
    name: 'Social Display',
    description: 'Social media display formats',
    icon: Share2,
    comingSoon: true,
  },
]
