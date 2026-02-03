# DEVELOPMENT BRIEF: Enhanced Email Discovery — v2.1

**Maps Lead Scraper | Quenito Labs | February 3, 2026**

---

| Field | Detail |
|-------|--------|
| **Priority** | IMMEDIATE — Build before Video 1 recording |
| **Owner** | Jack (Claude Code) |
| **Requester** | Matt (via Brian / HQ Project) |
| **Version** | v2.1 (current production is v2.0.0) |
| **Repo** | github.com/quenito/google-maps-scraper \| ~/projects/google-maps-scraper |
| **Branch** | Create `feature/v2.1-enhanced-email-discovery` from main |

---

## 1. Background & Why This Matters

Email extraction is the key differentiator for Maps Lead Scraper. Our current approach scans only the homepage of each business website. Competitive research on Scrap.io revealed they return additional data fields we currently miss, including contact page URLs and social media profile links.

The gap is real. Here is a concrete example we found during research:

- **Business:** Emergency Plumbing & Gas (Wodonga, VIC)
- **Website (epag.com.au):** No email anywhere on homepage
- **Contact page (epag.com.au/contact-us):** No email — just a contact form and phone number
- **Facebook page:** admin@epag.com.au is displayed in the public profile card

Our current scraper returns ZERO emails for this business. With v2.1, we would capture admin@epag.com.au via Facebook extraction. This pattern is common across trades and small businesses — many lack proper websites but maintain active Facebook pages with contact details.

**Impact:** Our test data shows car mechanics at only 29–31% email hit rate. Many small shops lack websites but have Facebook pages. This update could push low-performing categories up significantly, strengthening our core differentiator.

---

## 2. Feature Scope — 4 Sub-Features

All four sub-features below comprise v2.1. They should be developed in order as each builds on the previous.

---

### Feature A: Contact Page Scanning

**What to build:**

After scanning the homepage for emails (current behaviour), also check common contact/about page paths on the same domain. Many businesses only put their email on a contact page, not the homepage.

**Pages to scan (in this order, stop after finding an email if desired for speed, but always record the contact page URL if found):**

1. `/contact`
2. `/contact-us`
3. `/about`
4. `/about-us`

**Implementation notes:**

- Use the same email regex/extraction logic already in place for homepage scanning.
- Fetch each path and scan for email patterns. If the page returns a 404 or redirect to homepage, skip it and try the next.
- This should run as part of the existing email extraction flow (after homepage scan, before marking a business as "no email found").
- Respect the same rate limiting already in place for homepage visits.

---

### Feature B: Contact Page URL as New Export Field

**What to build:**

Always return the contact page URL (if found) as its own column in the CSV and Google Sheets export, regardless of whether an email was found there. This is useful data on its own — marketing agencies doing outreach may want to send prospects directly to that page.

**New export field:**

| Field Name | Example Value | Notes |
|------------|---------------|-------|
| **contactPageUrl** | https://www.epag.com.au/contact-us | URL of the first valid contact/about page found. Empty if none found. |

**Implementation notes:**

- Add `contactPageUrl` to the data model alongside existing fields (name, email, phone, etc.).
- Include in the Custom Field Selection UI so users can choose to include/exclude it from exports.
- In Google Sheets export, make this a clickable hyperlink (same pattern as the existing Google Maps URL column).

---

### Feature C: Social Media Link Extraction

**What to build:**

Scan the business website (homepage and any contact/about pages already being visited for Feature A) for links to social media profiles. Return these as new data fields in the export.

**New export fields:**

| Field Name | Detection Pattern | Example Value |
|------------|-------------------|---------------|
| **facebookUrl** | facebook.com/ links | https://www.facebook.com/people/Emergency-Plumbing-Gas-PL/100067408280140/ |
| **instagramUrl** | instagram.com/ links | https://www.instagram.com/businessname/ |
| **linkedinUrl** | linkedin.com/company/ or linkedin.com/in/ links | https://www.linkedin.com/company/businessname/ |
| **twitterUrl** | twitter.com/ or x.com/ links | https://x.com/businessname |

