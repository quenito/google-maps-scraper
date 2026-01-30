# Feature Brief: Extension Icons Implementation

**Feature:** Add extension icons at 16px, 48px, and 128px  
**Priority:** Pre-launch (required)  
**Complexity:** Low  
**Date:** January 31, 2026

---

## Overview

Add the finalized extension icons to the Google Maps Lead Scraper Chrome extension. The icons have already been created and just need to be placed in the correct location with the manifest.json updated to reference them.

---

## Icon Files

Three PNG icon files need to be added:

| File | Size | Purpose |
|------|------|---------|
| `icon16.png` | 16x16 px | Chrome toolbar, favicon |
| `icon48.png` | 48x48 px | Extensions management page |
| `icon128.png` | 128x128 px | Chrome Web Store, installation dialog |

**Design:** Blue Google Maps-style location pin with a white envelope inside, representing "email extraction from maps".

---

## Folder Structure

Ensure this folder structure exists:

```
google-maps-scraper/
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── manifest.json
├── popup/
│   └── ...
└── ...
```

---

## Implementation Steps

### Step 1: Create Icons Folder

If it doesn't already exist, create the `icons` folder in the extension root:

```bash
mkdir -p icons
```

### Step 2: Add Icon Files

The icon files should be placed in the `icons/` folder. The icons are:

**icon16.png** (16x16 - for toolbar):
- Small blue location pin with envelope
- Must be crisp and recognizable at tiny size

**icon48.png** (48x48 - for extensions page):
- Medium size, more detail visible
- Used in chrome://extensions

**icon128.png** (128x128 - for store/install):
- Full detail version
- Used in Chrome Web Store and installation prompts

### Step 3: Update manifest.json

Add or update the `icons` section and `action.default_icon` in `manifest.json`:

```json
{
  "manifest_version": 3,
  "name": "Maps Lead Scraper",
  "version": "1.0.0",
  "description": "Extract business leads and emails from Google Maps",
  
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    },
    "default_title": "Maps Lead Scraper"
  },
  
  // ... rest of manifest
}
```

**Important:** Make sure both `icons` (top-level) AND `action.default_icon` are set. They serve different purposes:
- `icons` - Used for extension management page and store listing
- `action.default_icon` - Used for the toolbar button

---

## Icon Source Files

If you need to regenerate the icons, here is the SVG source code:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <!-- Map Pin Body -->
  <path d="M64 4C37.5 4 16 25.5 16 52c0 35 48 72 48 72s48-37 48-72C112 25.5 90.5 4 64 4z" fill="#4285F4"/>
  
  <!-- Inner circle (white background for envelope) -->
  <circle cx="64" cy="50" r="28" fill="white"/>
  
  <!-- Envelope body -->
  <rect x="42" y="38" width="44" height="28" rx="3" fill="#4285F4"/>
  
  <!-- Envelope flap (triangle) -->
  <path d="M42 41 L64 56 L86 41" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  
  <!-- Envelope bottom lines -->
  <path d="M42 63 L54 53" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"/>
  <path d="M86 63 L74 53" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"/>
</svg>
```

To convert SVG to PNG at different sizes, you can use:
- Online: svgtopng.com, cloudconvert.com
- CLI: `cairosvg icon.svg -o icon128.png -W 128 -H 128`
- Design tools: Figma, Canva, Inkscape

---

## Verification

After implementation, verify:

1. **Reload the extension** in `chrome://extensions` (click the refresh icon)

2. **Check toolbar:** The new icon should appear in the Chrome toolbar (you may need to pin it)

3. **Check extensions page:** Go to `chrome://extensions` - the icon should show next to the extension name

4. **Check popup:** Click the extension icon - the popup should open normally

5. **Check all sizes render correctly:**
   - 16px: Should be recognizable as a blue pin in toolbar
   - 48px: Should show clear envelope detail on extensions page
   - 128px: Should look crisp if you inspect element or view in store

---

## Troubleshooting

**Icon not showing:**
- Check file paths in manifest.json match actual file locations
- Ensure PNG files are valid (not corrupted)
- Try hard refresh: disable extension, re-enable, reload Chrome

**Icon looks blurry:**
- Ensure you're using the correct size file for each reference
- PNGs should be exact dimensions (16x16, 48x48, 128x128)

**Manifest error on reload:**
- Check JSON syntax (trailing commas, missing quotes)
- Validate manifest at chrome://extensions - errors shown in red

---

## Testing Checklist

- [ ] `icons/` folder exists with all 3 PNG files
- [ ] `manifest.json` has `icons` object with all 3 sizes
- [ ] `manifest.json` has `action.default_icon` with all 3 sizes
- [ ] Extension reloads without errors
- [ ] Icon visible in Chrome toolbar
- [ ] Icon visible on chrome://extensions page
- [ ] Popup still opens correctly when icon clicked

---

**Note:** The icon PNG files should be provided separately. This brief assumes Matt has already downloaded the icon files from the previous session and will place them in the icons folder before or during implementation.
