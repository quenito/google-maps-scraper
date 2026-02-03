# Google Maps Lead Scraper - Phase 1 Brief
## Chrome Extension Development Specification for Claude Code

**Project:** Google Maps Lead Scraper Chrome Extension  
**Phase:** 1 - Core Scraping (MVP)  
**Developer:** Matt (Quenito Enterprises)  
**Date:** January 2025

---

## Overview

Build a Chrome extension that extracts business listing data from Google Maps search results. This is Phase 1 (MVP) - we're focusing on core scraping functionality only. Email extraction comes in Phase 2.

---

## What We're Building

A Chrome extension with:
1. A popup UI with a "Start Scraping" button
2. A content script that extracts business data from Google Maps
3. CSV export functionality
4. Progress indicator showing how many leads have been scraped

---

## Technical Requirements

### Chrome Extension Structure

Create this folder structure:

```
google-maps-scraper/
├── manifest.json          # Extension configuration (Manifest V3)
├── popup/
│   ├── popup.html         # Popup UI
│   ├── popup.css          # Popup styling
│   └── popup.js           # Popup logic
├── content/
│   └── content.js         # Injected into Google Maps pages
├── background/
│   └── service-worker.js  # Background service worker
├── utils/
│   └── csv.js             # CSV generation utility
└── icons/
    ├── icon16.png         # 16x16 icon
    ├── icon48.png         # 48x48 icon
    └── icon128.png        # 128x128 icon
```

---

## File Specifications

### 1. manifest.json

```json
{
  "manifest_version": 3,
  "name": "Google Maps Lead Scraper",
  "version": "1.0.0",
  "description": "Extract business leads from Google Maps search results",
  "permissions": [
    "activeTab",
    "storage",
    "scripting"
  ],
  "host_permissions": [
    "https://www.google.com/maps/*"
  ],
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "background": {
    "service_worker": "background/service-worker.js",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["https://www.google.com/maps/*"],
      "js": ["content/content.js"],
      "run_at": "document_idle"
    }
  ],
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

---

### 2. popup/popup.html

Create a simple, clean popup UI with:
- Header with extension name
- Status indicator (Ready / Scraping / Complete)
- Count of leads scraped
- "Start Scraping" button (changes to "Stop" when active)
- "Export CSV" button (disabled until data exists)
- Small footer with version number

**Design Notes:**
- Keep it minimal and professional
- Use a blue color scheme (#1a73e8 - Google blue)
- Width: 320px
- Modern, clean look

---

### 3. popup/popup.css

Style the popup with:
- Clean, modern appearance
- Smooth transitions for status changes
- Disabled state styling for buttons
- Progress indicator styling

---

### 4. popup/popup.js

Handle:
- Click handlers for Start/Stop and Export buttons
- Communication with content script via chrome.tabs.sendMessage
- Update UI based on scraping status
- Store/retrieve scraped data from chrome.storage.local
- Trigger CSV download when Export clicked

---

### 5. content/content.js

This is the core scraping logic. It needs to:

#### A. Detect if on Google Maps Search Results
- Check URL contains `/maps/search/`
- Verify the results panel exists

#### B. Extract Business Data from Visible Results
The Google Maps sidebar shows search results. Each result contains:

**Data Fields to Extract:**
| Field | Description | Required |
|-------|-------------|----------|
| name | Business name | Yes |
| rating | Star rating (1-5) | No |
| reviewCount | Number of reviews | No |
| category | Business category (e.g., "Restaurant") | No |
| address | Full address | Yes |
| phone | Phone number | No |
| website | Website URL | No |
| googleMapsUrl | Direct link to the listing | Yes |

#### C. DOM Selectors Strategy

Google Maps uses dynamic class names that change. Use these approaches:

1. **Role-based selectors:** Look for `role="article"` for each listing
2. **Data attributes:** Look for `data-` attributes
3. **Aria labels:** Use `aria-label` attributes
4. **Text pattern matching:** Find elements by their text content patterns
5. **Structural navigation:** Navigate from known elements (like the search results container)

**Important:** The selectors WILL break over time as Google updates their site. Build the scraper to be somewhat resilient and log warnings when expected elements aren't found.

#### D. Auto-Scroll to Load More Results
Google Maps lazy-loads results. Implement:
1. Scroll the results panel (not the main window)
2. Wait for new results to load
3. Continue until no new results appear
4. Have a maximum limit (e.g., 500 results) to prevent infinite loops

#### E. Message Handling
Listen for messages from popup:
- `{ action: "startScraping" }` - Begin scraping
- `{ action: "stopScraping" }` - Stop scraping
- `{ action: "getStatus" }` - Return current status and data

Send progress updates back to popup:
- `{ type: "progress", count: 45 }` - Update lead count
- `{ type: "complete", data: [...] }` - Scraping finished
- `{ type: "error", message: "..." }` - Error occurred

---

### 6. background/service-worker.js

For Phase 1, keep this minimal:
- Handle extension installation
- Could store settings (not needed for MVP)
- Will be expanded in Phase 2 for email extraction

---

### 7. utils/csv.js

Create a utility function to convert scraped data to CSV:

```javascript
function convertToCSV(data) {
  // Handle:
  // - Header row from object keys
  // - Escape commas in values
  // - Escape quotes in values
  // - Handle newlines in values
  // - Return as string
}