**Implementation notes:**

- Scan all `<a href>` tags on each page already being visited (homepage + contact/about pages from Feature A).
- Match against known social media domain patterns (facebook.com, instagram.com, linkedin.com, twitter.com, x.com).
- Exclude generic share/follow buttons that link to the platform homepage (e.g., facebook.com/sharer or twitter.com/intent). We want profile page links only.
- Store the first valid URL found for each platform. If multiple Facebook links exist, take the first one that looks like a profile/page URL.
- Add all four fields to the Custom Field Selection UI.
- In Google Sheets export, make these clickable hyperlinks.

---

### Feature D: Facebook Email Extraction

**What to build:**

For businesses where no email was found on the website or contact/about pages (Features A), and where a Facebook URL was found (Feature C), attempt to fetch the public Facebook page and extract the email from the profile/about section.

This is the highest-impact feature in this brief. Facebook public business pages often display email, phone, and address in a structured format in the "About" or "Info" section of the page.

**Flow:**

1. Homepage scan (existing) → no email found
2. Contact/about page scan (Feature A) → no email found
3. Facebook URL was captured (Feature C) → fetch the Facebook page
4. Scan the Facebook page HTML for email patterns
5. If email found, store it as the business email

**Implementation notes:**

- Only attempt Facebook extraction when no email was found via website scanning. Don't replace a website-sourced email with a Facebook-sourced one.
- Facebook public pages render some content server-side. The email address is often in a structured info section. Use the same email regex already in the codebase.
- Be mindful of rate limiting when fetching Facebook pages. Introduce a small delay between requests (similar to existing website fetch delays).
- If Facebook blocks the request or returns no useful HTML, gracefully skip and leave email field empty. Don't break the overall flow.
- Consider adding a small indicator in the UI or export to show email source (e.g., "website" vs "facebook") — but this is optional for v2.1. We can add it later if useful.

---

## 3. Updated Data Model

After v2.1, each scraped business record should contain the following fields. **New fields marked with ✨**

| Field | Status | Source | Notes |
|-------|--------|--------|-------|
| name | Existing | Google Maps DOM | Business name |
| phone | Existing | Google Maps DOM | Phone number |
| email | Existing | Website / Facebook | Now also sourced from contact pages and Facebook |
| website | Existing | Google Maps DOM | Business website URL |
| address | Existing | Google Maps DOM | Full address |
| rating | Existing | Google Maps DOM | Star rating (1–5) |
| reviewCount | Existing | Google Maps DOM | Number of reviews |
| category | Existing | Google Maps DOM | Business category |
| googleMapsUrl | Existing | Google Maps DOM | Direct link to Maps listing |
| **✨ contactPageUrl** | **NEW** | Website crawl | URL of /contact, /contact-us, /about, or /about-us page if found |
| **✨ facebookUrl** | **NEW** | Website crawl | Facebook profile/page URL found on website |
| **✨ instagramUrl** | **NEW** | Website crawl | Instagram profile URL found on website |
| **✨ linkedinUrl** | **NEW** | Website crawl | LinkedIn company/profile URL found on website |
| **✨ twitterUrl** | **NEW** | Website crawl | Twitter/X profile URL found on website |

---

## 4. Implementation Order

Build in this order because each feature depends on the previous:

| Step | Feature | Why This Order | Depends On |
|------|---------|----------------|------------|
| 1 | **A: Contact Page Scanning** | Extends existing email extraction flow. Already visiting websites, now checking additional pages. | — |
| 2 | **B: Contact Page URL Field** | Simple data capture from the pages already being visited in Step 1. | A |
| 3 | **C: Social Media Extraction** | Scans same pages visited in Steps 1–2 for social links. No additional page fetches needed. | A |
| 4 | **D: Facebook Email Extraction** | Requires the Facebook URL from Step 3. Only runs when no email found in Steps 1–2. | A + C |

