// DOM Elements
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const leadCount = document.getElementById('leadCount');
const startStopBtn = document.getElementById('startStopBtn');
const extractEmailsBtn = document.getElementById('extractEmailsBtn');
const exportBtn = document.getElementById('exportBtn');
const errorMessage = document.getElementById('errorMessage');
const emailSection = document.getElementById('emailSection');
const emailStatus = document.getElementById('emailStatus');
const emailCount = document.getElementById('emailCount');
const progressFill = document.getElementById('progressFill');
const currentBusiness = document.getElementById('currentBusiness');
const autoExtractCheckbox = document.getElementById('autoExtractCheckbox');
const duplicateStatus = document.getElementById('duplicateStatus');
const duplicateCount = document.getElementById('duplicateCount');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const historyCountSpan = document.getElementById('historyCount');
const historyHeader = document.getElementById('historyHeader');
const historyToggle = document.getElementById('historyToggle');
const historyList = document.getElementById('historyList');
const clearSearchHistoryBtn = document.getElementById('clearSearchHistoryBtn');
const toggleFieldsBtn = document.getElementById('toggleFieldsBtn');
const fieldsSection = document.getElementById('fieldsSection');
const fieldCheckboxes = document.querySelectorAll('.field-checkbox input[type="checkbox"]');
const notificationsCheckbox = document.getElementById('notificationsCheckbox');
const socialSearchCheckbox = document.getElementById('socialSearchCheckbox');
const exportSheetsBtn = document.getElementById('exportSheetsBtn');
const sheetsModal = document.getElementById('sheetsModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelSheetsBtn = document.getElementById('cancelSheetsBtn');
const confirmSheetsBtn = document.getElementById('confirmSheetsBtn');
const appendOption = document.getElementById('appendOption');
const sheetsStatus = document.getElementById('sheetsStatus');
const sheetsStatusText = document.getElementById('sheetsStatusText');
const clearResultsBtn = document.getElementById('clearResultsBtn');

// Trial/License DOM Elements
const trialBanner = document.getElementById('trialBanner');
const trialCount = document.getElementById('trialCount');
const upgradeFromBanner = document.getElementById('upgradeFromBanner');
const licenseBadge = document.getElementById('licenseBadge');
const badgeTier = document.getElementById('badgeTier');
const trialEndedSection = document.getElementById('trialEndedSection');
const statusSection = document.getElementById('statusSection');
const licenseKeyInput = document.getElementById('licenseKeyInput');
const activateLicenseBtn = document.getElementById('activateLicenseBtn');
const licenseError = document.getElementById('licenseError');
const enterLicenseBtn = document.getElementById('enterLicenseBtn');
const licenseModal = document.getElementById('licenseModal');
const closeLicenseModalBtn = document.getElementById('closeLicenseModalBtn');
const modalLicenseInput = document.getElementById('modalLicenseInput');
const modalLicenseError = document.getElementById('modalLicenseError');
const cancelLicenseBtn = document.getElementById('cancelLicenseBtn');
const confirmLicenseBtn = document.getElementById('confirmLicenseBtn');

// State
let isScrapin = false;
let isExtractingEmails = false;
let scrapedData = [];
let scrapedDataWithEmails = [];
let autoExtractEmails = true;
let currentDuplicatesSkipped = 0;
let notificationsEnabled = true;
let socialSearchEnabled = false; // Off by default due to speed tradeoff
let exportFields = {
  name: true,      // Always required
  email: true,
  rating: true,
  reviewCount: true,
  category: true,
  address: true,
  phone: true,
  website: true,
  // v2.1: New fields
  contactPageUrl: true,
  facebookUrl: true,
  instagramUrl: true,
  linkedinUrl: true,
  twitterUrl: true,
  googleMapsUrl: true
};

// License State
let licenseStatus = {
  status: 'trial',
  tier: null,
  trialScrapesRemaining: 3,
  licenseKey: null,
  validatedAt: null,
  email: null
};

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  await loadLicenseStatus();
  await loadStoredData();
  await checkCurrentTabStatus();
});

