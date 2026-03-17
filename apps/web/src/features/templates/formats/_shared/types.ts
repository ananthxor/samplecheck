import type { z } from 'zod'

// ---------------------------------------------------------------------------
// Field definition system — drives dynamic form generation + Zod schema
// ---------------------------------------------------------------------------

export type FieldType =
  | 'text'
  | 'textarea'
  | 'color'
  | 'image'
  | 'video'
  | 'url'
  | 'switch'
  | 'number'
  | 'select'
  | 'date'
  | 'array'
  | 'group'

export interface FieldDefinition {
  /** Form field name (maps to react-hook-form path) */
  id: string
  label: string
  type: FieldType
  default: unknown
  /** Which editor tab to render in (default: 'content') */
  tab?: 'content' | 'style' | 'settings'
  validation?: {
    required?: boolean
    min?: number
    max?: number
    step?: number
    /** For select fields */
    options?: Array<{ value: string; label: string }>
  }
  /** For 'array' type only */
  arrayConfig?: {
    minItems?: number
    maxItems?: number
    /** Label for each item, e.g. "Slide", "Face" */
    itemLabel?: string
    fields: FieldDefinition[]
    /** Default values for a new array item */
    defaultItem?: Record<string, unknown>
  }
  /** For 'group' type — visual separator label */
  groupLabel?: string
}

// ---------------------------------------------------------------------------
// Renderer export — two strategies:
//   'function' - separate css/js strings composed by buildAdPayload (legacy)
//   'html'     - render() returns a complete self-contained HTML document
// ---------------------------------------------------------------------------

export type RendererExport =
  | {
      type?: 'function'
      /** CSS to inject into the iframe's <style> block */
      css: string
      /** Vanilla JS function body that renders the ad */
      js: string
      /** Function name declared in `js`, e.g. "renderFlipcard" */
      functionName: string
    }
  | {
      type: 'html'
      /**
       * Returns a complete HTML document string.
       * @param config - The creative's template_data fields
       * @param trackUrl - Absolute track-event URL; empty string disables telemetry
       */
      render: (config: Record<string, unknown>, trackUrl: string) => string
    }

// ---------------------------------------------------------------------------
// Template preset — curated starting points (replaces template-registry.ts)
// ---------------------------------------------------------------------------

export interface TemplateSize {
  width: number
  height: number
  label: string
}

export interface TemplatePreset {
  id: string
  name: string
  description: string
  thumbnailUrl: string
  sizes: TemplateSize[]
  defaultConfig: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Engagement definition — creative-specific interaction events
// ---------------------------------------------------------------------------

/**
 * Describes a trackable engagement event specific to a format.
 *
 * The bundler reads these at publish time and auto-generates event listener
 * code that fires `ScrollTodaySDK.track('engagement', { id })` when triggered.
 * No manual tracking code is needed in renderer.ts.
 *
 * ID uses a numeric prefix matching the format's sequential position, e.g. "17a".
 */
export interface EngagementDefinition {
  /** Unique engagement event ID, e.g. "17a", "17b" */
  id: string
  /** Human-readable event name shown in the analytics UI */
  name: string
  /** Brief description of when this event fires */
  description: string
  /** DOM event name to listen for, e.g. "click", "mousemove", "touchend" */
  event: string
  /**
   * CSS selector for the element to attach the listener to, scoped inside
   * the creative root. If omitted, the listener attaches to the root itself.
   */
  selector?: string
  /**
   * For delegated events: only fire when `event.target.closest(targetSelector)`
   * matches, e.g. ".st-fc-cta" fires only when the CTA link is clicked.
   */
  targetSelector?: string
  /** Fire only once per creative load (subsequent triggers are ignored). */
  once?: boolean
}

// ---------------------------------------------------------------------------
// Format definition — the main type each format folder exports
// ---------------------------------------------------------------------------

export interface FormatDefinition {
  /** Discriminator value matching the Zod literal, e.g. "flipcard" */
  type: string
  name: string
  description: string
  category: 'interactive' | 'animated' | 'video' | 'standard' | 'native' | 'desktop' | 'standard-banners'
  /** Ad size grouping within a category, e.g. "responsive", "interstitials" */
  size?: string
  fields: FieldDefinition[]
  /** Optional — stub formats without a renderer yet will omit this */
  renderer?: RendererExport
  /** Override auto-generated schema for complex cases */
  zodSchema?: z.ZodObject<any>
  /** Curated template presets */
  templates: TemplatePreset[]
  /** Format-specific engagement event definitions */
  engagements?: EngagementDefinition[]
  /** When true, the editor toolbar shows a "Custom" size option with width/height inputs */
  customSizable?: boolean
}
