// Google Maps Lead Scraper - Background Service Worker
// Phase 2: Email extraction from business websites

// ============================================
// License & Trial Management
// ============================================

const TRIAL_SCRAPES = 3;
const GUMROAD_PRODUCT_ID = 'iejae'; // Gumroad product ID for Maps Lead Scraper

// License status object structure
// {
//   status: 'trial' | 'active' | 'expired' | 'invalid',
//   tier: null | 'standard' | 'pro',
//   trialScrapesRemaining: number,
//   licenseKey: string | null,
//   validatedAt: number | null,
//   email: string | null
// }

// Initialize license state for new installations
async function initializeLicenseState() {
  const result = await chrome.storage.local.get(['licenseStatus']);
  if (!result.licenseStatus) {
    const initialState = {
      status: 'trial',
      tier: null,
      trialScrapesRemaining: TRIAL_SCRAPES,
      licenseKey: null,
      validatedAt: null,
      email: null
    };
    await chrome.storage.local.set({ licenseStatus: initialState });
    return initialState;
  }
  return result.licenseStatus;
}

// Get current license status
async function getLicenseStatus() {
  const result = await chrome.storage.local.get(['licenseStatus']);
  if (!result.licenseStatus) {
    return await initializeLicenseState();
  }
  return result.licenseStatus;
}

// Validate license key with Gumroad API
async function validateLicenseKey(licenseKey) {
  try {
    const response = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        product_id: GUMROAD_PRODUCT_ID,
        license_key: licenseKey,
        increment_uses_count: 'false' // Don't increment on validation check
      })
    });

    const data = await response.json();

    if (!data.success) {
      return {
        valid: false,
        error: data.message || 'Invalid license key'
      };
    }

    // Check if refunded
    if (data.purchase && data.purchase.refunded) {
      return {
        valid: false,
        error: 'This license has been refunded'
      };
    }

    // Check if chargebacked
    if (data.purchase && data.purchase.chargebacked) {
      return {
        valid: false,
        error: 'This license has been chargebacked'
      };
    }

    // Determine tier from variant name or use 'standard' as default
    // Gumroad returns variant info in purchase.variants if product has variants
    let tier = 'standard';
    if (data.purchase) {
      const variantName = data.purchase.variant_name || data.purchase.variants || '';
      if (typeof variantName === 'string' && variantName.toLowerCase().includes('pro')) {
        tier = 'pro';
      }
    }

    return {
      valid: true,
      tier: tier,
      email: data.purchase?.email || null,
      purchaseDate: data.purchase?.created_at || null,
      uses: data.uses || 0
    };
  } catch (error) {
    console.error('[License] Validation error:', error);
    return {
      valid: false,
      error: 'Network error. Please check your connection and try again.'
    };
  }
}

// Activate a license key
async function activateLicenseKey(licenseKey) {
  const validation = await validateLicenseKey(licenseKey);

  if (!validation.valid) {
    return {
      success: false,
      error: validation.error
    };
  }

  // Update license status
  const licenseStatus = {
    status: 'active',
    tier: validation.tier,
    trialScrapesRemaining: 0,
    licenseKey: licenseKey,
    validatedAt: Date.now(),
    email: validation.email
  };

  await chrome.storage.local.set({ licenseStatus });

  return {
    success: true,
    tier: validation.tier,
    email: validation.email
  };
}

// Decrement trial scrape count
async function decrementTrialScrape() {
  const status = await getLicenseStatus();

  if (status.status !== 'trial') {
    return { allowed: true, remaining: null };
  }

  if (status.trialScrapesRemaining <= 0) {
    return { allowed: false, remaining: 0 };
  }

  const newRemaining = status.trialScrapesRemaining - 1;
  const newStatus = {
    ...status,
    trialScrapesRemaining: newRemaining,
    status: newRemaining <= 0 ? 'expired' : 'trial'
  };

  await chrome.storage.local.set({ licenseStatus: newStatus });

  return { allowed: true, remaining: newRemaining };
}