// Load license status from background
async function loadLicenseStatus() {
  try {
    const status = await chrome.runtime.sendMessage({ action: 'getLicenseStatus' });
    if (status) {
      licenseStatus = status;
      updateLicenseUI();
    }
  } catch (error) {
    console.error('Error loading license status:', error);
  }
}

// Update UI based on license status
function updateLicenseUI() {
  // Hide all license-related sections first
  trialBanner.style.display = 'none';
  licenseBadge.style.display = 'none';
  trialEndedSection.style.display = 'none';
  statusSection.style.display = 'block';

  if (licenseStatus.status === 'active') {
    // Licensed user - show badge
    licenseBadge.style.display = 'flex';
    badgeTier.textContent = licenseStatus.tier === 'pro' ? 'Pro' : 'Standard';
    badgeTier.className = licenseStatus.tier === 'pro' ? 'badge-tier pro' : 'badge-tier';
    enterLicenseBtn.style.display = 'none';

    // Show/hide sheets button based on tier
    updateSheetsButtonForTier();
  } else if (licenseStatus.status === 'trial' && licenseStatus.trialScrapesRemaining > 0) {
    // Active trial - show banner
    trialBanner.style.display = 'flex';
    trialCount.textContent = licenseStatus.trialScrapesRemaining;
    enterLicenseBtn.style.display = 'block';
  } else {
    // Trial expired or invalid
    trialBanner.style.display = 'none';
    trialEndedSection.style.display = 'block';
    statusSection.style.display = 'none';
    enterLicenseBtn.style.display = 'none';

    // Hide main action buttons when trial ended
    document.querySelector('.button-section').style.display = 'none';
    document.querySelector('.options-section').style.display = 'none';
  }
}

// Update Sheets button based on tier
function updateSheetsButtonForTier() {
  if (licenseStatus.status === 'active' && licenseStatus.tier === 'standard') {
    // Standard tier - disable Sheets and show Pro badge
    exportSheetsBtn.classList.add('disabled-pro');
    exportSheetsBtn.title = 'Google Sheets export is a Pro feature';
  } else {
    exportSheetsBtn.classList.remove('disabled-pro');
    exportSheetsBtn.title = '';
  }
}

// Auto-extract checkbox handler
autoExtractCheckbox.addEventListener('change', async () => {
  autoExtractEmails = autoExtractCheckbox.checked;
  await chrome.storage.local.set({ autoExtractEmails });
  // Update Extract Emails button state based on auto-extract setting
  updateExtractEmailsButtonState();
});

// Helper function to update Extract Emails button state
function updateExtractEmailsButtonState() {
  // If auto-extract is ON, button should be disabled
  // If auto-extract is OFF and we have data, button should be enabled
  if (autoExtractEmails) {
    extractEmailsBtn.disabled = true;
  } else {
    extractEmailsBtn.disabled = scrapedData.length === 0;
  }
}

// Notifications checkbox handler
notificationsCheckbox.addEventListener('change', async () => {
  notificationsEnabled = notificationsCheckbox.checked;
  await chrome.storage.local.set({ notificationsEnabled });
});

// Social search checkbox handler (for no-website businesses)
socialSearchCheckbox.addEventListener('change', async () => {
  socialSearchEnabled = socialSearchCheckbox.checked;
  await chrome.storage.local.set({ socialSearchEnabled });
});

// License activation handlers
upgradeFromBanner.addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://quenitolabs.gumroad.com/l/maps-lead-scraper' });
});

enterLicenseBtn.addEventListener('click', () => {
  licenseModal.style.display = 'flex';
  modalLicenseInput.value = '';
  modalLicenseError.style.display = 'none';
});

closeLicenseModalBtn.addEventListener('click', () => {
  licenseModal.style.display = 'none';
});

cancelLicenseBtn.addEventListener('click', () => {
  licenseModal.style.display = 'none';
});

// Activate license from modal
confirmLicenseBtn.addEventListener('click', async () => {
  const key = modalLicenseInput.value.trim();
  await activateLicense(key, modalLicenseError, confirmLicenseBtn);
});

