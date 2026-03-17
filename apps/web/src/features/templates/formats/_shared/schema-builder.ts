import { z } from 'zod'
import type { FieldDefinition } from './types'

/**
 * Generates a Zod schema from a format type discriminator and field definitions.
 * Replaces hand-written per-format Zod schemas in template-schemas.ts.
 */
export function buildZodSchema(
  formatType: string,
  fields: FieldDefinition[]
): z.ZodObject<any> {
  const shape: Record<string, z.ZodTypeAny> = {
    type: z.literal(formatType),
    // Every format gets ctaUrl from the old baseFields
    ctaUrl: z.string().url().or(z.literal('')).optional().default(''),
  }

  for (const field of fields) {
    if (field.type === 'group') continue
    // Skip ctaUrl — already in base
    if (field.id === 'ctaUrl') continue
    shape[field.id] = fieldToZod(field)
  }

  return z.object(shape)
}

function fieldToZod(field: FieldDefinition): z.ZodTypeAny {
  const v = field.validation

  switch (field.type) {
    case 'text':
    case 'textarea': {
      let s: z.ZodTypeAny = z.string()
      if (v?.max) s = z.string().max(v.max)
      return s.optional().default((field.default as string) ?? '')
    }

    case 'url':
      return z
        .string()
        .url()
        .or(z.literal(''))
        .optional()
        .default((field.default as string) ?? '')

    case 'color':
      return z.string().optional().default((field.default as string) ?? '#ffffff')

    case 'image':
      return z.string().optional().default((field.default as string) ?? '')

    case 'switch':
      return z.boolean().optional().default((field.default as boolean) ?? false)

    case 'number': {
      let n = z.number()
      if (v?.min != null) n = n.min(v.min)
      if (v?.max != null) n = n.max(v.max)
      return n.optional().default((field.default as number) ?? 0)
    }

    case 'select': {
      if (v?.options && v.options.length > 0) {
        const values = v.options.map((o) => o.value) as [string, ...string[]]
        return z.enum(values).optional().default((field.default as string) ?? values[0])
      }
      return z.string().optional().default((field.default as string) ?? '')
    }

    case 'date':
      return z.string().optional().default((field.default as string) ?? '')

    case 'array': {
      if (!field.arrayConfig) {
        throw new Error(`Array field "${field.id}" missing arrayConfig`)
      }
      const childShape: Record<string, z.ZodTypeAny> = {}
      for (const child of field.arrayConfig.fields) {
        if (child.type === 'group') continue
        childShape[child.id] = fieldToZod(child)
      }
      let arr = z.array(z.object(childShape))
      if (field.arrayConfig.minItems) arr = arr.min(field.arrayConfig.minItems)
      if (field.arrayConfig.maxItems) arr = arr.max(field.arrayConfig.maxItems)
      return arr
    }

    default:
      return z.unknown()
  }
}