// Check if user can scrape
async function canScrape() {
  const status = await getLicenseStatus();

  if (status.status === 'active') {
    return { allowed: true, reason: null };
  }

  if (status.status === 'trial' && status.trialScrapesRemaining > 0) {
    return { allowed: true, reason: null };
  }

  return {
    allowed: false,
    reason: status.status === 'expired'
      ? 'Your trial has ended. Purchase a license to continue.'
      : 'License is not valid. Please enter a valid license key.'
  };
}

// Check if user can export to Google Sheets (Pro tier only)
async function canExportToSheets() {
  const status = await getLicenseStatus();

  // Trial users get full access (including Sheets) during trial
  if (status.status === 'trial' && status.trialScrapesRemaining > 0) {
    return { allowed: true, reason: null };
  }

  // Active Pro users can export
  if (status.status === 'active' && status.tier === 'pro') {
    return { allowed: true, reason: null };
  }

  // Active Standard users cannot
  if (status.status === 'active' && status.tier === 'standard') {
    return {
      allowed: false,
      reason: 'Google Sheets export is a Pro feature. Upgrade to Pro to unlock.'
    };
  }

  return {
    allowed: false,
    reason: 'Please purchase a license to use this feature.'
  };
}

// Email extraction regex patterns
const EMAIL_PATTERNS = [
  // Standard email pattern
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  // mailto: links
  /mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi
];

// Common false positive patterns to filter out
const FALSE_POSITIVE_PATTERNS = [
  // Generic placeholder domains
  /example\.com$/i,
  /test\.com$/i,
  /domain\.com$/i,
  /domainname\.com$/i,
  /email\.com$/i,
  /yoursite\.com$/i,
  /mysite\.com$/i,
  /website\.com$/i,
  /company\.com$/i,
  /yourdomain\.com$/i,
  /yourcompany\.com$/i,
  /samplesite\.com$/i,
  /placeholder\.com$/i,
  // Template/developer leftovers
  /latofonts\.com$/i,
  /impallari@/i,
  /wordpress.*@/i,
  /developer.*@/i,
  /admin@admin\./i,
  /user@user\./i,
  /info@info\./i,
  // Tech service domains
  /sentry\.io$/i,
  /wixpress\.com$/i,
  /wix\.com$/i,
  /squarespace\.com$/i,
  /godaddy\.com$/i,
  /w3\.org$/i,
  /schema\.org$/i,
  /googleapis\.com$/i,
  /google\.com$/i,
  /gstatic\.com$/i,
  /cloudflare\.com$/i,
  /jsdelivr\.net$/i,
  /bootstrapcdn\.com$/i,
  // Image file extensions (malformed emails)
  /2x\.png$/i,
  /\.jpg$/i,
  /\.jpeg$/i,
  /\.png$/i,
  /\.gif$/i,
  /\.webp$/i,
  /\.svg$/i,
  // Generic placeholder usernames
  /^john@(?!.*business)/i,
  /^jane@(?!.*business)/i,
  /^test@/i,
  /^demo@/i,
  /^sample@/i,
  /^example@/i,
  /^your-?email@/i,
  /^email@/i,
  /^name@/i,
  /^some@/i
];

// Contact page patterns to look for in links
const CONTACT_PAGE_PATTERNS = [
  /contact/i,
  /kontakt/i,
  /about-us/i,
  /about/i,
  /get-in-touch/i,
  /reach-us/i,
  /enquiry/i,
  /enquiries/i,
  /support/i
];

// Send browser notification
async function sendNotification(title, message) {
  try {
    // Check if notifications are enabled
    const result = await chrome.storage.local.get(['notificationsEnabled']);
    if (result.notificationsEnabled === false) {
      return; // User disabled notifications
    }

    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: title,
      message: message,
      priority: 2
    });
  } catch (error) {
    console.warn('[Notifications] Error sending notification:', error);
  }
}