// Activate license from trial-ended section
activateLicenseBtn.addEventListener('click', async () => {
  const key = licenseKeyInput.value.trim();
  await activateLicense(key, licenseError, activateLicenseBtn);
});

// License activation function
async function activateLicense(licenseKey, errorElement, button) {
  if (!licenseKey) {
    errorElement.textContent = 'Please enter a license key';
    errorElement.style.display = 'block';
    return;
  }

  // Disable button and show loading state
  const originalText = button.textContent;
  button.textContent = 'Activating...';
  button.disabled = true;
  errorElement.style.display = 'none';

  try {
    const result = await chrome.runtime.sendMessage({
      action: 'activateLicense',
      licenseKey: licenseKey
    });

    if (result.success) {
      // Success - reload license status and update UI
      await loadLicenseStatus();
      licenseModal.style.display = 'none';

      // Show success in the main UI
      if (licenseStatus.status === 'active') {
        // Re-show hidden sections
        document.querySelector('.button-section').style.display = 'flex';
        document.querySelector('.options-section').style.display = 'block';
      }
    } else {
      errorElement.textContent = result.error || 'Invalid license key';
      errorElement.style.display = 'block';
    }
  } catch (error) {
    console.error('License activation error:', error);
    errorElement.textContent = 'Error activating license. Please try again.';
    errorElement.style.display = 'block';
  }

  button.textContent = originalText;
  button.disabled = false;
}

// Clear history button handler (duplicate detection)
clearHistoryBtn.addEventListener('click', async () => {
  await chrome.storage.local.set({ scrapedUrlHistory: [] });
  historyCountSpan.textContent = '0';
  clearHistoryBtn.style.display = 'none';
});

// History toggle handler
historyHeader.addEventListener('click', () => {
  const isOpen = historyList.style.display !== 'none';
  historyList.style.display = isOpen ? 'none' : 'block';
  historyToggle.classList.toggle('open', !isOpen);
});

// Clear search history button handler
clearSearchHistoryBtn.addEventListener('click', async () => {
  await chrome.storage.local.set({ searchHistory: [] });
  renderSearchHistory([]);
});

// Toggle fields section visibility
toggleFieldsBtn.addEventListener('click', () => {
  const isHidden = fieldsSection.style.display === 'none';
  fieldsSection.style.display = isHidden ? 'block' : 'none';
  toggleFieldsBtn.textContent = isHidden ? 'Hide Fields' : 'Customize Fields';
});

// Clear results button handler
clearResultsBtn.addEventListener('click', async () => {
  // Clear all scraped data
  scrapedData = [];
  scrapedDataWithEmails = [];
  currentDuplicatesSkipped = 0;

  // Update storage
  await chrome.storage.local.set({
    scrapedData: [],
    scrapedDataWithEmails: [],
    isScrapin: false,
    isExtractingEmails: false
  });

  // Reset UI
  updateLeadCount(0);
  hideEmailSection();
  duplicateStatus.style.display = 'none';
  exportBtn.disabled = true;
  exportSheetsBtn.disabled = true;
  clearResultsBtn.style.display = 'none';
  updateExtractEmailsButtonState();
  updateUI();
});

// Field checkbox handlers
fieldCheckboxes.forEach(checkbox => {
  checkbox.addEventListener('change', async () => {
    const fieldName = checkbox.dataset.field;
    exportFields[fieldName] = checkbox.checked;
    await chrome.storage.local.set({ exportFields });
  });
});

// Google Sheets export handlers
exportSheetsBtn.addEventListener('click', async () => {
  // Check if user can export to Sheets (Pro feature for licensed users)
  const sheetsAccess = await chrome.runtime.sendMessage({ action: 'canExportToSheets' });
  if (!sheetsAccess.allowed) {
    showError(sheetsAccess.reason);
    return;
  }

  // Check if we have a last sheet ID to show append option
  const result = await chrome.storage.local.get(['lastSheetId']);
  if (result.lastSheetId) {
    appendOption.style.display = 'block';
  } else {
    appendOption.style.display = 'none';
  }
  sheetsModal.style.display = 'flex';
});

