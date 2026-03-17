import type { Template } from '../formats/registry'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const FORMAT_GRADIENTS: Record<string, string> = {
  'static-banner': 'from-blue-500 to-blue-700',
  'multi-frame': 'from-indigo-500 to-indigo-700',
  'in-feed': 'from-emerald-500 to-emerald-700',
  carousel: 'from-violet-500 to-violet-700',
  cube: 'from-purple-500 to-purple-700',
  scratch: 'from-amber-500 to-amber-700',
  flipcard: 'from-rose-500 to-rose-700',
  quiz: 'from-pink-500 to-pink-700',
  slider: 'from-teal-500 to-teal-700',
  accordion: 'from-cyan-500 to-cyan-700',
  'animated-banner': 'from-orange-500 to-orange-700',
  countdown: 'from-red-500 to-red-700',
  'video-endcard': 'from-fuchsia-500 to-fuchsia-700',
  'click-to-play': 'from-sky-500 to-sky-700',
}

interface TemplateCardProps {
  template: Template
  onSelect: (template: Template) => void
}

export function TemplateCard({ template, onSelect }: TemplateCardProps) {
  const gradient =
    FORMAT_GRADIENTS[template.formatId] ?? 'from-gray-500 to-gray-700'

  return (
    <Card
      className="cursor-pointer overflow-hidden py-0 transition-shadow hover:shadow-md"
      onClick={() => onSelect(template)}
    >
      {/* Thumbnail / placeholder */}
      {template.thumbnailUrl ? (
        <img
          src={template.thumbnailUrl}
          alt={template.name}
          className="h-40 w-full object-cover"
        />
      ) : (
        <div
          className={`flex h-40 items-center justify-center bg-gradient-to-br ${gradient}`}
        >
          <span className="text-sm font-medium text-white/90">
            {template.formatId}
          </span>
        </div>
      )}

      {/* Content */}
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight">{template.name}</h3>
          <Badge variant="secondary" className="shrink-0 text-xs">
            {template.formatId}
          </Badge>
        </div>

        <p className="line-clamp-2 text-sm text-muted-foreground">
          {template.description}
        </p>

        {/* Size badges */}
        <div className="flex flex-wrap gap-1">
          {template.sizes.map((size) => (
            <Badge
              key={size.label}
              variant="outline"
              className="text-xs font-normal"
            >
              {size.label}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
