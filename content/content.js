// State
let isScrapin = false;
let scrapedData = [];
let seenUrls = new Set();
let urlHistory = new Set();
let totalDuplicatesSkipped = 0;
let activeFilters = null;
let totalFilteredOut = 0;
const MAX_RESULTS = 500;
const SCROLL_DELAY = 2000;
const MAX_NO_NEW_RESULTS = 10;
const LOADING_WAIT_DELAY = 1500;

// Load URL history from storage on script load
chrome.storage.local.get(['scrapedUrlHistory'], (result) => {
  if (result.scrapedUrlHistory && Array.isArray(result.scrapedUrlHistory)) {
    urlHistory = new Set(result.scrapedUrlHistory);
    console.log(`[Scraper] Loaded ${urlHistory.size} URLs from history`);
  }
});

// Check if we're on a Google Maps search results page
function isOnSearchResults() {
  return window.location.href.includes('/maps/search/') ||
         window.location.href.includes('/maps/place/');
}

// Check if Google Maps is currently loading more results
function isGoogleMapsLoading() {
  // Look for loading spinner/indicator in the results panel
  // Google uses various loading indicators:

  // 1. Circular progress indicator (SVG spinner)
  const spinners = document.querySelectorAll('div[role="progressbar"], svg[class*="progress"], div[class*="loading"]');
  for (const spinner of spinners) {
    const style = window.getComputedStyle(spinner);
    if (style.display !== 'none' && style.visibility !== 'hidden') {
      const rect = spinner.getBoundingClientRect();
      // Check if it's visible in the results area (not a different part of the page)
      if (rect.width > 0 && rect.height > 0) {
        console.log('[Scraper] Loading spinner detected');
        return true;
      }
    }
  }

  // 2. Check for the "loading" class on result containers
  const loadingElements = document.querySelectorAll('[class*="loading"], [aria-busy="true"]');
  for (const el of loadingElements) {
    const container = getResultsContainer();
    if (container && container.contains(el)) {
      console.log('[Scraper] Loading element detected in results container');
      return true;
    }
  }

  // 3. Check for partially loaded content (placeholder elements)
  const placeholders = document.querySelectorAll('div.m6QErb div[style*="height"][style*="background"]');
  if (placeholders.length > 0) {
    console.log('[Scraper] Placeholder elements detected');
    return true;
  }

  return false;
}

// Wait for loading to complete with timeout
async function waitForLoadingComplete(maxWaitMs = 5000) {
  const startTime = Date.now();
  while (isGoogleMapsLoading() && (Date.now() - startTime) < maxWaitMs) {
    console.log('[Scraper] Waiting for Google Maps to finish loading...');
    await new Promise(resolve => setTimeout(resolve, LOADING_WAIT_DELAY));
  }
}

// Get the scrollable results container
function getResultsContainer() {
  // Try multiple strategies to find the scrollable results panel

  // Strategy 1: Look for the scrollable container with role="feed"
  const feedElement = document.querySelector('div[role="feed"]');
  if (feedElement) {
    // Check if the feed itself is scrollable or if we need its parent
    if (feedElement.scrollHeight > feedElement.clientHeight) {
      console.log('[Scraper] Found scrollable feed element');
      return feedElement;
    }
    // Try the parent
    const parent = feedElement.parentElement;
    if (parent && parent.scrollHeight > parent.clientHeight) {
      console.log('[Scraper] Found scrollable feed parent');
      return parent;
    }
  }

  // Strategy 2: Find scrollable container by class (Google Maps specific)
  const scrollableSelectors = [
    'div.m6QErb.DxyBCb.kA9KIf.dS8AEf.XiKgde',
    'div.m6QErb.DxyBCb.kA9KIf.dS8AEf',
    'div.m6QErb.WNBkOb.XiKgde',
    'div.m6QErb.DxyBCb',
    'div.m6QErb'
  ];

  for (const selector of scrollableSelectors) {
    const elements = document.querySelectorAll(selector);
    for (const el of elements) {
      if (el.scrollHeight > el.clientHeight + 100) {
        console.log(`[Scraper] Found scrollable container: ${selector}`);
        return el;
      }
    }
  }

  // Strategy 3: Find the container holding article elements
  const articles = document.querySelectorAll('div[role="article"]');
  if (articles.length > 0) {
    let container = articles[0].parentElement;
    // Walk up to find the scrollable ancestor
    while (container && container !== document.body) {
      if (container.scrollHeight > container.clientHeight + 100) {
        console.log('[Scraper] Found scrollable ancestor of articles');
        return container;
      }
      container = container.parentElement;
    }
  }

  console.warn('[Scraper] Could not find scrollable results container');
  return null;
}

