---
status: testing
phase: 07-campaign-management-tag-export
source: [07-01-SUMMARY.md, 07-02-SUMMARY.md, 07-03-SUMMARY.md]
started: 2026-02-23T03:30:00Z
updated: 2026-02-23T03:30:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

number: 1
name: Campaigns Page Loads
expected: |
  Navigate to /campaigns from sidebar. Page loads showing either campaign list or empty state with "No campaigns yet" message and a "Create Campaign" button.
awaiting: user response

## Tests

### 1. Campaigns Page Loads
expected: Navigate to /campaigns from sidebar. Page loads showing either campaign list or empty state with "No campaigns yet" message and a "Create Campaign" button.
result: [pending]

### 2. Create a Campaign
expected: Click "Create Campaign" button. Dialog opens with a Name field. Enter a campaign name and submit. Dialog closes, toast confirms success, new campaign appears in the list with "draft" status badge and "0 creatives" count.
result: [pending]

### 3. Edit a Campaign
expected: On a campaign card, click the Edit (pencil) button. Dialog opens pre-filled with current name. Change the name, submit. Campaign card updates to show the new name.
result: [pending]

### 4. Delete a Campaign
expected: On a campaign card, click the Delete (trash) button. Confirmation dialog appears. Confirm deletion. Campaign is removed from the list.
result: [pending]

### 5. Campaign Detail Page
expected: Click into a campaign (via the chevron/link on the card). Navigates to /campaigns/:id. Detail page loads showing campaign name, status badge, "Back to Campaigns" link, "Assign Creatives" button, and assigned creatives section (empty if no creatives assigned).
result: [pending]

### 6. Assign Creatives to Campaign
expected: On campaign detail page, click "Assign Creatives". Dialog opens showing unassigned creatives with checkboxes (name, format, dimensions, status). Select one or more, click "Assign Selected". Dialog closes, assigned creatives appear in the campaign grid.
result: [pending]

### 7. Creative Status Transition
expected: On an assigned creative card, click the status badge dropdown. Shows valid next states (e.g., draft shows "Active" option with Play icon). Select a transition. Status badge updates to new state. Invalid transitions are not shown.
result: [pending]

### 8. Campaign Status Transition
expected: On campaign detail header, click the campaign status badge/dropdown. Shows valid transitions (e.g., draft -> Active). Select a transition. Campaign status badge updates.
result: [pending]

### 9. DFP/GAM Tag Export
expected: On an active creative, click "Get Tag". Tag Export dialog opens. DFP/GAM tab shows generated tag code in a code block containing %%CACHEBUSTER%% and %%CLICK_URL_ESC%% macros. "Copy" button copies to clipboard. Description says "Paste this tag into Google Ad Manager as a third-party creative."
result: [pending]

### 10. Embed Tag Export
expected: In the Tag Export dialog, switch to "Embed Code" tab. Shows embed tag with async script containing Date.now() cachebuster and a <noscript> fallback. Copy button works. Description says "Add this code directly to any webpage to display the ad."
result: [pending]

### 11. Tracker Config Management
expected: On campaign detail page, tracker section is visible. Click "Add Tracker". Form shows name, URL, and type (pixel/script) fields. Create a tracker config. It appears in the tracker list showing name, type badge, and truncated URL. Delete button removes it.
result: [pending]

### 12. Assign Tracker to Creative
expected: On a creative card in the campaign detail, expand the tracker section. Click "Assign Tracker". Select a tracker config from the library and a fire condition (on_load, on_viewable, on_click, on_engagement). Assigned tracker appears under the creative showing tracker name and fire condition. Remove button unassigns it.
result: [pending]

## Summary

total: 12
passed: 0
issues: 0
pending: 12
skipped: 0

## Gaps

[none yet]
