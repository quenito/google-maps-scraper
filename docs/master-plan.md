# Income Replacement Master Plan
## Target: Replace $1,600/week ($230/day) from Woolworths

**Owner:** Matt (Quenito Enterprises)
**Created:** January 2025
**Status:** Planning Phase

---

## Overview

Two parallel income streams to replace office salary:

| Stream | Type | Status | Target Revenue |
|--------|------|--------|----------------|
| **Scraper Tools** | Gumroad Products | 🟡 Building | $800-1,200/month |
| **Grocery Data Product** | Subscription/API | 🔴 Awaiting Data | $600-1,000/month |

**Combined Target:** $1,600-2,200/month → scaling to $6,400+/month

---

# STREAM 1: SCRAPER TOOLS (Gumroad)

## Strategy
Build and sell in-demand scraper tools as one-time purchases on Gumroad. Leverage existing Python + Playwright skills. Start with Chrome extensions for lower infrastructure costs.

## Market Validation
- Web scraping market: $754M (2024) → $2.87B by 2034 (14.3% CAGR)
- Enterprise tools expensive ($49-199/mo) = gap for affordable one-time tools
- Proven demand: Mike Powers' Google Maps scraper has 245 sales on Gumroad

---

## PRODUCT #1: Google Maps Lead Scraper (FIRST BUILD)

### Product Overview
Chrome extension that extracts business leads from Google Maps search results with one click.

### Key Differentiators
1. **One-time purchase** (no subscription fatigue)
2. **Email extraction** from business websites (key feature competitors lack)
3. **Clean, modern UI** 
4. **Unlimited exports** (no monthly caps)
5. **Developer tier** with source code

### Data Fields Extracted
- Business name
- Phone number
- Website URL
- Address
- Rating (1-5 stars)
- Review count
- Business category
- Google Maps URL
- **Email** (scraped from website) ← KEY DIFFERENTIATOR
- Social media links (if found)

### Pricing Tiers

| Tier | Price | Includes |
|------|-------|----------|
| Standard | $49 | Extension + CSV export + email extraction |
| Pro | $79 | + Google Sheets integration + priority support |
| Developer | $129 | + Full source code + resell rights |

### Technical Architecture

```
┌─────────────────────────────────────────┐
│           Chrome Extension              │
├─────────────────────────────────────────┤
│  Popup UI (HTML/CSS/JS)                │
│  - Start/Stop button                    │
│  - Progress indicator                   │
│  - Export button                        │
├─────────────────────────────────────────┤
│  Content Script                         │
│  - Injects into Google Maps page        │
│  - Scrapes listing data from DOM        │
│  - Scrolls to load more results         │
├─────────────────────────────────────────┤
│  Background Service Worker              │
│  - Coordinates scraping                 │
│  - Visits business websites for emails  │
│  - Stores data temporarily              │
│  - Generates CSV export                 │
└─────────────────────────────────────────┘
```

### Tech Stack
- Chrome Extension (Manifest V3)
- JavaScript for scraping logic
- Simple popup UI (HTML/CSS/JS)
- No backend needed for v1

### Development Phases

**Phase 1: Core Scraping (Week 1)**
- Set up Chrome extension boilerplate
- Build content script to extract listings from Google Maps DOM
- Create basic popup UI
- CSV export functionality

**Phase 2: Email Extraction (Week 2)**
- Background script to visit business websites
- Email pattern detection (regex)
- Rate limiting to avoid detection
- Store emails with business data

**Phase 3: Polish & Package (Week 3)**
- Clean up UI
- Add progress indicators
- Error handling
- Create Gumroad listing
- Record demo video

### Go-to-Market

**Launch Channels:**
1. **Gumroad** - Primary storefront
2. **Reddit** - r/webscraping, r/entrepreneur, r/sales, r/leadgeneration
3. **YouTube** - Tutorial: "How to scrape Google Maps leads" → links to tool
4. **Indie Hackers** - Build in public posts
5. **Twitter/X** - Document build journey

