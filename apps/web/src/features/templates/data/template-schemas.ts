import { z } from 'zod'

// ---------------------------------------------------------------------------
// Base schema shared by every format
// ---------------------------------------------------------------------------

const baseFields = {
  ctaUrl: z.string().url().or(z.literal('')).optional().default(''),
}

// ---------------------------------------------------------------------------
// Standard formats
// ---------------------------------------------------------------------------

export const staticBannerConfigSchema = z.object({
  ...baseFields,
  type: z.literal('static-banner'),
  headline: z.string().max(100),
  bodyText: z.string().max(250),
  ctaText: z.string().max(30),
  backgroundColor: z.string(),
  textColor: z.string(),
  ctaColor: z.string(),
  imageUrl: z.string().optional().default(''),
})

export const multiFrameConfigSchema = z.object({
  ...baseFields,
  type: z.literal('multi-frame'),
  frames: z
    .array(
      z.object({
        headline: z.string(),
        bodyText: z.string(),
        imageUrl: z.string().optional().default(''),
        backgroundColor: z.string(),
      })
    )
    .min(2)
    .max(6),
  frameDuration: z.number().min(1000).max(10000).optional().default(3000),
  ctaText: z.string().max(30),
})

// ---------------------------------------------------------------------------
// Native formats
// ---------------------------------------------------------------------------

export const inFeedConfigSchema = z.object({
  ...baseFields,
  type: z.literal('in-feed'),
  headline: z.string().max(100),
  bodyText: z.string().max(300),
  imageUrl: z.string().optional().default(''),
  sponsorName: z.string().optional().default(''),
  sponsorLogoUrl: z.string().optional().default(''),
  ctaText: z.string(),
})

// ---------------------------------------------------------------------------
// Interactive formats
// ---------------------------------------------------------------------------

export const carouselConfigSchema = z.object({
  ...baseFields,
  type: z.literal('carousel'),
  slides: z
    .array(
      z.object({
        headline: z.string(),
        imageUrl: z.string().optional().default(''),
        bodyText: z.string().optional().default(''),
      })
    )
    .min(2)
    .max(10),
  autoPlay: z.boolean().optional().default(false),
  autoPlayInterval: z.number().min(1000).max(10000).optional().default(3000),
  ctaText: z.string().optional().default('Learn More'),
})

export const cubeConfigSchema = z.object({
  ...baseFields,
  type: z.literal('cube'),
  faces: z
    .array(
      z.object({
        headline: z.string(),
        imageUrl: z.string().optional().default(''),
        bodyText: z.string().optional().default(''),
      })
    )
    .length(4),
  rotationSpeed: z.number().min(1000).max(10000).optional().default(4000),
  ctaText: z.string().optional().default('Learn More'),
})

export const scratchConfigSchema = z.object({
  ...baseFields,
  type: z.literal('scratch'),
  overlayImageUrl: z.string().optional().default(''),
  revealImageUrl: z.string().optional().default(''),
  headline: z.string().optional().default(''),
  bodyText: z.string().optional().default(''),
  ctaText: z.string().optional().default('Learn More'),
})

export const flipcardConfigSchema = z.object({
  ...baseFields,
  type: z.literal('flipcard'),
  frontHeadline: z.string().optional().default(''),
  frontImageUrl: z.string().optional().default(''),
  frontBodyText: z.string().optional().default(''),
  backHeadline: z.string().optional().default(''),
  backImageUrl: z.string().optional().default(''),
  backBodyText: z.string().optional().default(''),
  ctaText: z.string().optional().default('Learn More'),
})

export const quizConfigSchema = z.object({
  ...baseFields,
  type: z.literal('quiz'),
  question: z.string().optional().default(''),
  options: z
    .array(
      z.object({
        text: z.string(),
        isCorrect: z.boolean(),
      })
    )
    .min(2)
    .max(6),
  resultText: z.string().optional().default(''),
  ctaText: z.string().optional().default('Learn More'),
})

export const sliderConfigSchema = z.object({
  ...baseFields,
  type: z.literal('slider'),
  beforeImageUrl: z.string().optional().default(''),
  afterImageUrl: z.string().optional().default(''),
  headline: z.string().optional().default(''),
  bodyText: z.string().optional().default(''),
  ctaText: z.string().optional().default('Learn More'),
})

export const accordionConfigSchema = z.object({
  ...baseFields,
  type: z.literal('accordion'),
  sections: z
    .array(
      z.object({
        title: z.string(),
        content: z.string(),
        imageUrl: z.string().optional().default(''),
      })
    )
    .min(2)
    .max(8),
  ctaText: z.string().optional().default('Learn More'),
})

// ---------------------------------------------------------------------------
// Animated formats
// ---------------------------------------------------------------------------