closeModalBtn.addEventListener('click', () => {
  sheetsModal.style.display = 'none';
  sheetsStatus.style.display = 'none';
});

cancelSheetsBtn.addEventListener('click', () => {
  sheetsModal.style.display = 'none';
  sheetsStatus.style.display = 'none';
});

confirmSheetsBtn.addEventListener('click', async () => {
  const selectedOption = document.querySelector('input[name="sheetsOption"]:checked').value;

  // Show status
  sheetsStatus.style.display = 'block';
  sheetsStatusText.textContent = 'Connecting to Google...';
  confirmSheetsBtn.disabled = true;

  // Get data to export (with field filtering applied)
  const dataToExport = scrapedDataWithEmails.length > 0 ? scrapedDataWithEmails : scrapedData;

  if (dataToExport.length === 0) {
    sheetsStatusText.textContent = 'No data to export';
    confirmSheetsBtn.disabled = false;
    return;
  }

  // Get search query from current tab URL
  let searchQuery = 'Unknown search';
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      searchQuery = extractSearchQuery(tab.url);
    }
  } catch (e) {
    console.warn('Could not get search query:', e);
  }

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'exportToSheets',
      data: dataToExport,
      exportFields: exportFields,
      option: selectedOption,
      searchQuery: searchQuery
    });

    if (response.success) {
      sheetsStatusText.textContent = 'Export complete!';

      // Open the spreadsheet in a new tab
      if (response.spreadsheetUrl) {
        chrome.tabs.create({ url: response.spreadsheetUrl });
      }

      // Close modal after delay
      setTimeout(() => {
        sheetsModal.style.display = 'none';
        sheetsStatus.style.display = 'none';
        confirmSheetsBtn.disabled = false;
      }, 1500);
    } else {
      sheetsStatusText.textContent = response.error || 'Export failed';
      confirmSheetsBtn.disabled = false;
    }
  } catch (error) {
    console.error('Sheets export error:', error);
    sheetsStatusText.textContent = 'Export failed: ' + error.message;
    confirmSheetsBtn.disabled = false;
  }
});

