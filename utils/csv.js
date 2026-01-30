// CSV Utility Functions for Google Maps Lead Scraper

/**
 * Convert an array of objects to CSV string
 * @param {Array<Object>} data - Array of objects to convert
 * @param {Array<string>} headers - Optional array of headers (uses object keys if not provided)
 * @returns {string} CSV formatted string
 */
function convertToCSV(data, headers = null) {
  if (!data || data.length === 0) {
    return '';
  }

  // Use provided headers or extract from first object
  const csvHeaders = headers || Object.keys(data[0]);

  /**
   * Escape a field value for CSV
   * - Wraps in quotes if contains comma, quote, or newline
   * - Escapes internal quotes by doubling them
   */
  const escapeField = (field) => {
    if (field === null || field === undefined) {
      return '';
    }

    const str = String(field);

    // Check if escaping is needed
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      // Escape quotes by doubling them and wrap in quotes
      return '"' + str.replace(/"/g, '""') + '"';
    }

    return str;
  };

  // Build header row
  const headerRow = csvHeaders.map(h => escapeField(h)).join(',');

  // Build data rows
  const dataRows = data.map(row => {
    return csvHeaders.map(header => escapeField(row[header])).join(',');
  });

  // Combine header and data rows
  return [headerRow, ...dataRows].join('\n');
}

/**
 * Trigger a CSV file download in the browser
 * @param {Array<Object>} data - Array of objects to download as CSV
 * @param {string} filename - Name for the downloaded file
 * @param {Array<string>} headers - Optional array of headers
 */
function downloadCSV(data, filename = 'export.csv', headers = null) {
  const csv = convertToCSV(data, headers);

  // Create blob with BOM for Excel compatibility
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });

  // Create download URL
  const url = URL.createObjectURL(blob);

  // Create temporary link element
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  // Append to body, click, and clean up
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Revoke the URL to free memory
  URL.revokeObjectURL(url);
}

/**
 * Parse a CSV string into an array of objects
 * @param {string} csvString - CSV formatted string
 * @param {boolean} hasHeaders - Whether first row contains headers
 * @returns {Array<Object>} Array of objects
 */
function parseCSV(csvString, hasHeaders = true) {
  const lines = csvString.split(/\r?\n/);
  const result = [];

  if (lines.length === 0) {
    return result;
  }

  // Simple CSV parsing (doesn't handle all edge cases)
  const parseLine = (line) => {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (inQuotes) {
        if (char === '"') {
          if (line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          current += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ',') {
          values.push(current);
          current = '';
        } else {
          current += char;
        }
      }
    }

    values.push(current);
    return values;
  };

  const headers = hasHeaders ? parseLine(lines[0]) : null;
  const startIndex = hasHeaders ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    if (lines[i].trim() === '') continue;

    const values = parseLine(lines[i]);

    if (hasHeaders && headers) {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      result.push(obj);
    } else {
      result.push(values);
    }
  }

  return result;
}

// Export functions for use as module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { convertToCSV, downloadCSV, parseCSV };
}
