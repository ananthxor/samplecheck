import { supabase } from '@/lib/supabase'
import type { SavedReport, CreateReportPayload } from '../lib/report-types'

export async function fetchSavedReports(advertiserId: string): Promise<SavedReport[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('saved_reports')
    .select('*')
    .eq('advertiser_id', advertiserId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data as unknown as SavedReport[]
}

export async function createSavedReport(payload: CreateReportPayload): Promise<SavedReport> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('saved_reports')
    .insert(payload)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as unknown as SavedReport
}

export async function deleteSavedReport(id: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('saved_reports').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
