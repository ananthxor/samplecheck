import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface AnalyticsFiltersProps {
  creatives: { id: string; name: string }[]
  campaigns: { id: string; name: string }[]
  selectedCreativeId?: string
  selectedCampaignId?: string
  onCreativeChange: (id: string | undefined) => void
  onCampaignChange: (id: string | undefined) => void
}

export function AnalyticsFilters({
  creatives,
  campaigns,
  selectedCreativeId,
  selectedCampaignId,
  onCreativeChange,
  onCampaignChange,
}: AnalyticsFiltersProps) {
  return (
    <div className="flex items-center gap-3">
      <Select
        value={selectedCreativeId ?? '__all__'}
        onValueChange={(v) => onCreativeChange(v === '__all__' ? undefined : v)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="All Creatives" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All Creatives</SelectItem>
          {creatives.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={selectedCampaignId ?? '__all__'}
        onValueChange={(v) => onCampaignChange(v === '__all__' ? undefined : v)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="All Campaigns" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All Campaigns</SelectItem>
          {campaigns.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