function downloadCSV(data, filename) {
  // Create blob from CSV string
  // Create download link
  // Trigger download
  // Clean up
}
```

---

### 8. Icons

For the MVP, create simple placeholder icons:
- Use a map pin or location marker design
- Blue color scheme
- Sizes: 16x16, 48x48, 128x128 (PNG format)

You can create these as simple colored squares or circles for now - they just need to exist for the extension to load.

---

## User Flow

1. User searches on Google Maps (e.g., "plumbers in Sydney")
2. User clicks the extension icon in Chrome toolbar
3. Popup shows "Ready to scrape" status
4. User clicks "Start Scraping"
5. Extension scrolls through results and extracts data
6. Progress counter updates in real-time
7. When complete, "Export CSV" button becomes active
8. User clicks "Export CSV" and downloads file

---

## Error Handling

Handle these scenarios:
1. **Not on Google Maps:** Show message "Please navigate to Google Maps search results"
2. **No results found:** Show message "No business listings found on this page"
3. **Scraping interrupted:** Save partial data, allow export of what was collected
4. **DOM structure changed:** Log specific warnings about which selectors failed

---

## Testing Checklist

After building, test these scenarios:
- [ ] Extension loads without errors
- [ ] Popup opens and displays correctly
- [ ] Start button begins scraping on valid Maps page
- [ ] Progress counter updates during scraping
- [ ] Stop button halts scraping
- [ ] Export creates valid CSV file
- [ ] CSV contains all expected columns
- [ ] Works with different search queries
- [ ] Handles pages with few results (< 10)
- [ ] Handles pages with many results (> 100)
- [ ] Shows appropriate error when not on Maps page

---

## Development Notes

### Loading the Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `google-maps-scraper` folder
5. The extension should appear in your toolbar

### Debugging

- Right-click extension icon → "Inspect popup" for popup debugging
- F12 on Google Maps page → Console for content script logs
- Check `chrome://extensions/` for service worker errors

### Chrome Extension Quirks

- Content scripts and popup scripts are isolated - they communicate via messages
- Use `chrome.storage.local` to persist data between popup opens
- Service worker can go idle - don't rely on it staying alive
- Manifest V3 doesn't allow remote code - all JS must be in the extension

---

## Phase 2 Preview (Not for this build)

After Phase 1 is working, Phase 2 will add:
- Email extraction by visiting business websites
- Background script to handle website fetching
- Rate limiting to avoid detection
- Email pattern detection (regex)
- Enhanced data storage

---

## Deliverables for Phase 1

1. Complete folder structure with all files
2. Working extension that can be loaded in Chrome
3. Ability to scrape visible Google Maps results
4. CSV export of scraped data
5. Basic error handling

---

## Questions for Matt

Before starting, confirm:
1. Do you want to test this on a specific search query? (e.g., "plumbers in Sydney")
2. Any preference on the visual design of the popup?
3. Should we add a results preview in the popup, or just a count?

---

**Ready to Build!**

Hand this brief to Claude Code and it will create the extension step by step. Start with the folder structure and manifest.json, then work through each file.