// Extract data from a single business listing element
function extractBusinessData(element) {
  const data = {
    name: null,
    rating: null,
    reviewCount: null,
    category: null,
    address: null,
    phone: null,
    website: null,
    googleMapsUrl: null
  };

  try {
    // Get the link element which contains the Google Maps URL
    const linkElement = element.querySelector('a[href*="/maps/place/"]');
    if (linkElement) {
      data.googleMapsUrl = linkElement.href;

      // Business name is often in the aria-label of the link or in a heading
      const ariaLabel = linkElement.getAttribute('aria-label');
      if (ariaLabel) {
        data.name = ariaLabel;
      }
    }

    // Try to get name from other sources if not found
    if (!data.name) {
      // Look for heading elements or specific class patterns
      const nameElement = element.querySelector('div.fontHeadlineSmall') ||
                          element.querySelector('div.qBF1Pd') ||
                          element.querySelector('h3') ||
                          element.querySelector('[class*="fontHeadline"]');
      if (nameElement) {
        data.name = nameElement.textContent.trim();
      }
    }

    // Extract rating
    const ratingElement = element.querySelector('span[role="img"][aria-label*="star"]') ||
                          element.querySelector('span.MW4etd');
    if (ratingElement) {
      const ratingMatch = ratingElement.textContent.match(/[\d.]+/) ||
                          ratingElement.getAttribute('aria-label')?.match(/[\d.]+/);
      if (ratingMatch) {
        data.rating = parseFloat(ratingMatch[0]);
      }
    }

    // Extract review count
    const reviewElement = element.querySelector('span.UY7F9');
    if (reviewElement) {
      const reviewMatch = reviewElement.textContent.match(/\(([\d,]+)\)/);
      if (reviewMatch) {
        data.reviewCount = parseInt(reviewMatch[1].replace(/,/g, ''));
      }
    } else {
      // Alternative: look in aria-label
      const ratingImg = element.querySelector('span[role="img"]');
      if (ratingImg) {
        const label = ratingImg.getAttribute('aria-label') || '';
        const reviewMatch = label.match(/([\d,]+)\s*review/i);
        if (reviewMatch) {
          data.reviewCount = parseInt(reviewMatch[1].replace(/,/g, ''));
        }
      }
    }

    // Extract category - it's typically the first text item after rating in the info section
    // Look for category in the first W4Efsd div that contains business type
    const infoElements = element.querySelectorAll('div.W4Efsd');

    // Patterns that indicate NOT a category
    const notCategoryPatterns = [
      /^\d/, // Starts with number (address, rating, hours)
      /^open\s/i, // Open hours
      /^closes?\s/i, // Closing time
      /reviews?$/i, // Review count
      /^\(/, // Parentheses (review count)
      /^·$/, // Separator
      /stars?$/i, // Star rating
      /\d+:\d+/, // Time
      /hours?$/i, // Hours
      /^\+/, // Phone number
      /^http/i, // URL
    ];

    // First pass: look for category (short business type descriptor)
    for (const el of infoElements) {
      const spans = el.querySelectorAll('span');
      for (const span of spans) {
        const text = span.textContent.trim();

        // Skip empty, separators, or matches skip patterns
        if (!text || text === '·' || text.length > 40) continue;
        if (notCategoryPatterns.some(p => p.test(text))) continue;

        // Category is typically a short word/phrase without numbers
        // e.g., "Plumber", "Restaurant", "Hair salon", "Coffee shop"
        if (text.length >= 3 && text.length <= 35 && !text.match(/\d/) && !text.includes(',')) {
          data.category = text;
          break;
        }
      }
      if (data.category) break;
    }

    // Second pass: look for address
    const textParts = [];
    infoElements.forEach(el => {
      const spans = el.querySelectorAll('span:not([role])');
      spans.forEach(span => {
        const text = span.textContent.trim();
        if (text && text !== '·' && text !== data.category) {
          textParts.push(text);
        }
      });
    });

    // Address usually contains street numbers or commas
    const possibleAddress = textParts.find(p =>
      (p.includes(',') || p.match(/^\d+\s+\w+/) || p.match(/\d+\/\d+/)) &&
      p.length > 10 &&
      !p.match(/^open\s/i) &&
      !p.match(/^\d+\.\d+/)
    );
    if (possibleAddress) {
      data.address = possibleAddress;
    }

    // Try alternative address selector
    if (!data.address) {
      const addressSpans = element.querySelectorAll('span.W4Efsd span');
      for (const span of addressSpans) {
        const text = span.textContent.trim();
        if (text.match(/\d+.*\w{2,}/) && text.length > 10) {
          data.address = text;
          break;
        }
      }
    }

    // Extract phone number
    const allText = element.textContent;
    const phoneMatch = allText.match(/(?:\+\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/);
    if (phoneMatch) {
      const phone = phoneMatch[0].trim();
      // Validate it looks like a phone number (not a year or other number)
      if (phone.length >= 8 && phone.match(/\d/g)?.length >= 7) {
        data.phone = phone;
      }
    }

    // Extract website - look for website button/link
    const websiteButton = element.querySelector('a[data-value="Website"]') ||
                          element.querySelector('a[aria-label*="website" i]');
    if (websiteButton) {
      data.website = websiteButton.href;
    }

  } catch (error) {
    console.warn('Error extracting business data:', error);
  }

  return data;
}

// Get all visible business listings
function getVisibleListings() {
  const articles = document.querySelectorAll('div[role="article"]');
  if (articles.length > 0) {
    return Array.from(articles);
  }

  // Fallback: look for listing containers with links
  const listings = document.querySelectorAll('div.Nv2PK');
  if (listings.length > 0) {
    return Array.from(listings);
  }

  // Another fallback
  const links = document.querySelectorAll('a[href*="/maps/place/"]');
  const parentElements = new Set();
  links.forEach(link => {
    const parent = link.closest('div[jsaction]');
    if (parent) {
      parentElements.add(parent);
    }
  });

  return Array.from(parentElements);
}

// Check if a business passes all active filters
function passesFilters(data) {
  if (!activeFilters) return true;

  // Minimum rating
  if (activeFilters.minRating > 0) {
    if (data.rating === null || data.rating < activeFilters.minRating) return false;
  }

  // Minimum review count
  if (activeFilters.minReviewCount > 0) {
    if (data.reviewCount === null || data.reviewCount < activeFilters.minReviewCount) return false;
  }

  // Must have website
  if (activeFilters.mustHaveWebsite && !data.website) return false;

  // Must have phone
  if (activeFilters.mustHavePhone && !data.phone) return false;

  // Category include keywords (OR logic: must match at least one)
  if (activeFilters.categoryInclude && activeFilters.categoryInclude.trim()) {
    const keywords = activeFilters.categoryInclude.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
    if (keywords.length > 0) {
      const category = (data.category || '').toLowerCase();
      if (!keywords.some(kw => category.includes(kw))) return false;
    }
  }

  // Category exclude keywords (OR logic: fails if matches any)
  if (activeFilters.categoryExclude && activeFilters.categoryExclude.trim()) {
    const keywords = activeFilters.categoryExclude.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
    if (keywords.length > 0) {
      const category = (data.category || '').toLowerCase();
      if (keywords.some(kw => category.includes(kw))) return false;
    }
  }

  return true;
}

// Scrape currently visible results
function scrapeVisibleResults() {
  const listings = getVisibleListings();
  let newCount = 0;
  let duplicatesThisRound = 0;
  let filteredThisRound = 0;

  console.log(`[Scraper] Found ${listings.length} listing elements on page`);

  listings.forEach(listing => {
    const data = extractBusinessData(listing);

    // Skip if no name or we've already seen this URL
    if (!data.name) {
      console.log('[Scraper] Skipping listing - no name found');
      return;
    }

    const identifier = data.googleMapsUrl || data.name;

    // Check if already seen in this session
    if (seenUrls.has(identifier)) return;

    // Check if in URL history (duplicate from previous scrapes)
    if (urlHistory.has(identifier)) {
      duplicatesThisRound++;
      totalDuplicatesSkipped++;
      console.log(`[Scraper] Skipping duplicate: ${data.name}`);
      seenUrls.add(identifier); // Mark as seen so we don't count it multiple times
      return;
    }

    seenUrls.add(identifier);

    // Apply pre-scrape filters
    if (!passesFilters(data)) {
      filteredThisRound++;
      totalFilteredOut++;
      console.log(`[Scraper] Filtered out: ${data.name} (rating: ${data.rating}, reviews: ${data.reviewCount}, category: ${data.category})`);
      return;
    }

    scrapedData.push(data);
    newCount++;
    console.log(`[Scraper] Added: ${data.name}`);
  });

  console.log(`[Scraper] New items this round: ${newCount}, Filtered: ${filteredThisRound}, Duplicates: ${duplicatesThisRound}, Total: ${scrapedData.length}`);
  return { newCount, filteredThisRound };
}

// Check if we've reached the end of results (Google shows "You've reached the end of the list")
function hasReachedEndOfResults() {
  // Look for "end of list" message
  const endMessages = [
    "You've reached the end of the list",
    "No more results",
    "End of results"
  ];

  const allText = document.body.innerText;
  for (const msg of endMessages) {
    if (allText.includes(msg)) {
      console.log('[Scraper] Detected end of results message');
      return true;
    }
  }

  // Also check for the specific element Google uses
  const endElement = document.querySelector('span.HlvSq');
  if (endElement && endElement.textContent.toLowerCase().includes('end')) {
    return true;
  }

  return false;
}

// Scroll the results panel to load more
async function scrollResults() {
  const container = getResultsContainer();
  if (!container) {
    console.warn('[Scraper] Could not find results container to scroll');
    return false;
  }

  // Check if we've reached the end
  if (hasReachedEndOfResults()) {
    console.log('[Scraper] Reached end of results');
    return false;
  }

  const previousScrollTop = container.scrollTop;
  const previousScrollHeight = container.scrollHeight;
  const previousListingCount = getVisibleListings().length;

  // Scroll down by a large amount
  container.scrollBy(0, 1000);

  // Also try scrolling to bottom
  await new Promise(resolve => setTimeout(resolve, 300));
  container.scrollTop = container.scrollHeight;

  console.log(`[Scraper] Scrolling... scrollTop: ${previousScrollTop} -> ${container.scrollTop}, scrollHeight: ${previousScrollHeight} -> ${container.scrollHeight}`);

  // Wait for new content to potentially load
  await new Promise(resolve => setTimeout(resolve, SCROLL_DELAY));

  // Wait for any loading to complete
  await waitForLoadingComplete(5000);

  // Check if scroll height increased (new content loaded) or if we scrolled
  const heightIncreased = container.scrollHeight > previousScrollHeight;
  const didScroll = container.scrollTop > previousScrollTop;
  const newListingCount = getVisibleListings().length;
  const moreListingsLoaded = newListingCount > previousListingCount;

  // Also check if we're not at the absolute bottom (might have more to load)
  const canScrollMore = container.scrollTop + container.clientHeight < container.scrollHeight - 10;

  // Check if still loading (give it another chance)
  const stillLoading = isGoogleMapsLoading();

  console.log(`[Scraper] After scroll - heightIncreased: ${heightIncreased}, didScroll: ${didScroll}, canScrollMore: ${canScrollMore}, moreListings: ${moreListingsLoaded}, stillLoading: ${stillLoading}`);

  return didScroll || heightIncreased || canScrollMore || moreListingsLoaded || stillLoading;
}

// Main scraping function
async function startScraping(filters) {
  if (!isOnSearchResults()) {
    sendError('Please navigate to Google Maps search results first');
    return;
  }

  const container = getResultsContainer();
  if (!container) {
    sendError('Could not find the results panel. Make sure you have search results visible.');
    return;
  }

  isScrapin = true;
  scrapedData = [];
  seenUrls.clear();
  totalDuplicatesSkipped = 0;
  activeFilters = filters || null;
  totalFilteredOut = 0;

  if (activeFilters) {
    console.log('[Scraper] Active filters:', JSON.stringify(activeFilters));
  }

  let noNewResultsCount = 0;
  let consecutiveNoScrollCount = 0;

  while (isScrapin && scrapedData.length < MAX_RESULTS) {
    // Scrape visible results
    const result = scrapeVisibleResults();
    const newItems = result.newCount;
    const hadActivity = result.newCount > 0 || result.filteredThisRound > 0;

    // Send progress update
    sendProgress(scrapedData.length);

    if (!hadActivity) {
      noNewResultsCount++;
      console.log(`[Scraper] No new items found (attempt ${noNewResultsCount}/${MAX_NO_NEW_RESULTS})`);

      // Check if we've definitively reached the end
      if (hasReachedEndOfResults()) {
        console.log('[Scraper] Stopping: Reached end of results');
        break;
      }

      if (noNewResultsCount >= MAX_NO_NEW_RESULTS) {
        console.log('[Scraper] Stopping: No new results found after multiple scrolls');
        break;
      }
    } else {
      noNewResultsCount = 0;
      consecutiveNoScrollCount = 0;
    }

    // Try to scroll for more results
    const canContinue = await scrollResults();

    if (!canContinue) {
      consecutiveNoScrollCount++;
      console.log(`[Scraper] Cannot scroll (attempt ${consecutiveNoScrollCount})`);

      // If we can't scroll but Google might still be loading, wait longer
      if (isGoogleMapsLoading()) {
        console.log('[Scraper] Google Maps still loading, waiting...');
        await waitForLoadingComplete(8000);
        continue;
      }

      if (consecutiveNoScrollCount >= 3 && noNewResultsCount >= 3) {
        console.log('[Scraper] Stopping: Cannot scroll further and no new results after retries');
        break;
      }
    } else {
      consecutiveNoScrollCount = 0;
    }
  }

  console.log(`[Scraper] Finished with ${scrapedData.length} total results`);

  isScrapin = false;
  sendComplete();
}

// Stop scraping
function stopScraping() {
  isScrapin = false;
}

// Send progress message to popup
function sendProgress(count) {
  chrome.runtime.sendMessage({
    type: 'progress',
    count: count,
    duplicatesSkipped: totalDuplicatesSkipped,
    filteredOut: totalFilteredOut,
    data: scrapedData
  }).catch(() => {
    // Popup might be closed, ignore error
  });
}

// Send completion message to popup
async function sendComplete() {
  // Persist new URLs to history
  try {
    const newUrls = scrapedData
      .map(d => d.googleMapsUrl || d.name)
      .filter(Boolean);

    // Get current history and merge with new URLs
    const result = await chrome.storage.local.get(['scrapedUrlHistory']);
    const existingHistory = result.scrapedUrlHistory || [];
    const updatedHistory = [...new Set([...existingHistory, ...newUrls])];

    // Keep max 5000 URLs in history to avoid storage bloat
    const trimmedHistory = updatedHistory.slice(-5000);

    await chrome.storage.local.set({ scrapedUrlHistory: trimmedHistory });

    // Update local cache
    urlHistory = new Set(trimmedHistory);
    console.log(`[Scraper] Saved ${newUrls.length} new URLs to history. Total: ${trimmedHistory.length}`);
  } catch (error) {
    console.warn('[Scraper] Error saving URL history:', error);
  }

  chrome.runtime.sendMessage({
    type: 'complete',
    data: scrapedData,
    duplicatesSkipped: totalDuplicatesSkipped,
    filteredOut: totalFilteredOut
  }).catch(() => {
    // Popup might be closed, ignore error
  });
}

// Send error message to popup
function sendError(message) {
  chrome.runtime.sendMessage({
    type: 'error',
    message: message
  }).catch(() => {
    // Popup might be closed, ignore error
  });
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startScraping') {
    startScraping(message.filters);
    sendResponse({ status: 'started' });
  } else if (message.action === 'stopScraping') {
    stopScraping();
    sendResponse({ status: 'stopped', data: scrapedData });
  } else if (message.action === 'getStatus') {
    sendResponse({
      isScrapin: isScrapin,
      data: scrapedData,
      count: scrapedData.length
    });
  }
  return true;
});

// Log that content script is loaded
console.log('Google Maps Lead Scraper content script loaded');