**Revenue Target:**
- Month 1: 20 sales × $49 avg = $980
- Month 3: 50 sales × $55 avg = $2,750
- Month 6: 100+ sales × $60 avg = $6,000+

---

## FUTURE SCRAPER PRODUCTS (Pipeline)

Build these after Google Maps scraper is generating revenue:

### Lead Generation Scrapers (High Demand)

| Product | Target Audience | Price Point | Priority |
|---------|----------------|-------------|----------|
| Apollo.io Exporter | Sales teams, agencies | $69-99 | HIGH |
| LinkedIn/Sales Nav Scraper | Recruiters, B2B sales | $79-129 | HIGH |
| Indeed/Seek Job Scraper | Recruiters, HR | $49-79 | MEDIUM |
| Facebook Group Member Scraper | Marketers | $49-69 | MEDIUM |

### E-commerce/Price Scrapers

| Product | Target Audience | Price Point | Priority |
|---------|----------------|-------------|----------|
| Amazon Price Tracker | Resellers, arbitrage | $49-79 | MEDIUM |
| eBay Sold Listings Scraper | Resellers | $39-59 | LOW |
| Competitor Price Monitor | E-commerce owners | $59-99 | MEDIUM |

### Social Media Scrapers

| Product | Target Audience | Price Point | Priority |
|---------|----------------|-------------|----------|
| Reddit Niche Monitor | Marketers, researchers | $39-69 | MEDIUM |
| Instagram Profile Scraper | Influencer marketers | $49-79 | LOW |
| YouTube Channel Scraper | Content researchers | $39-59 | LOW |

### Australian-Specific (Local Advantage)

| Product | Target Audience | Price Point | Priority |
|---------|----------------|-------------|----------|
| Seek.com.au Job Scraper | AU recruiters | $49-79 | MEDIUM |
| Domain/REA Property Scraper | Real estate investors | $69-99 | MEDIUM |
| Australian Business Directory | Local marketers | $49-69 | LOW |

---

## Sales Channels for Scraper Tools

| Channel | Effort | Potential | Notes |
|---------|--------|-----------|-------|
| **Gumroad** | Low | High | Primary storefront, handles payments |
| **Chrome Web Store** | Medium | High | Free version → upsell to Gumroad |
| **Reddit** | Medium | High | Helpful posts in relevant subs |
| **YouTube** | High | Very High | Tutorials drive long-term traffic |
| **Indie Hackers** | Low | Medium | Build in public, community support |
| **Twitter/X** | Medium | Medium | Document journey, grow audience |
| **Facebook Groups** | Medium | Medium | Lead gen, cold email groups |
| **Fiverr** | Low | Medium | Offer as service, link to tool |

---

# STREAM 2: GROCERY DATA PRODUCT

## Strategy
Monetize existing grocery scraping infrastructure (20k+ products, 9 cron jobs, Sydney VPS) by packaging data for consumers or developers.

## Current Infrastructure
- **VPS:** Binary Lane Sydney (4 CPU, 8GB RAM)
- **Database:** Postgres on Supabase
- **Scraping:** Python + Playwright with stealth features
- **Cron Jobs:** 9 scheduled jobs running
- **Data Volume:** 20,000+ products

## ⚠️ DATA DOCUMENTATION NEEDED

**Status:** Awaiting data documentation from Matt

**Required Information:**
- [ ] Which stores are being scraped (Woolworths, Coles, Aldi, IGA?)
- [ ] What data fields are captured per product
- [ ] How much price history exists (days/weeks/months?)
- [ ] Update frequency per store
- [ ] Any rate limiting or access restrictions
- [ ] Current database schema
- [ ] Sample data export

---

## Potential Product Formats (TBD based on data)

### Option A: Price Drop Alerts (Subscription)
- Telegram/Discord bot sends alerts when prices drop
- Users set watchlists or categories
- Price: $9-19/month

### Option B: Deal Hunter API (Developer)
- API access to price data
- Webhooks for price changes
- Price: $29-49/month or pay-per-call

### Option C: Weekly Deals Report (Subscription)
- Curated best deals by category
- Email or PDF delivery
- Price: $4.99-9.99/month