// Extract search query from Google Maps URL
function extractSearchQuery(url) {
  if (!url) return 'Unknown search';
  try {
    const match = url.match(/\/maps\/search\/([^\/\?]+)/);
    if (match) {
      return decodeURIComponent(match[1].replace(/\+/g, ' '));
    }
  } catch (e) {}
  return 'Unknown search';
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Render search history
function renderSearchHistory(history) {
  if (!history || history.length === 0) {
    historyList.innerHTML = '<div class="history-empty">No search history yet</div>';
    clearSearchHistoryBtn.style.display = 'none';
    return;
  }

  // Show last 10 entries, newest first
  const recentHistory = history.slice(-10).reverse();

  historyList.innerHTML = recentHistory.map(item => `
    <div class="history-item">
      <div class="history-query">${escapeHtml(item.query)}</div>
      <div class="history-meta">
        <span>${item.leadsFound} leads</span>
        <span>${item.emailsFound || 0} emails</span>
      </div>
      <div class="history-date">${new Date(item.timestamp).toLocaleDateString()} ${new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
    </div>
  `).join('');

  clearSearchHistoryBtn.style.display = 'block';
}

// Load stored data from chrome.storage
async function loadStoredData() {
  try {
    const result = await chrome.storage.local.get([
      'scrapedData',
      'scrapedDataWithEmails',
      'isScrapin',
      'isExtractingEmails',
      'emailExtractionProgress',
      'autoExtractEmails',
      'exportFields',
      'notificationsEnabled',
      'socialSearchEnabled'
    ]);

    // Load auto-extract preference (default: true)
    if (result.autoExtractEmails !== undefined) {
      autoExtractEmails = result.autoExtractEmails;
      autoExtractCheckbox.checked = autoExtractEmails;
    }

    // Load notifications preference (default: true)
    if (result.notificationsEnabled !== undefined) {
      notificationsEnabled = result.notificationsEnabled;
      notificationsCheckbox.checked = notificationsEnabled;
    }

    // Load social search preference (default: false)
    if (result.socialSearchEnabled !== undefined) {
      socialSearchEnabled = result.socialSearchEnabled;
      socialSearchCheckbox.checked = socialSearchEnabled;
    }

    // Load export field preferences
    if (result.exportFields) {
      exportFields = { ...exportFields, ...result.exportFields };
      // Restore checkbox states
      fieldCheckboxes.forEach(checkbox => {
        const fieldName = checkbox.dataset.field;
        if (fieldName && exportFields[fieldName] !== undefined) {
          checkbox.checked = exportFields[fieldName];
        }
      });
    }

    if (result.scrapedData && result.scrapedData.length > 0) {
      scrapedData = result.scrapedData;
      updateLeadCount(scrapedData.length);
      exportBtn.disabled = false;
      exportSheetsBtn.disabled = false;
      updateExtractEmailsButtonState();
    }
    if (result.scrapedDataWithEmails) {
      scrapedDataWithEmails = result.scrapedDataWithEmails;
    }
    if (result.isScrapin) {
      isScrapin = result.isScrapin;
      updateUI();
    }

    // Restore email extraction progress if it's still running
    if (result.isExtractingEmails && result.emailExtractionProgress) {
      isExtractingEmails = true;
      showEmailSection();
      updateEmailProgress(
        result.emailExtractionProgress.current,
        result.emailExtractionProgress.total,
        result.emailExtractionProgress.businessName
      );
      updateUI();
    }

    // Load URL history count for clear history button
    const historyResult = await chrome.storage.local.get(['scrapedUrlHistory', 'searchHistory']);
    if (historyResult.scrapedUrlHistory && historyResult.scrapedUrlHistory.length > 0) {
      historyCountSpan.textContent = historyResult.scrapedUrlHistory.length;
      clearHistoryBtn.style.display = 'block';
    }

    // Load and render search history
    renderSearchHistory(historyResult.searchHistory);
  } catch (error) {
    console.error('Error loading stored data:', error);
  }
}

// Check if current tab is a valid Google Maps page
async function checkCurrentTabStatus() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.url || !tab.url.includes('google.com/maps')) {
      showError('Please navigate to Google Maps search results');
      startStopBtn.disabled = true;
      return;
    }

    // Request status from content script
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'getStatus' });
      if (response) {
        isScrapin = response.isScrapin;
        if (response.data && response.data.length > 0) {
          scrapedData = response.data;
          updateLeadCount(scrapedData.length);
          exportBtn.disabled = false;
          exportSheetsBtn.disabled = false;
          updateExtractEmailsButtonState();
        }
        updateUI();
      }
    } catch (e) {
      // Content script might not be loaded yet
      console.log('Content script not ready:', e);
    }
  } catch (error) {
    console.error('Error checking tab status:', error);
  }
}

// Update UI based on current state
function updateUI() {
  statusIndicator.className = 'status-indicator';

  if (isScrapin) {
    statusIndicator.classList.add('scraping');
    statusText.textContent = 'Scraping...';
    startStopBtn.textContent = 'Stop';
    startStopBtn.classList.add('active');
    extractEmailsBtn.disabled = true;
  } else if (isExtractingEmails) {
    statusIndicator.classList.add('scraping');
    statusText.textContent = 'Extracting Emails...';
    startStopBtn.disabled = true;
    extractEmailsBtn.disabled = true;
    extractEmailsBtn.classList.add('extracting');
    extractEmailsBtn.textContent = 'Extracting...';
  } else if (scrapedData.length > 0) {
    statusIndicator.classList.add('complete');
    statusText.textContent = 'Complete';
    startStopBtn.textContent = 'Start Scraping';
    startStopBtn.classList.remove('active');
    startStopBtn.disabled = false;
    updateExtractEmailsButtonState();
    extractEmailsBtn.classList.remove('extracting');
    extractEmailsBtn.textContent = 'Extract Emails';
  } else {
    statusIndicator.classList.add('ready');
    statusText.textContent = 'Ready';
    startStopBtn.textContent = 'Start Scraping';
    startStopBtn.classList.remove('active');
    startStopBtn.disabled = false;
  }
}

