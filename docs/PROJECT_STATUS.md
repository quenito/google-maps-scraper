# Google Maps Lead Scraper - Project Status

**Project:** Google Maps Lead Scraper Chrome Extension
**Owner:** Matt (Quenito Enterprises)
**Last Updated:** January 30, 2026

---

## Current Status: ✅ ALL PRE-LAUNCH FEATURES COMPLETE

All core functionality (Phase 1 & 2) plus all 6 pre-launch enhancement features are complete and ready for launch.

---

## Build Progress

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Core scraping (business data extraction) | ✅ Complete |
| Phase 2 | Email extraction from business websites | ✅ Complete |
| Phase 3 | Pre-launch features & UI polish | ✅ Complete |
| Phase 4 | Gumroad listing & launch | 🟡 Not started |

---

## Features Working

### Core Features (Phase 1 & 2)
- ✅ Extract business listings from Google Maps search results
- ✅ Auto-scroll to load more results (up to ~120 per search)
- ✅ Capture: name, rating, review count, category, address, phone, website, Google Maps URL
- ✅ Email extraction from business websites (homepage + contact pages)
- ✅ Multiple email capture per business
- ✅ Progress indicator in popup UI
- ✅ CSV export functionality
- ✅ Works globally (US, UK, Canada, Australia tested)

### Pre-Launch Features (Phase 3) - All Complete

| Feature | Description | Status |
|---------|-------------|--------|
| Auto-Extract Emails | Checkbox to automatically extract emails after scraping completes | ✅ Complete |
| Duplicate Detection | Tracks scraped URLs, skips duplicates, shows count, clear history button | ✅ Complete |
| Search History | Collapsible log of past searches with query, date, leads/emails count | ✅ Complete |
| Custom Field Selection | Choose which fields to include in CSV export | ✅ Complete |
| Browser Notifications | Desktop notifications when scraping/email extraction completes | ✅ Complete |
| Google Sheets Export | OAuth2 integration to export directly to Google Sheets (Pro Tier) | ✅ Complete |

### Additional Polish
- ✅ Extract Emails button greys out when auto-extract is enabled (prevents confusion)
- ✅ Tooltip on auto-extract checkbox explaining manual control option
- ✅ Google Sheets modal with "Create new" / "Append to last" options
- ✅ Toggle notifications setting persists across sessions
- ✅ All user preferences saved to chrome.storage.local
- ✅ Clear Results button to reset UI after exporting
- ✅ Improved scroll detection (waits for Google Maps loading spinner)
- ✅ End-of-results detection ("You've reached the end of the list")

### Google Sheets Pro Features
- ✅ Search query included in spreadsheet title (e.g., `Google Maps Leads "plumber penrith" - 1/30/2026`)
- ✅ Maps URL column shows clickable business names instead of raw URLs (HYPERLINK formula)
- ✅ One-click access to Google Maps listing from spreadsheet

---

## Test Results (January 29, 2026)

### Global Testing Summary

| Search Query | Location | Leads | Emails | Hit Rate |
|--------------|----------|-------|--------|----------|
| Plumbers | New Jersey, USA | 120 | 53 | 44% |
| Car Mechanics | Manhattan, NY, USA | 89 | 28 | 31% |
| Electricians | Leeds, UK | 120 | 63 | 53% |
| Electricians | Ontario, Canada | 120 | 74 | 62% |
| Real Estate Agents | Manchester, UK | 116 | 69 | 59% |
| Electricians | Glen Waverley, AU | 120 | 71 | 59% |
| Real Estate Agents | Fortitude Valley, Brisbane, AU | 118 | 75 | 64% |
| Car Mechanics | Hurstville, NSW, AU | 62 | 18 | 29% |
| Plumbers | Sydney, AU | 62 | 45-47 | ~73% |

### Insights

1. **Global compatibility confirmed** - Works identically across US, UK, Canada, Australia
2. **Email hit rates vary by industry:**
   - Real estate agents: 59-64% (highest - they want leads)
   - Electricians/Plumbers/Trades: 44-73% (solid)
   - Car mechanics: 29-31% (lower - many small shops lack websites)
3. **Volume:** Most searches return ~120 leads (scroll limit)
4. **Multi-email capture working:** Some businesses return 5-7 emails

### Data Quality Notes

- Clean business emails (info@, hello@, admin@, etc.)
- Occasional junk emails slip through (partial captures)
- Sponsored listings sometimes have Google Ads tracking URLs instead of real websites
- Category field has minor formatting quirks (can be cleaned in future version)

---

## Technical Stack

- **Type:** Chrome Extension (Manifest V3)
- **Language:** JavaScript (ES6 modules)
- **UI:** HTML/CSS popup
- **Storage:** chrome.storage.local (preferences, history, duplicate tracking)
- **Export:** CSV format + Google Sheets API v4
- **Auth:** Google OAuth2 via chrome.identity API
- **Notifications:** chrome.notifications API

---

## Repository

- **GitHub:** github.com/quenito/google-maps-scraper
- **Branch:** main
- **Local path:** ~/projects/google-maps-scraper

---

## Pricing Strategy (Planned)

| Tier | Price (USD) | Includes |
|------|-------------|----------|
| Standard | $49 | Extension + CSV export + email extraction + all base features |
| Pro | $79 | + Google Sheets integration (✅ ready) + priority support |
| Developer | $129 | + Full source code + resell rights |

