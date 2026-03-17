import { z } from 'zod'
import type { FormatDefinition, TemplatePreset, TemplateSize } from './_shared/types'
import { buildZodSchema } from './_shared/schema-builder'

// Active format definitions — organised by category / size / format
import { flipcardFormat } from './interactive/responsive/flipcard'
import { cubeFormat } from './interactive/responsive/cube'
import { accordionFormat } from './interactive/responsive/accordion'
import { carouselFormat } from './interactive/responsive/carousel'
import { quizFormat } from './interactive/responsive/quiz'
import { scratchFormat } from './interactive/responsive/scratch'
import { sliderFormat } from './interactive/responsive/slider'
import { animatedBannerFormat } from './animated/responsive/animated-banner'
import { countdownFormat } from './animated/banner/countdown'
import { clickToPlayFormat } from './video/click-to-play'
import { videoEndcardFormat } from './video/video-endcard'
import { staticBannerFormat } from './standard-banners/static-banner'
import { multiFrameFormat } from './standard-banners/multi-frame'
import { inFeedFormat } from './native/in-feed'
import { inlineRectangleFormat } from './standard-banners/inline-rectangle'
import { squareFormat } from './standard-banners/square'
import { smallSquareFormat } from './standard-banners/small-square'
import { bannerFormat } from './standard-banners/banner'
import { leaderboardFormat } from './standard-banners/leaderboard'
import { largeRectangleFormat } from './standard-banners/large-rectangle'
import { skyscraperFormat } from './standard-banners/skyscraper'
import { wideSkyscraperFormat } from './standard-banners/wide-skyscraper'
import { mobileLeaderboardFormat } from './standard-banners/mobile-leaderboard'
import { desktopWebBannerFormat } from './standard-banners/desktop-web-banner'
import { mobileWebBannerFormat } from './standard-banners/mobile-web-banner'
import { desktopIntroBannerFormat } from './standard-banners/desktop-intro-banner'
import { mobileIntroBannerFormat } from './standard-banners/mobile-intro-banner'
import { largeLeaderboardFormat } from './standard-banners/large-leaderboard'
import { largeLeaderboard970x250Format } from './standard-banners/large-leaderboard-970x250'
import { interstitialFormat } from './standard-banners/interstitial'
import { halfPageFormat } from './standard-banners/half-page'
import { largeLeaderboard970x90Format } from './standard-banners/large-leaderboard-970x90'
import { mobileBannerFormat } from './standard-banners/mobile-banner'
import { customBannerFormat } from './standard-banners/custom-banner'

// ---------------------------------------------------------------------------
// All registered formats
// ---------------------------------------------------------------------------

const ALL_FORMATS: FormatDefinition[] = [
  flipcardFormat,
  cubeFormat,
  countdownFormat,
  accordionFormat,
  animatedBannerFormat,
  carouselFormat,
  clickToPlayFormat,
  inFeedFormat,
  multiFrameFormat,
  quizFormat,
  scratchFormat,
  sliderFormat,
  staticBannerFormat,
  inlineRectangleFormat,
  squareFormat,
  smallSquareFormat,
  bannerFormat,
  leaderboardFormat,
  largeRectangleFormat,
  skyscraperFormat,
  wideSkyscraperFormat,
  mobileLeaderboardFormat,
  desktopWebBannerFormat,
  mobileWebBannerFormat,
  desktopIntroBannerFormat,
  mobileIntroBannerFormat,
  largeLeaderboardFormat,
  largeLeaderboard970x250Format,
  interstitialFormat,
  halfPageFormat,
  largeLeaderboard970x90Format,
  mobileBannerFormat,
  customBannerFormat,
  videoEndcardFormat,
]

// Lookup map built at module load time
const formatsByType = new Map<string, FormatDefinition>()
for (const f of ALL_FORMATS) {
  formatsByType.set(f.type, f)
}

// ---------------------------------------------------------------------------
// Discriminated union schema (replaces template-schemas.ts)
// ---------------------------------------------------------------------------

const allSchemas = ALL_FORMATS.map((f) =>
  f.zodSchema ?? buildZodSchema(f.type, f.fields)
)

export const templateConfigSchema = z.discriminatedUnion(
  'type',
  allSchemas as [z.ZodObject<any>, z.ZodObject<any>, ...z.ZodObject<any>[]]
)

/**
 * TemplateConfig is a loose type compatible with any format.
 * The dynamic schema builder can't produce precise compile-time types,
 * but Zod validation at runtime ensures correctness.
 */
export type TemplateConfig = Record<string, unknown> & { type: string }

// ---------------------------------------------------------------------------
// Format lookup API
// ---------------------------------------------------------------------------

export function getFormat(type: string): FormatDefinition | undefined {
  return formatsByType.get(type)
}

export function getAllFormats(): FormatDefinition[] {
  return ALL_FORMATS
}

export function getFormatsByCategory(category: string): FormatDefinition[] {
  return ALL_FORMATS.filter((f) => f.category === category)
}

/**
 * Returns the Zod config schema for the given format type string.
 * Replaces getConfigSchemaForFormat from template-schemas.ts.
 */
export function getConfigSchemaForFormat(formatType: string) {
  const format = formatsByType.get(formatType)
  if (!format) {
    throw new Error(`Unknown format type: ${formatType}`)
  }
  return format.zodSchema ?? buildZodSchema(format.type, format.fields)
}

// ---------------------------------------------------------------------------
// Template preset API (replaces template-registry.ts)
// ---------------------------------------------------------------------------

export interface Template {
  id: string
  formatId: string
  name: string
  description: string
  thumbnailUrl: string
  category: string
  sizes: TemplateSize[]
  defaultConfig: TemplateConfig
}

/** All curated templates across all formats */
export const TEMPLATES: Template[] = ALL_FORMATS.flatMap((f) =>
  f.templates.map(
    (t): Template => ({
      ...t,
      formatId: f.type,
      category: f.category,
      defaultConfig: { ...t.defaultConfig, type: f.type } as TemplateConfig,
    })
  )
)

export function getTemplateById(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id)
}

export function getTemplatesByFormat(formatId: string): Template[] {
  return TEMPLATES.filter((t) => t.formatId === formatId)
}

export function getTemplatesByCategory(category: string): Template[] {
  return TEMPLATES.filter((t) => t.category === category)
}

// Re-export types for convenience
export type { FormatDefinition, TemplatePreset, TemplateSize }
