export const EVENT_TYPES = [
  'impression_served',
  'impression_viewable',
  'engagement',
  'click',
  'video_play',
  'video_pause',
  'video_complete',
  'expand',
  'collapse',
  'close',
] as const

export type EventType = typeof EVENT_TYPES[number]

export const CREATIVE_STATUSES = ['draft', 'active', 'paused', 'archived'] as const
export type CreativeStatus = typeof CREATIVE_STATUSES[number]

export const CAMPAIGN_STATUSES = ['draft', 'active', 'paused', 'completed'] as const
export type CampaignStatus = typeof CAMPAIGN_STATUSES[number]

export const USER_ROLES = ['super_admin', 'advertiser'] as const
export type UserRole = typeof USER_ROLES[number]

export const STORAGE_BUCKET = 'creative-assets'
export const MAX_FILE_SIZE = 52428800 // 50MB

export const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'video/mp4',
  'video/webm',
  'application/javascript',
  'text/html',
  'text/css',
] as const