// Handle extension installation
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('Google Maps Lead Scraper installed');

    // Initialize license state for new users
    await initializeLicenseState();

    await chrome.storage.local.set({
      scrapedData: [],
      isScrapin: false,
      isExtractingEmails: false,
      settings: {
        maxResults: 500,
        scrollDelay: 2000,
        emailFetchDelay: 1000
      }
    });
  } else if (details.reason === 'update') {
    console.log('Google Maps Lead Scraper updated to version', chrome.runtime.getManifest().version);
    // Initialize license state if not present (for users updating from older version)
    await initializeLicenseState();
  }
});

// Extract emails from HTML content
function extractEmailsFromHTML(html) {
  const emails = new Set();

  for (const pattern of EMAIL_PATTERNS) {
    const matches = html.match(pattern) || [];
    for (let match of matches) {
      // Remove mailto: prefix if present and decode URL encoding
      try {
        match = decodeURIComponent(match);
      } catch (e) {
        // Invalid encoding, use as-is
      }
      match = match.replace(/^mailto:/i, '').trim().toLowerCase();

      // Skip if matches false positive patterns
      let isFalsePositive = false;
      for (const fpPattern of FALSE_POSITIVE_PATTERNS) {
        if (fpPattern.test(match)) {
          isFalsePositive = true;
          break;
        }
      }

      if (!isFalsePositive && match.includes('@') && match.includes('.')) {
        emails.add(match);
      }
    }
  }

  return Array.from(emails);
}

// Find contact page URLs in HTML
function findContactPageUrls(html, baseUrl) {
  const contactUrls = new Set();

  try {
    // Parse base URL
    const base = new URL(baseUrl);
    const baseOrigin = base.origin;

    // Find all links in the HTML
    const linkPattern = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi;
    let match;

    while ((match = linkPattern.exec(html)) !== null) {
      const href = match[1];
      const linkText = match[2];

      // Check if link text or href contains contact-related keywords
      const isContactLink = CONTACT_PAGE_PATTERNS.some(pattern =>
        pattern.test(href) || pattern.test(linkText)
      );

      if (isContactLink) {
        try {
          let fullUrl;

          if (href.startsWith('http://') || href.startsWith('https://')) {
            // Absolute URL - only include if same domain
            const linkUrl = new URL(href);
            if (linkUrl.origin === baseOrigin) {
              fullUrl = href;
            }
          } else if (href.startsWith('/')) {
            // Root-relative URL
            fullUrl = baseOrigin + href;
          } else if (!href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
            // Relative URL
            fullUrl = baseOrigin + '/' + href;
          }

          if (fullUrl && fullUrl !== baseUrl) {
            contactUrls.add(fullUrl);
          }
        } catch (e) {
          // Invalid URL, skip
        }
      }
    }

    // Also look for nav links with contact patterns in href attribute
    const navLinkPattern = /href=["']([^"']*(?:contact|kontakt|about|enquir|support)[^"']*)["']/gi;
    while ((match = navLinkPattern.exec(html)) !== null) {
      const href = match[1];
      try {
        let fullUrl;
        if (href.startsWith('http://') || href.startsWith('https://')) {
          const linkUrl = new URL(href);
          if (linkUrl.origin === baseOrigin) {
            fullUrl = href;
          }
        } else if (href.startsWith('/')) {
          fullUrl = baseOrigin + href;
        } else if (!href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
          fullUrl = baseOrigin + '/' + href;
        }

        if (fullUrl && fullUrl !== baseUrl) {
          contactUrls.add(fullUrl);
        }
      } catch (e) {
        // Invalid URL, skip
      }
    }
  } catch (e) {
    console.warn('[Email Extractor] Error parsing URLs:', e.message);
  }

  return Array.from(contactUrls).slice(0, 3); // Limit to 3 contact pages max
}

// Fetch a single page
async function fetchPage(url) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { success: false, html: '', error: `HTTP ${response.status}` };
    }

    const html = await response.text();
    return { success: true, html, error: null };
  } catch (error) {
    return { success: false, html: '', error: error.message };
  }
}