export const animatedBannerConfigSchema = z.object({
  ...baseFields,
  type: z.literal('animated-banner'),
  headline: z.string().optional().default(''),
  bodyText: z.string().optional().default(''),
  ctaText: z.string().optional().default('Learn More'),
  backgroundColor: z.string().optional().default('#ffffff'),
  textColor: z.string().optional().default('#000000'),
  ctaColor: z.string().optional().default('#2563eb'),
  imageUrl: z.string().optional().default(''),
  animationType: z
    .enum(['fade', 'slide', 'bounce', 'zoom'])
    .optional()
    .default('fade'),
})

export const countdownConfigSchema = z.object({
  ...baseFields,
  type: z.literal('countdown'),
  targetDate: z.string().optional().default(''),
  headline: z.string().optional().default(''),
  bodyText: z.string().optional().default(''),
  ctaText: z.string().optional().default('Learn More'),
  backgroundColor: z.string().optional().default('#ffffff'),
  textColor: z.string().optional().default('#000000'),
})

// ---------------------------------------------------------------------------
// Video formats
// ---------------------------------------------------------------------------

export const videoEndcardConfigSchema = z.object({
  ...baseFields,
  type: z.literal('video-endcard'),
  videoUrl: z.string().optional().default(''),
  endcardHeadline: z.string().optional().default(''),
  endcardBodyText: z.string().optional().default(''),
  endcardImageUrl: z.string().optional().default(''),
  ctaText: z.string().optional().default('Learn More'),
  autoplay: z.boolean().optional().default(false),
})

export const clickToPlayConfigSchema = z.object({
  ...baseFields,
  type: z.literal('click-to-play'),
  videoUrl: z.string().optional().default(''),
  thumbnailImageUrl: z.string().optional().default(''),
  headline: z.string().optional().default(''),
  ctaText: z.string().optional().default('Learn More'),
})

// ---------------------------------------------------------------------------
// Discriminated union of all template configs
// ---------------------------------------------------------------------------

const allSchemas = [
  staticBannerConfigSchema,
  multiFrameConfigSchema,
  inFeedConfigSchema,
  carouselConfigSchema,
  cubeConfigSchema,
  scratchConfigSchema,
  flipcardConfigSchema,
  quizConfigSchema,
  sliderConfigSchema,
  accordionConfigSchema,
  animatedBannerConfigSchema,
  countdownConfigSchema,
  videoEndcardConfigSchema,
  clickToPlayConfigSchema,
] as const

export const templateConfigSchema = z.discriminatedUnion('type', [
  staticBannerConfigSchema,
  multiFrameConfigSchema,
  inFeedConfigSchema,
  carouselConfigSchema,
  cubeConfigSchema,
  scratchConfigSchema,
  flipcardConfigSchema,
  quizConfigSchema,
  sliderConfigSchema,
  accordionConfigSchema,
  animatedBannerConfigSchema,
  countdownConfigSchema,
  videoEndcardConfigSchema,
  clickToPlayConfigSchema,
])

export type TemplateConfig = z.infer<typeof templateConfigSchema>

// Per-format inferred types
export type StaticBannerConfig = z.infer<typeof staticBannerConfigSchema>
export type MultiFrameConfig = z.infer<typeof multiFrameConfigSchema>
export type InFeedConfig = z.infer<typeof inFeedConfigSchema>
export type CarouselConfig = z.infer<typeof carouselConfigSchema>
export type CubeConfig = z.infer<typeof cubeConfigSchema>
export type ScratchConfig = z.infer<typeof scratchConfigSchema>
export type FlipcardConfig = z.infer<typeof flipcardConfigSchema>
export type QuizConfig = z.infer<typeof quizConfigSchema>
export type SliderConfig = z.infer<typeof sliderConfigSchema>
export type AccordionConfig = z.infer<typeof accordionConfigSchema>
export type AnimatedBannerConfig = z.infer<typeof animatedBannerConfigSchema>
export type CountdownConfig = z.infer<typeof countdownConfigSchema>
export type VideoEndcardConfig = z.infer<typeof videoEndcardConfigSchema>
export type ClickToPlayConfig = z.infer<typeof clickToPlayConfigSchema>

// ---------------------------------------------------------------------------
// Lookup helper
// ---------------------------------------------------------------------------

const schemaMap: Record<string, (typeof allSchemas)[number]> = {
  'static-banner': staticBannerConfigSchema,
  'multi-frame': multiFrameConfigSchema,
  'in-feed': inFeedConfigSchema,
  carousel: carouselConfigSchema,
  cube: cubeConfigSchema,
  scratch: scratchConfigSchema,
  flipcard: flipcardConfigSchema,
  quiz: quizConfigSchema,
  slider: sliderConfigSchema,
  accordion: accordionConfigSchema,
  'animated-banner': animatedBannerConfigSchema,
  countdown: countdownConfigSchema,
  'video-endcard': videoEndcardConfigSchema,
  'click-to-play': clickToPlayConfigSchema,
}

/**
 * Returns the Zod config schema for the given format type string.
 * Throws if the format is unknown.
 */
export function getConfigSchemaForFormat(formatType: string) {
  const schema = schemaMap[formatType]
  if (!schema) {
    throw new Error(`Unknown format type: ${formatType}`)
  }
  return schema
}