### Option D: Arbitrage Alerts (Premium)
- Cross-retailer price differences
- Reseller-focused
- Price: $29-49/month

### Option E: Raw Data Access (One-time/Subscription)
- CSV/JSON exports
- Historical price data
- Price: $99 one-time or $19/month

---

## Target Audiences (TBD)

| Audience | Pain Point | Willingness to Pay |
|----------|------------|-------------------|
| Deal hunters | Missing sales | Low ($5-10/mo) |
| Budget families | Grocery costs | Low-Medium ($10-20/mo) |
| Resellers/Arbitrage | Finding opportunities | High ($30-50/mo) |
| Content creators | Deal content | Medium ($20-30/mo) |
| Developers | Building apps | Medium-High ($30-50/mo) |
| Researchers | Price trend data | Medium ($20-40/mo) |

---

## Next Steps for Grocery Product

1. **Matt to provide:** System and data documentation
2. **Claude to analyze:** Data quality, completeness, monetization fit
3. **Together decide:** Which product format to pursue
4. **Build MVP:** Based on chosen format
5. **Test with users:** Validate willingness to pay
6. **Launch:** On appropriate platform

---

# COMBINED TIMELINE

## Month 1
- [ ] **Week 1-2:** Build Google Maps Scraper MVP
- [ ] **Week 2:** Document grocery data system
- [ ] **Week 3:** Polish scraper, create Gumroad listing
- [ ] **Week 3-4:** Analyze grocery data, decide product format
- [ ] **Week 4:** Launch Google Maps Scraper

## Month 2
- [ ] Market Google Maps Scraper (Reddit, YouTube, etc.)
- [ ] Build Grocery Data Product MVP
- [ ] Gather feedback, iterate on scraper
- [ ] Launch Grocery Data Product beta

## Month 3
- [ ] Scale marketing for both products
- [ ] Start building Scraper #2 (Apollo or LinkedIn)
- [ ] Optimize pricing based on sales data
- [ ] Target: $1,000+ combined monthly revenue

## Month 6
- [ ] 3-4 scraper products live
- [ ] Grocery data product established
- [ ] Target: $2,500+ combined monthly revenue
- [ ] Evaluate leaving Woolworths

---

# RESOURCES & ASSETS

## Matt's Technical Stack
- Python + Playwright + stealth features
- Ubuntu VPS (Binary Lane Sydney)
- Supabase (Postgres)
- VS Code + Claude Code integration
- Claude Pro subscription

## Accounts Needed
- [ ] Gumroad seller account
- [ ] YouTube channel (for tutorials)
- [ ] Reddit account with karma
- [ ] Twitter/X account
- [ ] Indie Hackers profile

## Investment Budget
- Claude Pro: Already subscribed
- VPS: Already running
- Gumroad: Free (takes % of sales)
- YouTube: Free
- Domain (optional): ~$15/year
- **Total additional needed:** ~$0-50

---

# SUCCESS METRICS

## Weekly Targets (Post-Launch)

| Metric | Target | Stretch |
|--------|--------|---------|
| Scraper sales/week | 5 | 10 |
| Grocery subscribers | 20 | 50 |
| Weekly revenue | $400 | $800 |
| Reddit posts/week | 2-3 | 5 |
| YouTube videos/month | 2 | 4 |

## Monthly Revenue Progression

| Month | Scraper Revenue | Grocery Revenue | Total |
|-------|-----------------|-----------------|-------|
| 1 | $500 | $0 | $500 |
| 2 | $800 | $200 | $1,000 |
| 3 | $1,200 | $500 | $1,700 |
| 6 | $2,500 | $1,000 | $3,500 |
| 12 | $5,000 | $2,000 | $7,000 |

---

# NOTES

- Scraper tools = faster to revenue, lower ongoing effort
- Grocery data = leverages existing infrastructure, recurring revenue
- Both streams complement each other and reduce risk
- Focus on Google Maps Scraper FIRST for quick win
- Document everything for future products

---

**Last Updated:** January 2025
**Next Review:** After Google Maps Scraper launch