// Fetch a website and extract emails (including contact pages)
async function fetchAndExtractEmails(url) {
  if (!url || url === 'null' || url === 'undefined') {
    return { success: false, emails: [], error: 'No URL provided', pagesScanned: 0 };
  }

  try {
    // Ensure URL has protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    console.log(`[Email Extractor] Fetching homepage: ${url}`);

    const allEmails = new Set();
    let pagesScanned = 0;

    // Fetch homepage
    const homeResult = await fetchPage(url);

    if (!homeResult.success) {
      return { success: false, emails: [], error: homeResult.error, pagesScanned: 0 };
    }

    pagesScanned++;

    // Extract emails from homepage
    const homeEmails = extractEmailsFromHTML(homeResult.html);
    homeEmails.forEach(email => allEmails.add(email));

    console.log(`[Email Extractor] Found ${homeEmails.length} emails on homepage`);

    // Find contact pages
    const contactUrls = findContactPageUrls(homeResult.html, url);
    console.log(`[Email Extractor] Found ${contactUrls.length} potential contact pages`);

    // Fetch contact pages
    for (const contactUrl of contactUrls) {
      console.log(`[Email Extractor] Fetching contact page: ${contactUrl}`);

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));

      const contactResult = await fetchPage(contactUrl);

      if (contactResult.success) {
        pagesScanned++;
        const contactEmails = extractEmailsFromHTML(contactResult.html);
        contactEmails.forEach(email => allEmails.add(email));
        console.log(`[Email Extractor] Found ${contactEmails.length} emails on ${contactUrl}`);
      }
    }

    const emails = Array.from(allEmails);
    console.log(`[Email Extractor] Total: ${emails.length} unique emails from ${pagesScanned} pages for ${url}`);

    return { success: true, emails, error: null, pagesScanned };
  } catch (error) {
    console.warn(`[Email Extractor] Error fetching ${url}:`, error.message);
    return { success: false, emails: [], error: error.message, pagesScanned: 0 };
  }
}

// Process multiple businesses for email extraction
async function extractEmailsFromBusinesses(businesses, sendProgress) {
  const results = [];
  const delay = 500; // Reduced delay since we have delays within fetchAndExtractEmails

  for (let i = 0; i < businesses.length; i++) {
    const business = businesses[i];

    const progressData = {
      current: i + 1,
      total: businesses.length,
      businessName: business.name
    };

    // Persist progress to storage so popup can restore it
    await chrome.storage.local.set({
      emailExtractionProgress: progressData,
      isExtractingEmails: true
    });

    // Send progress update via message (if popup is open)
    if (sendProgress) {
      sendProgress(progressData);
    }

    if (business.website) {
      const result = await fetchAndExtractEmails(business.website);
      results.push({
        ...business,
        emails: result.emails,
        emailError: result.error,
        pagesScanned: result.pagesScanned
      });
    } else {
      results.push({
        ...business,
        emails: [],
        emailError: 'No website',
        pagesScanned: 0
      });
    }

    // Delay between businesses (except for last one)
    if (i < businesses.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return results;
}

// ============================================
// Google Sheets Export Functions
// ============================================

// Get OAuth token for Google Sheets API
async function getAuthToken() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message || 'Failed to get auth token'));
      } else if (token) {
        resolve(token);
      } else {
        reject(new Error('No token received'));
      }
    });
  });
}