**Target market:** Global English-speaking (US, UK, Canada, Australia, etc.)

**All tiers include:** Auto-extract, duplicate detection, search history, custom fields, notifications

---

## Next Steps

### Google Sheets Integration ✅ COMPLETE
- [x] Create Google Cloud Console project
- [x] Enable Google Sheets API
- [x] Configure OAuth consent screen (scopes, test users)
- [x] Create OAuth credentials (Chrome Extension type)
- [x] Update `manifest.json` with OAuth client_id: `260560444236-5f7ggmuev8dokq3vh1k3d0v3lqdjtai0.apps.googleusercontent.com`
- [x] Test Google Sheets export end-to-end ✅ Working perfectly!

### Remaining Before Launch
- [ ] Create extension icons (see Icon Creation Options below)
- [ ] Commit current working version to GitHub
- [ ] Set up Gumroad seller account

### Launch Prep
- [ ] Write Gumroad product listing (title, description, screenshots)
- [ ] Record demo video (2-3 min showing the tool in action)
- [ ] Create product screenshots/GIFs
- [ ] Set up pricing tiers on Gumroad

### Marketing (Post-Launch)
- [ ] Reddit posts: r/webscraping, r/entrepreneur, r/sales, r/leadgeneration
- [ ] YouTube tutorial: "How to scrape Google Maps leads"
- [ ] Indie Hackers: Build in public post
- [ ] Twitter/X: Document journey

---

## Icon Creation Options

The extension needs icons at 3 sizes: 16x16, 48x48, and 128x128 pixels (PNG format).

### Option 1: AI Image Generators (Recommended for Pro Look)

**DALL-E 3 (via ChatGPT Plus)**
- Best for: High-quality, unique icons
- Cost: ChatGPT Plus subscription ($20/mo) or API credits
- Prompt example: "A simple, modern app icon for a Google Maps lead scraper tool. Blue location pin combined with an envelope or email symbol. Flat design, minimal, suitable for a Chrome extension. White background, 128x128 pixels."

**Midjourney**
- Best for: Artistic, eye-catching designs
- Cost: Subscription ($10-30/mo)
- Good for creating multiple variations to choose from

**Leonardo.ai / Ideogram**
- Best for: Free tier available, decent quality
- Cost: Free tier available with limits

**Canva AI Image Generator**
- Best for: Easy to use, integrated editing
- Cost: Free tier or Pro ($13/mo)
- Can generate and resize in same tool

### Option 2: Manual SVG Creation (Code-Based)

Create icons using SVG code that can be exported to PNG at any size. Best for simple, clean geometric designs.

**Pros:**
- Free (no tools required)
- Perfect scalability
- Easy to modify colors/shapes
- Consistent across all sizes

**Cons:**
- Limited to geometric/simple designs
- Requires some design sensibility

**Example concept:** Blue location pin with email envelope overlay, or map icon with @ symbol.

### Option 3: Icon Libraries + Editing

Use free icon libraries as a starting point:

- **Flaticon** (flaticon.com) - Huge library, attribution required for free tier
- **Icons8** (icons8.com) - Good quality, attribution or paid
- **Material Design Icons** - Google's icon set, free
- **Heroicons** - Clean, modern, free

Combine 2-3 icons in an image editor (Canva, Figma) to create a unique design.

### Recommended Approach

1. **Quick & Easy:** Use Canva with AI image generator - create, edit, and export all sizes in one place
2. **Best Quality:** Use DALL-E 3 for the main design, then resize in any image editor
3. **Simplest/Free:** Create a simple SVG design with a map pin + email concept

### Icon Design Guidelines

- Use Google's blue (#4285F4 or #1a73e8) as the primary color to match Maps branding
- Keep design simple - it needs to look good at 16x16 pixels
- Concepts that work well:
  - Location pin + email envelope
  - Map marker with @ symbol
  - Pin with people/leads icon
  - Magnifying glass over map
- Avoid: text, too many details, complex gradients

---

## Revenue Targets

| Timeframe | Target Sales | Revenue |
|-----------|--------------|---------|
| Month 1 | 20 sales | ~$1,000 |
| Month 3 | 50 sales | ~$2,750 |
| Month 6 | 100+ sales | ~$6,000 |

---

## Known Issues / Future Improvements

### Minor Issues (Not blockers)
- Category field sometimes shows rating instead of category
- Occasional partial email captures (e.g., "lumbing@gmail.com")
- Sponsored listings may have tracking URLs

### Future Features (Post-Launch v2.0+)

All originally planned pre-launch features have been implemented. Potential future enhancements:

| Feature | Description | Priority |
|---------|-------------|----------|
| Re-run past search | Click on search history item to re-run that exact search | Low |
| Export history | Export search history as CSV/JSON | Low |
| Filters | Filter scraped results by rating, review count, etc. | Medium |
| Email verification | Basic email format validation | Low |
| Multiple export formats | JSON, Excel (.xlsx) in addition to CSV | Low |
| Dark mode | Match system theme preference | Low |

---

## Notes

- Original Phase 1 brief: `google-maps-scraper-phase1-brief.md`
- Extension built using Claude Code in VS Code
- Development time: Phase 1+2 (~1 session), Phase 3 features (~1 session)
- Google Cloud Console project configured for OAuth2

---

**Last tested:** January 30, 2026
**Features complete:** January 30, 2026
**Google Sheets tested:** January 30, 2026 ✅
**Next review:** After Gumroad launch
