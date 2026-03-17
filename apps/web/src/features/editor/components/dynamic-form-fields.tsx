import { useFieldArray } from 'react-hook-form'
import { Plus, Trash2 } from 'lucide-react'
import type { FieldDefinition } from '@/features/templates/formats/_shared/types'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { ImageUpload } from './image-upload'

interface DynamicFormFieldsProps {
  fields: FieldDefinition[]
  tab: 'content' | 'style' | 'settings'
  creativeId: string
}

/**
 * Generic form renderer driven by FieldDefinition[].
 * Replaces all 14 hardcoded *ContentFields components.
 */
export function DynamicFormFields({ fields, tab, creativeId }: DynamicFormFieldsProps) {
  const tabFields = fields.filter((f) => (f.tab ?? 'content') === tab)

  if (tabFields.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No {tab} options available for this format.
      </p>
    )
  }

  return (
    <>
      {tabFields.map((field) => (
        <DynamicField key={field.id} field={field} creativeId={creativeId} />
      ))}
    </>
  )
}

function DynamicField({
  field,
  creativeId,
  namePrefix = '',
}: {
  field: FieldDefinition
  creativeId: string
  namePrefix?: string
}) {
  const name = namePrefix ? `${namePrefix}.${field.id}` : field.id

  switch (field.type) {
    case 'text':
      return <TextField name={name} label={field.label} />
    case 'url':
      return <TextField name={name} label={field.label} inputType="url" />
    case 'date':
      return <DateField name={name} label={field.label} />
    case 'textarea':
      return <TextAreaField name={name} label={field.label} />
    case 'color':
      return <ColorField name={name} label={field.label} />
    case 'image':
      return <ImageField name={name} label={field.label} creativeId={creativeId} />
    case 'switch':
      return <SwitchField name={name} label={field.label} />
    case 'number':
      return <NumberField name={name} label={field.label} field={field} />
    case 'select':
      return <SelectField name={name} label={field.label} field={field} />
    case 'group':
      return (
        <p className="text-xs font-semibold uppercase text-muted-foreground pt-2">
          {field.groupLabel || field.label}
        </p>
      )
    case 'array':
      return <ArrayField field={field} creativeId={creativeId} namePrefix={namePrefix} />
    default:
      return null
  }
}

// ---------------------------------------------------------------------------
// Array field with useFieldArray
// ---------------------------------------------------------------------------

function ArrayField({
  field,
  creativeId,
  namePrefix,
}: {
  field: FieldDefinition
  creativeId: string
  namePrefix: string
}) {
  const name = namePrefix ? `${namePrefix}.${field.id}` : field.id
  const cfg = field.arrayConfig!
  const { fields, append, remove } = useFieldArray({ name })

  const canAdd = !cfg.maxItems || fields.length < cfg.maxItems
  const canRemove = !cfg.minItems || fields.length > cfg.minItems

  return (
    <>
      {fields.map((item, index) => (
        <div key={item.id} className="space-y-3 rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {cfg.itemLabel || 'Item'} {index + 1}
            </span>
            {canRemove && (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => remove(index)}
              >
                <Trash2 className="text-destructive" />
              </Button>
            )}
          </div>
          {cfg.fields.map((childField) => (
            <DynamicField
              key={childField.id}
              field={childField}
              creativeId={creativeId}
              namePrefix={`${name}.${index}`}
            />
          ))}
        </div>
      ))}
      {canAdd && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append(cfg.defaultItem || {})}
        >
          <Plus /> Add {cfg.itemLabel || 'Item'}
        </Button>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Field primitives (matching existing ones from editor-form.tsx)
// ---------------------------------------------------------------------------

function TextField({
  name,
  label,
  inputType = 'text',
}: {
  name: string
  label: string
  inputType?: string
}) {
  return (
    <FormField
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input type={inputType} {...field} value={(field.value as string) ?? ''} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

/** Convert a UTC ISO string to a local datetime-local value (YYYY-MM-DDTHH:MM) */
function isoToLocal(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const offset = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - offset).toISOString().slice(0, 16)
}

function DateField({ name, label }: { name: string; label: string }) {
  return (
    <FormField
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <input
              type="datetime-local"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
              value={isoToLocal((field.value as string) ?? '')}
              onChange={(e) => {
                const val = e.target.value
                field.onChange(val ? new Date(val).toISOString() : '')
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function TextAreaField({ name, label }: { name: string; label: string }) {
  return (
    <FormField
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Textarea
              {...field}
              value={(field.value as string) ?? ''}
              rows={3}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function ColorField({ name, label }: { name: string; label: string }) {
  return (
    <FormField
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <div className="flex items-center gap-2">
            <FormControl>
              <input
                type="color"
                className="h-9 w-12 cursor-pointer rounded-md border border-input p-1"
                value={(field.value as string) || '#ffffff'}
                onChange={field.onChange}
              />
            </FormControl>
            <Input
              value={(field.value as string) || ''}
              onChange={field.onChange}
              className="flex-1"
              placeholder="#000000"
            />
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function ImageField({
  name,
  label,
  creativeId,
}: {
  name: string
  label: string
  creativeId: string
}) {
  return (
    <FormField
      name={name}
      render={({ field }) => (
        <FormItem>
          <ImageUpload
            value={(field.value as string) || ''}
            onChange={field.onChange}
            creativeId={creativeId}
            label={label}
          />
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function SwitchField({ name, label }: { name: string; label: string }) {
  return (
    <FormField
      name={name}
      render={({ field }) => (
        <FormItem className="flex items-center gap-2">
          <FormLabel className="mt-0">{label}</FormLabel>
          <FormControl>
            <Switch
              checked={field.value as boolean}
              onCheckedChange={field.onChange}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function NumberField({
  name,
  label,
  field: fieldDef,
}: {
  name: string
  label: string
  field: FieldDefinition
}) {
  return (
    <FormField
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type="number"
              min={fieldDef.validation?.min}
              max={fieldDef.validation?.max}
              step={fieldDef.validation?.step}
              value={field.value as number}
              onChange={(e) => field.onChange(Number(e.target.value))}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function SelectField({
  name,
  label,
  field: fieldDef,
}: {
  name: string
  label: string
  field: FieldDefinition
}) {
  const options = fieldDef.validation?.options ?? []
  return (
    <FormField
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
              value={field.value as string}
              onChange={field.onChange}
            >
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