// Escape double quotes for use in Sheets HYPERLINK formula
function escapeForHyperlink(str) {
  if (!str) return '';
  // Escape double quotes by doubling them
  return str.replace(/"/g, '""');
}

// Convert data to rows for Google Sheets
function dataToRows(data, exportFields) {
  const hasEmails = data.some(row => row.emails && row.emails.length > 0);

  // Build headers based on selected fields
  const allFields = hasEmails
    ? ['name', 'email', 'rating', 'reviewCount', 'category', 'address', 'phone', 'website', 'googleMapsUrl']
    : ['name', 'rating', 'reviewCount', 'category', 'address', 'phone', 'website', 'googleMapsUrl'];

  const headers = allFields.filter(field => {
    if (field === 'name') return true;
    return exportFields[field] !== false;
  });

  // Build data rows
  const rows = data.map(row => {
    const email = row.emails && row.emails.length > 0 ? row.emails.join('; ') : '';
    return headers.map(header => {
      if (header === 'email') return email;
      // Format googleMapsUrl as a clickable hyperlink with business name
      if (header === 'googleMapsUrl') {
        const url = row.googleMapsUrl || '';
        const name = row.name || 'View on Maps';
        if (url) {
          return `=HYPERLINK("${escapeForHyperlink(url)}", "${escapeForHyperlink(name)}")`;
        }
        return '';
      }
      // Prefix phone with single quote to prevent formula interpretation
      if (header === 'phone') {
        const phone = row.phone || '';
        return phone ? `'${phone}` : '';
      }
      return row[header] || '';
    });
  });

  // Return header row + data rows
  return [headers, ...rows];
}

// Create a new Google Spreadsheet
async function createSpreadsheet(token, title, rows) {
  // Create the spreadsheet
  const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        title: title
      },
      sheets: [{
        properties: {
          title: 'Leads'
        }
      }]
    })
  });

  if (!createResponse.ok) {
    const error = await createResponse.text();
    throw new Error(`Failed to create spreadsheet: ${error}`);
  }

  const spreadsheet = await createResponse.json();
  const spreadsheetId = spreadsheet.spreadsheetId;

  // Add data to the spreadsheet (USER_ENTERED allows formulas like HYPERLINK to work)
  const updateResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Leads!A1:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: rows
      })
    }
  );

  if (!updateResponse.ok) {
    const error = await updateResponse.text();
    throw new Error(`Failed to add data: ${error}`);
  }

  return {
    spreadsheetId,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
  };
}