// Update lead count display
function updateLeadCount(count) {
  leadCount.textContent = count;
  // Show/hide clear results button based on count
  clearResultsBtn.style.display = count > 0 ? 'block' : 'none';
}

// Show error message
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.add('visible');
  statusIndicator.className = 'status-indicator error';
  statusText.textContent = 'Error';
}

// Hide error message
function hideError() {
  errorMessage.classList.remove('visible');
}

// Show email extraction section
function showEmailSection() {
  emailSection.style.display = 'block';
}

// Hide email extraction section
function hideEmailSection() {
  emailSection.style.display = 'none';
}

// Update email extraction progress
function updateEmailProgress(current, total, businessName) {
  emailCount.textContent = `${current}/${total}`;
  const percentage = (current / total) * 100;
  progressFill.style.width = `${percentage}%`;
  currentBusiness.textContent = businessName || '';
}

// Start/Stop button click handler
startStopBtn.addEventListener('click', async () => {
  hideError();

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.url || !tab.url.includes('google.com/maps')) {
      showError('Please navigate to Google Maps search results');
      return;
    }

    if (isScrapin) {
      // Stop scraping
      await chrome.tabs.sendMessage(tab.id, { action: 'stopScraping' });
      isScrapin = false;
      await chrome.storage.local.set({ isScrapin: false });
    } else {
      // Check if user can scrape
      const canScrapeResult = await chrome.runtime.sendMessage({ action: 'canScrape' });
      if (!canScrapeResult.allowed) {
        showError(canScrapeResult.reason);
        // Refresh license UI in case trial just expired
        await loadLicenseStatus();
        return;
      }

      // Decrement trial if applicable
      if (licenseStatus.status === 'trial') {
        const decrementResult = await chrome.runtime.sendMessage({ action: 'decrementTrial' });
        if (!decrementResult.allowed) {
          showError('Your trial has ended. Please purchase a license.');
          await loadLicenseStatus();
          return;
        }
        // Update local state and UI
        licenseStatus.trialScrapesRemaining = decrementResult.remaining;
        trialCount.textContent = decrementResult.remaining;

        // Check if trial just expired
        if (decrementResult.remaining <= 0) {
          licenseStatus.status = 'expired';
        }
      }

      // Start scraping - clear all previous state
      isScrapin = true;
      isExtractingEmails = false;
      scrapedData = [];
      scrapedDataWithEmails = [];
      currentDuplicatesSkipped = 0;
      updateLeadCount(0);
      hideEmailSection();
      duplicateStatus.style.display = 'none';
      await chrome.storage.local.set({
        isScrapin: true,
        isExtractingEmails: false,
        scrapedData: [],
        scrapedDataWithEmails: []
      });
      await chrome.tabs.sendMessage(tab.id, { action: 'startScraping' });
    }

    updateUI();
  } catch (error) {
    console.error('Error toggling scraping:', error);
    showError('Failed to communicate with the page. Try refreshing.');
  }
});

// Start email extraction function (called by button and auto-extract)
async function startEmailExtraction() {
  hideError();

  if (scrapedData.length === 0) {
    showError('No data to extract emails from. Scrape some leads first.');
    return false;
  }

  // Count businesses with websites
  const businessesWithWebsites = scrapedData.filter(b => b.website);
  if (businessesWithWebsites.length === 0) {
    showError('No businesses have websites to extract emails from.');
    return false;
  }

  isExtractingEmails = true;
  await chrome.storage.local.set({ isExtractingEmails: true });

  showEmailSection();
  updateEmailProgress(0, scrapedData.length, 'Starting...');
  updateUI();

  // Send message to service worker to start email extraction
  try {
    chrome.runtime.sendMessage({
      action: 'extractEmails',
      businesses: scrapedData,
      socialSearchEnabled: socialSearchEnabled // v2.1: Enable Google search for no-website businesses
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error sending message:', chrome.runtime.lastError);
        showError('Failed to start email extraction. Try reloading the extension.');
        isExtractingEmails = false;
        updateUI();
      }
    });
    return true;
  } catch (error) {
    console.error('Error starting email extraction:', error);
    showError('Failed to start email extraction.');
    isExtractingEmails = false;
    updateUI();
    return false;
  }
}

