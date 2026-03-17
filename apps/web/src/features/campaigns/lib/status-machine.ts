import type { Enums } from '@scrolltoday/shared'

// ---------------------------------------------------------------------------
// Creative status transitions
// ---------------------------------------------------------------------------

type CreativeStatus = Enums<'creative_status'>

const CREATIVE_TRANSITIONS: Record<CreativeStatus, CreativeStatus[]> = {
  draft: ['active'],
  active: ['paused'],
  paused: ['active', 'archived'],
  archived: [],
}

export function getAvailableCreativeTransitions(
  current: CreativeStatus
): CreativeStatus[] {
  return CREATIVE_TRANSITIONS[current] ?? []
}

export function canCreativeTransitionTo(
  from: CreativeStatus,
  to: CreativeStatus
): boolean {
  return CREATIVE_TRANSITIONS[from]?.includes(to) ?? false
}

// ---------------------------------------------------------------------------
// Campaign status transitions
// ---------------------------------------------------------------------------

type CampaignStatus = Enums<'campaign_status'>

const CAMPAIGN_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  draft: ['active'],
  active: ['paused'],
  paused: ['active', 'completed'],
  completed: [],
}

export function getAvailableCampaignTransitions(
  current: CampaignStatus
): CampaignStatus[] {
  return CAMPAIGN_TRANSITIONS[current] ?? []
}

export function canCampaignTransitionTo(
  from: CampaignStatus,
  to: CampaignStatus
): boolean {
  return CAMPAIGN_TRANSITIONS[from]?.includes(to) ?? false
}
