---
status: complete
phase: 13-analytics-enhancements
source: 13-01-SUMMARY.md, 13-02-SUMMARY.md, 13-03-SUMMARY.md
started: 2026-02-25T10:30:00Z
updated: 2026-02-25T10:30:00Z
---

## Current Test

number: —
name: UAT complete
awaiting: —

## Tests

### 1. Lifetime Totals KPI section
expected: A "Lifetime Totals" section with 3 cards (all-time Impressions, Clicks, CTR) appears above the date-range controls. Cards are static — they show all-time numbers regardless of date filter.
result: pass

### 2. Date-range KPI cards still work
expected: The existing date-range KPI cards (impressions, clicks, CTR for the selected period) are still present below the Lifetime Totals section and update correctly when you change the date preset.
result: pass

### 3. MetricsChart PNG download
expected: The time-series line/bar chart (MetricsChart) has a small "PNG" download button in its card header. Clicking it downloads a .png file. Opening the file shows the chart with a white (not black) background.
result: pass

### 4. Creative Share donut chart
expected: A "Creative Share" donut/pie chart appears on the page. It shows colored slices for each creative's share of total impressions. A legend is visible. If you have no impressions data, it shows an empty state message.
result: pass

### 5. Platform Breakdown chart
expected: A "Platform Breakdown" horizontal bar chart appears. It shows impression counts grouped by Desktop, Mobile, Tablet (or Unknown). If no device data is available, it shows an empty state.
result: pass

### 6. Hourly Breakdown chart — 24 bars
expected: An "Hourly Breakdown" section appears with a date picker input and a bar chart below it. The chart shows 24 bars (one per hour, 0–23). X-axis labels read "12am", "1am", "2am"... "12pm", "1pm"... "11pm".
result: pass

### 7. Hourly chart — date picker updates chart
expected: Changing the date in the hourly section's date input (e.g. to yesterday) triggers a reload of the hourly chart. The chart updates to reflect data for the new date (bars may all be zero if no events on that date — zero bars are expected and correct).
result: pass

### 8. PNG download on new charts
expected: The new chart cards (Creative Share, Platform Breakdown, Hourly Breakdown) each have a PNG download button. Clicking any of them downloads a .png of that chart with a white background.
result: pass

### 9. Export XLS button
expected: The export button on the analytics page now says "Export XLS" (not "Export CSV"). Clicking it downloads a file with a .xlsx extension. Opening it in Excel or Google Sheets shows a "Daily Metrics" sheet with columns: Date, Creative, Campaign, Impressions, Viewable Impressions, Clicks, CTR (%), Engagements, Video Plays, Video Completes.
result: skipped — no analytics data available in test environment; XLS export code is in place but cannot be end-to-end verified until live impression data exists. PNG download confirmed working (empty charts).

### 10. No console errors
expected: After loading the Analytics page and interacting with date presets, charts, and download buttons, the browser DevTools console shows no red errors (warnings are acceptable).
result: pass

## Summary

total: 10
passed: 9
issues: 0
pending: 0
skipped: 1

## Gaps

[none yet]