// Extract Emails button click handler
extractEmailsBtn.addEventListener('click', async () => {
  await startEmailExtraction();
});

// Export CSV button click handler
exportBtn.addEventListener('click', async () => {
  // Use data with emails if available, otherwise use regular scraped data
  const dataToExport = scrapedDataWithEmails.length > 0 ? scrapedDataWithEmails : scrapedData;

  if (dataToExport.length === 0) {
    showError('No data to export');
    return;
  }

  downloadCSV(dataToExport, 'google-maps-leads.csv');
});

// CSV conversion and download functions
function convertToCSV(data) {
  if (data.length === 0) return '';

  // Check if data has emails
  const hasEmails = data.some(row => row.emails && row.emails.length > 0);

  // All possible headers in order (v2.1: added contactPageUrl, facebookUrl, instagramUrl, linkedinUrl, twitterUrl)
  const allHeaders = hasEmails
    ? ['name', 'email', 'rating', 'reviewCount', 'category', 'address', 'phone', 'website', 'contactPageUrl', 'facebookUrl', 'instagramUrl', 'linkedinUrl', 'twitterUrl', 'googleMapsUrl']
    : ['name', 'rating', 'reviewCount', 'category', 'address', 'phone', 'website', 'contactPageUrl', 'facebookUrl', 'instagramUrl', 'linkedinUrl', 'twitterUrl', 'googleMapsUrl'];

  // Filter headers based on exportFields selection (name is always included)
  const headers = allHeaders.filter(header => {
    if (header === 'name') return true; // Always include name
    return exportFields[header] !== false;
  });

  const escapeField = (field) => {
    if (field === null || field === undefined) return '';
    const str = String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };

  const headerRow = headers.join(',');
  const dataRows = data.map(row => {
    // If row has emails, join them with semicolon
    const email = row.emails && row.emails.length > 0 ? row.emails.join('; ') : '';

    return headers.map(header => {
      if (header === 'email') {
        return escapeField(email);
      }
      return escapeField(row[header]);
    }).join(',');
  });

  return [headerRow, ...dataRows].join('\n');
}

