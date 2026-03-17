---
phase: 10-analytics-reporting
plan: 07
subsystem: analytics-v3
tags: [analytics, dashboard, multi-series, engagement]

# Dependency graph
requires:
  - phase: 10-analytics-reporting
    provides: "Analytics dashboard & V2 rollups"
provides:
  - "engagement_metrics JSONB column in daily_metrics"
  - "SQL aggregation for specific interaction types (flips, swipes, etc.)"
  - "Google Search Console style multi-series line chart"
  - "Dynamic metric toggles for engagement breakdown"

affects: [analytics-dashboard, database]

# Tech tracking
tech-stack:
  added: []
  patterns: [Multi-series Recharts, JSONB aggregation]

key-files:
  modified:
    - supabase/migrations/20260303000001_engagement_breakdown.sql
    - apps/web/src/features/analytics/lib/analytics-types.ts
    - apps/web/src/features/analytics/components/metrics-chart.tsx

key-decisions:
  - "Added engagement_metrics JSONB to daily_metrics to store arbitrary interaction types without schema changes per new format"
  - "Refactored MetricsChart to use a multi-select toggle system allowing users to compare Impressions, Clicks, and specific Engagements (e.g., Flips) on the same graph"
  - "Fixed CTR and Avg Dwell Time summary calculations in the chart toggles to use weighted averages rather than summing percentages or showing only the last day"

requirements-completed: [ANLYT-12]

# Metrics
duration: 20min
completed: 2026-03-03
---

# Phase 10 Plan 07: Engagement Breakdown & Multi-Series Chart Summary

**Successfully upgraded the analytics dashboard to a Google Search Console-style interface, allowing users to select multiple metrics simultaneously and view a detailed breakdown of specific engagement types.**

## Accomplishments
- **Database Enhancement:** Added an `engagement_metrics` JSONB column to the `daily_metrics` table via migration.
- **Rollup Logic:** Updated both intraday and nightly SQL rollup functions to dynamically aggregate specific interaction types (e.g., "flip", "swipe", "scratch") from `ad_events.extra_data`.
- **UI Refactor:** Completely overhauled `MetricsChart.tsx`. Replaced the single-metric Tabs with multi-select cards.
- **Chart Upgrade:** The AreaChart now dynamically generates a line and gradient for each selected metric, making it easy to correlate impressions with specific engagements.

## Deviations from Plan
- Adjusted the summary calculation logic in the toggle cards to compute true weighted averages for CTR and Avg Dwell Time, fixing a discrepancy between the chart and the top-level KPI cards.

## Issues Encountered
- The original metrics chart only displayed the last day's percentage value in the toggle; fixed by implementing a `getSummary` function for each metric definition.

## Self-Check: PASSED
- FOUND: 20260303000001_engagement_breakdown.sql
- FOUND: engagementMetrics in analytics-types.ts
- FOUND: Multi-select logic in metrics-chart.tsx
