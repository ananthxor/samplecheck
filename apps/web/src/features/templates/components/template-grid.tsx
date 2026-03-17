import type { Template } from '../formats/registry'
import { TemplateCard } from './template-card'

interface TemplateGridProps {
  templates: Template[]
  onSelect: (template: Template) => void
}

export function TemplateGrid({ templates, onSelect }: TemplateGridProps) {
  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-medium text-muted-foreground">
          No templates found for this filter
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try adjusting your filters to see more templates.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {templates.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}