---

## 5. Files Likely Affected

Based on the existing v2.0.0 codebase structure (Manifest V3 Chrome extension with ES6 modules):

- **background/ (service worker)** — Where email extraction logic likely lives. This is where the new page fetching, contact page scanning, social media link extraction, and Facebook email fetching will be added.
- **popup/ (UI)** — Add new fields to the Custom Field Selection dropdown. All 5 new fields (contactPageUrl, facebookUrl, instagramUrl, linkedinUrl, twitterUrl) should appear as toggleable options.
- **CSV export logic** — Add new columns to CSV output when the corresponding fields are selected.
- **Google Sheets export logic** — Add new columns. Make contactPageUrl and all social URLs clickable hyperlinks (same pattern as existing googleMapsUrl column).
- **manifest.json** — May need to add facebook.com to host permissions if not already covered by a broad pattern. Check current permissions.

---

## 6. Testing Checklist

After building, test with these specific scenarios:

- [ ] **Business with email on homepage only** — Should still work as before. No regression.
- [ ] **Business with email on /contact-us but not homepage** — Should now find the email via contact page scanning.
- [ ] **Business with no email on website but email on Facebook** — Should capture email via Facebook extraction. Test with epag.com.au scenario.
- [ ] **Business with social media links in footer** — Should capture all valid profile URLs. Exclude generic share buttons.
- [ ] **Business with no website at all** — Should handle gracefully. All new fields empty.
- [ ] **CSV export with new fields** — Verify new columns appear correctly when selected in Custom Field Selection.
- [ ] **Google Sheets export with new fields** — Verify new columns appear with clickable hyperlinks.
- [ ] **Custom Field Selection** — All 5 new fields appear in the dropdown and can be toggled on/off.

**Recommended test queries (same locations used in v2.0 testing for comparison):**

- "plumbers in New Jersey" — 44% hit rate in v2.0, measure improvement
- "car mechanics in Manhattan NY" — 31% hit rate in v2.0, should see biggest improvement
- "real estate agents in Manchester UK" — 59% hit rate in v2.0, likely modest improvement

---

## 7. What NOT to Change

- Do not modify core scraping logic (Google Maps DOM extraction). Only the email extraction and data export flows should be changed.
- Do not change the trial system, license key validation, or tier detection.
- Do not change duplicate detection or search history functionality.
- Do not remove or rename any existing export fields. New fields are additive only.
- Do not change the existing UI layout significantly. New fields should integrate into the existing Custom Field Selection dropdown.

---

## 8. Definition of Done

- [ ] Contact pages (/contact, /contact-us, /about, /about-us) are scanned for emails after homepage scan.
- [ ] contactPageUrl field is captured and available in exports.
- [ ] Social media profile URLs (Facebook, Instagram, LinkedIn, Twitter/X) are extracted from websites.
- [ ] All 5 new fields appear in Custom Field Selection UI.
- [ ] All 5 new fields export correctly in CSV format.
- [ ] All 5 new fields export as clickable hyperlinks in Google Sheets.
- [ ] Facebook email extraction works for businesses with no website email but a public Facebook page.
- [ ] No regressions in existing functionality (scraping, export, duplicate detection, trial system).
- [ ] Tested with at least 3 different search queries across different industries/locations.

---

## After v2.1 Ships — Next Steps

Once Jack completes and tests v2.1, the following updates will be handled by Brian and Matt from HQ:

- **Gumroad product listing** — Update feature descriptions and comparison tables to include new data fields.
- **New product screenshots** — Matt will take new screenshots showing the additional columns in CSV and Google Sheets output.
- **Video 1 production brief** — Update storyboard to showcase the new fields in the demo and export scenes.
- **Email hit rate benchmarks** — Re-run the same 12 test queries from v2.0 testing to measure the improvement in email discovery rates.

---

*Created by Brian (Strategy & Growth Advisor) | Quenito Labs HQ*
