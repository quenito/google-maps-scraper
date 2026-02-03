# Feature Brief: Auto-Extract Emails Checkbox

**Feature:** Add checkbox to auto-trigger email extraction after scraping  
**Priority:** Pre-launch  
**Complexity:** Low  
**Date:** January 30, 2026

---

## Overview

Currently the extension has a two-step process:
1. Click "Start Scraping" → scrapes business listings
2. Click "Extract Emails" → extracts emails from business websites

We want to add a checkbox that lets users automatically trigger email extraction after scraping completes, removing the need for the second button click.

---

## UI Changes

### Add Checkbox to Popup

Add a checkbox above the "Start Scraping" button:

```
☑️ Auto-extract emails after scraping

[Start Scraping]
[Extract Emails]
[Export CSV]
```

**Checkbox behaviour:**
- **Checked (default):** When scraping completes, automatically start email extraction. No button press needed.
- **Unchecked:** When scraping completes, stop there. User can manually click "Extract Emails" later if they want.

### Button Visibility

Keep the "Extract Emails" button visible at all times. This allows users who unchecked the box to still manually trigger email extraction if they change their mind.

**Button states:**
- **During scraping:** Disabled
- **After scraping (if auto-extract is OFF):** Enabled - user can click to extract emails
- **After scraping (if auto-extract is ON):** Email extraction starts automatically, button shows "Extracting..." state
- **After email extraction complete:** Disabled (already done)

---

## Implementation Details

### 1. Update popup.html

Add the checkbox above the Start Scraping button:

```html
<div class="option-row">
  <label>
    <input type="checkbox" id="autoExtractEmails" checked>
    Auto-extract emails after scraping
  </label>
</div>
```

### 2. Update popup.css

Style the checkbox container:

```css
.option-row {
  margin-bottom: 12px;
  font-size: 13px;
}

.option-row label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.option-row input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}
```

### 3. Update popup.js

**A. Save checkbox preference to storage:**

```javascript
// On checkbox change, save preference
document.getElementById('autoExtractEmails').addEventListener('change', (e) => {
  chrome.storage.local.set({ autoExtractEmails: e.target.checked });
});

// On popup load, restore preference (default: true)
chrome.storage.local.get(['autoExtractEmails'], (result) => {
  const autoExtract = result.autoExtractEmails !== false; // default true
  document.getElementById('autoExtractEmails').checked = autoExtract;
});
```

**B. Modify scraping completion logic:**

When scraping completes, check if auto-extract is enabled:

```javascript
// After scraping completes...
function onScrapingComplete(leads) {
  // Update UI to show scraping complete
  updateStatus('complete', leads.length);
  
  // Check if auto-extract is enabled
  const autoExtractCheckbox = document.getElementById('autoExtractEmails');
  if (autoExtractCheckbox.checked) {
    // Automatically trigger email extraction
    startEmailExtraction();
  } else {
    // Enable the Extract Emails button for manual trigger
    document.getElementById('extractEmailsBtn').disabled = false;
  }
}
```

### 4. Update content.js (if needed)

The content script likely sends a message when scraping completes. Make sure popup.js listens for this and triggers the auto-extract logic.

---

## User Flow

### With Auto-Extract ON (default):
1. User opens popup
2. Checkbox is checked by default
3. User clicks "Start Scraping"
4. Leads are scraped (progress shows)
5. Scraping completes → Email extraction starts automatically
6. Emails are extracted (progress shows)
7. Complete → User clicks "Export CSV"

### With Auto-Extract OFF:
1. User opens popup
2. User unchecks the checkbox
3. User clicks "Start Scraping"
4. Leads are scraped (progress shows)
5. Scraping completes → Stops
6. User can click "Export CSV" (without emails) OR click "Extract Emails" to get emails
7. If they click "Extract Emails", extraction runs, then they can export

---

## Storage

Save the checkbox preference so it persists between sessions:

```javascript
// Key: autoExtractEmails
// Value: boolean (default: true)
chrome.storage.local.set({ autoExtractEmails: true });
```

---

## Testing Checklist

- [ ] Checkbox appears above Start Scraping button
- [ ] Checkbox is checked by default
- [ ] Preference saves and persists when popup reopens
- [ ] With checkbox ON: scraping → auto email extraction → complete
- [ ] With checkbox OFF: scraping → stops → Extract Emails button enabled
- [ ] With checkbox OFF: clicking Extract Emails works correctly
- [ ] Export CSV works in both flows
- [ ] Button states are correct throughout each flow

---

## Notes

- Keep the UI simple and clean
- Checkbox label should be clear and concise
- Default to checked (email extraction is our key differentiator)
- This is a small quality-of-life improvement before launch