function downloadCSV(data, filename) {
  const csv = convertToCSV(data);
  const BOM = '\uFEFF'; // UTF-8 BOM for Excel
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

// Listen for messages from content script and service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'progress') {
    // Scraping progress
    updateLeadCount(message.count);
    if (message.data) {
      scrapedData = message.data;
      chrome.storage.local.set({ scrapedData: message.data });
      if (message.data.length > 0) {
        exportBtn.disabled = false;
        exportSheetsBtn.disabled = false;
        updateExtractEmailsButtonState();
      }
    }
    // Show duplicates skipped
    if (message.duplicatesSkipped && message.duplicatesSkipped > 0) {
      currentDuplicatesSkipped = message.duplicatesSkipped;
      duplicateCount.textContent = currentDuplicatesSkipped;
      duplicateStatus.style.display = 'block';
    }
  } else if (message.type === 'complete') {
    // Scraping complete
    isScrapin = false;
    scrapedData = message.data || [];
    updateLeadCount(scrapedData.length);
    chrome.storage.local.set({ isScrapin: false, scrapedData: scrapedData });
    exportBtn.disabled = scrapedData.length === 0;
    exportSheetsBtn.disabled = scrapedData.length === 0;
    updateExtractEmailsButtonState();

    // Refresh license UI (in case trial just expired after this scrape)
    // Wrapped in try-catch to prevent blocking auto-extract
    try {
      loadLicenseStatus();
    } catch (e) {
      console.error('Error refreshing license status:', e);
    }

    // Show final duplicates count if any
    if (message.duplicatesSkipped && message.duplicatesSkipped > 0) {
      currentDuplicatesSkipped = message.duplicatesSkipped;
      duplicateCount.textContent = currentDuplicatesSkipped;
      duplicateStatus.style.display = 'block';
    }

    // Update history count (new URLs were saved by content script)
    chrome.storage.local.get(['scrapedUrlHistory'], (result) => {
      if (result.scrapedUrlHistory && result.scrapedUrlHistory.length > 0) {
        historyCountSpan.textContent = result.scrapedUrlHistory.length;
        clearHistoryBtn.style.display = 'block';
      }
    });

    // Log search to history
    (async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const historyEntry = {
          query: extractSearchQuery(tab?.url),
          timestamp: Date.now(),
          leadsFound: scrapedData.length,
          emailsFound: 0
        };

        const result = await chrome.storage.local.get(['searchHistory']);
        const history = result.searchHistory || [];
        history.push(historyEntry);

        // Keep last 50 entries
        const trimmedHistory = history.slice(-50);
        await chrome.storage.local.set({
          searchHistory: trimmedHistory,
          lastSearchHistoryIndex: trimmedHistory.length - 1
        });

        renderSearchHistory(trimmedHistory);
      } catch (error) {
        console.error('Error logging search history:', error);
      }
    })();

    updateUI();

    // Auto-trigger email extraction if enabled and data has websites
    // Note: Scraping-complete notifications are now handled by the service worker
    console.log('[AutoExtract] Checking conditions:', { autoExtractEmails, dataLength: scrapedData.length });
    if (autoExtractEmails && scrapedData.length > 0) {
      const hasWebsites = scrapedData.some(b => b.website);
      console.log('[AutoExtract] Has websites:', hasWebsites);
      if (hasWebsites) {
        // Small delay to let UI update, then trigger email extraction directly
        console.log('[AutoExtract] Starting email extraction in 500ms...');
        setTimeout(async () => {
          console.log('[AutoExtract] Triggering startEmailExtraction()');
          await startEmailExtraction();
        }, 500);
      }
      // If no websites, service worker will send notification
    } else if (scrapedData.length > 0) {
      // Auto-extract is OFF, show message in email section
      // Service worker handles the notification
      showEmailSection();
      emailStatus.textContent = 'Ready to export or extract emails';
      emailCount.textContent = `${scrapedData.length} leads`;
      progressFill.style.width = '100%';
      currentBusiness.textContent = 'Click "Extract Emails" or export your results';
    }
  } else if (message.type === 'error') {
    // Error during scraping
    isScrapin = false;
    chrome.storage.local.set({ isScrapin: false });
    showError(message.message);
    updateUI();
  } else if (message.type === 'emailProgress') {
    // Email extraction progress
    updateEmailProgress(message.current, message.total, message.businessName);
  } else if (message.type === 'emailComplete') {
    // Email extraction complete
    isExtractingEmails = false;
    scrapedDataWithEmails = message.data || [];
    chrome.storage.local.set({ isExtractingEmails: false, scrapedDataWithEmails: scrapedDataWithEmails });

    // Count emails found
    const emailsFound = scrapedDataWithEmails.filter(b => b.emails && b.emails.length > 0).length;
    emailStatus.textContent = `Done! Found emails for ${emailsFound} businesses`;
    currentBusiness.textContent = '';

    // Update last search history entry with email count
    (async () => {
      try {
        const result = await chrome.storage.local.get(['searchHistory', 'lastSearchHistoryIndex']);
        if (result.searchHistory && result.lastSearchHistoryIndex !== undefined) {
          const history = result.searchHistory;
          if (history[result.lastSearchHistoryIndex]) {
            history[result.lastSearchHistoryIndex].emailsFound = emailsFound;
            await chrome.storage.local.set({ searchHistory: history });
            renderSearchHistory(history);
          }
        }
      } catch (error) {
        console.error('Error updating search history with emails:', error);
      }
    })();

    updateUI();
    // Note: Email extraction complete notification is sent by the service worker
  }
});