// Append data to an existing spreadsheet
async function appendToSpreadsheet(token, spreadsheetId, rows) {
  // Skip header row when appending
  const dataRows = rows.slice(1);

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Leads!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: dataRows
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to append data: ${error}`);
  }

  return {
    spreadsheetId,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
  };
}

// Main export function
async function exportToGoogleSheets(data, exportFields, option, searchQuery) {
  try {
    console.log('[Sheets Export] Starting export...');

    // Get OAuth token
    const token = await getAuthToken();
    console.log('[Sheets Export] Got auth token');

    // Convert data to rows
    const rows = dataToRows(data, exportFields);
    console.log(`[Sheets Export] Prepared ${rows.length} rows`);

    let result;
    const timestamp = new Date().toLocaleString();

    if (option === 'append') {
      // Get last sheet ID from storage
      const storage = await chrome.storage.local.get(['lastSheetId']);
      if (!storage.lastSheetId) {
        throw new Error('No previous spreadsheet found');
      }
      result = await appendToSpreadsheet(token, storage.lastSheetId, rows);
      console.log('[Sheets Export] Appended to existing spreadsheet');
    } else {
      // Create new spreadsheet with search query in title
      const queryPart = searchQuery && searchQuery !== 'Unknown search' ? `"${searchQuery}" ` : '';
      const title = `Google Maps Leads ${queryPart}- ${timestamp}`;
      result = await createSpreadsheet(token, title, rows);

      // Save sheet ID for future appends
      await chrome.storage.local.set({ lastSheetId: result.spreadsheetId });
      console.log('[Sheets Export] Created new spreadsheet');
    }

    // Send notification
    await sendNotification(
      'Export Complete',
      `${data.length} leads exported to Google Sheets`
    );

    return {
      success: true,
      spreadsheetId: result.spreadsheetId,
      spreadsheetUrl: result.spreadsheetUrl
    };
  } catch (error) {
    console.error('[Sheets Export] Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'extractEmails') {
    // Handle email extraction request
    const businesses = message.businesses || [];

    console.log(`[Email Extractor] Starting extraction for ${businesses.length} businesses`);

    // Process asynchronously
    (async () => {
      const results = await extractEmailsFromBusinesses(businesses, (progress) => {
        // Send progress updates to popup
        chrome.runtime.sendMessage({
          type: 'emailProgress',
          ...progress
        }).catch(() => {
          // Popup might be closed
        });
      });

      // Send completion message
      chrome.runtime.sendMessage({
        type: 'emailComplete',
        data: results
      }).catch(() => {
        // Popup might be closed
      });

      // Count businesses with emails found
      const emailsFound = results.filter(b => b.emails && b.emails.length > 0).length;

      // Send browser notification
      await sendNotification(
        'Email Extraction Complete',
        `Found emails for ${emailsFound} of ${results.length} businesses`
      );

      // Store results and clear progress state
      chrome.storage.local.set({
        scrapedDataWithEmails: results,
        isExtractingEmails: false,
        emailExtractionProgress: null
      });

      sendResponse({ status: 'started', count: businesses.length });
    })();

    return true; // Keep channel open for async response
  }

  if (message.action === 'fetchSingleEmail') {
    // Fetch email for a single website
    fetchAndExtractEmails(message.url).then(result => {
      sendResponse(result);
    });
    return true;
  }

  if (message.type === 'log') {
    console.log('[Content Script]:', message.data);
  }

  // Handle scraping complete - send notification from service worker
  // This ensures notification fires even if popup is closed
  if (message.type === 'complete') {
    (async () => {
      try {
        const result = await chrome.storage.local.get(['notificationsEnabled', 'autoExtractEmails']);
        const notificationsEnabled = result.notificationsEnabled !== false; // default true
        const autoExtractEmails = result.autoExtractEmails !== false; // default true
        const leadsCount = message.data ? message.data.length : 0;
        const hasWebsites = message.data ? message.data.some(b => b.website) : false;

        // Only send notification if auto-extract is OFF or no websites to extract from
        // (if auto-extract is ON, the email extraction completion will send its own notification)
        if (notificationsEnabled && (!autoExtractEmails || !hasWebsites)) {
          await sendNotification(
            'Scraping Complete',
            `Found ${leadsCount} leads${!hasWebsites ? ' (no websites for email extraction)' : ' - ready to export'}`
          );
        }
      } catch (error) {
        console.warn('[Service Worker] Error sending scraping complete notification:', error);
      }
    })();
  }

  if (message.action === 'showNotification') {
    sendNotification(message.title, message.message);
    sendResponse({ status: 'sent' });
    return true;
  }

  if (message.action === 'exportToSheets') {
    // Check if user can export to Sheets (Pro feature)
    (async () => {
      const sheetsAccess = await canExportToSheets();
      if (!sheetsAccess.allowed) {
        sendResponse({ success: false, error: sheetsAccess.reason, proRequired: true });
        return;
      }

      const result = await exportToGoogleSheets(message.data, message.exportFields, message.option, message.searchQuery);
      sendResponse(result);
    })();
    return true;
  }

  // License management actions
  if (message.action === 'getLicenseStatus') {
    getLicenseStatus().then(status => sendResponse(status));
    return true;
  }

  if (message.action === 'activateLicense') {
    activateLicenseKey(message.licenseKey).then(result => sendResponse(result));
    return true;
  }

  if (message.action === 'canScrape') {
    canScrape().then(result => sendResponse(result));
    return true;
  }

  if (message.action === 'decrementTrial') {
    decrementTrialScrape().then(result => sendResponse(result));
    return true;
  }

  if (message.action === 'canExportToSheets') {
    canExportToSheets().then(result => sendResponse(result));
    return true;
  }

  return true;
});

// Handle extension icon click when popup is not shown
chrome.action.onClicked.addListener((tab) => {
  if (tab.url && tab.url.includes('google.com/maps')) {
    chrome.tabs.sendMessage(tab.id, { action: 'getStatus' });
  }
});

console.log('Google Maps Lead Scraper service worker started (Phase 2 - with contact page scanning)');
