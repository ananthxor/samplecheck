// Re-export the analytics XLS export utility for use in the reports feature.
// Reports export the same DailyMetricRow[] shape as analytics — no new format needed.
export { exportToXls as exportReportXls } from '@/features/analytics/lib/xls-export'
