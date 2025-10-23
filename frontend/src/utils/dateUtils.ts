/**
 * Converts a date string from YYYY-MM-DD format to ISO format while preserving the local date
 * This prevents timezone issues where dates shift by one day
 * 
 * @param dateString - Date string in YYYY-MM-DD format (from <input type="date">)
 * @returns ISO formatted date string that will be correctly interpreted by the backend
 */
export function dateInputToISO(dateString: string | undefined): string | undefined {
  if (!dateString || dateString.trim() === '') {
    return undefined;
  }
  
  // Parse the date components
  const [year, month, day] = dateString.split('-').map(Number);
  
  // Validate the date components
  if (!year || !month || !day) {
    return undefined;
  }
  
  // Return the date in YYYY-MM-DD format directly, without any timezone conversion
  // This preserves the exact date the user entered
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Converts an ISO date string to YYYY-MM-DD format for <input type="date">
 * Handles timezone issues by parsing as UTC date
 * 
 * @param isoDateString - ISO formatted date string from backend
 * @returns Date string in YYYY-MM-DD format
 */
export function isoToDateInput(isoDateString: string | undefined): string {
  if (!isoDateString) {
    return '';
  }
  
  // If it's just a date string (YYYY-MM-DD), validate and return as is
  if (!isoDateString.includes('T') && !isoDateString.includes(' ')) {
    // Validate it's a proper date format
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (datePattern.test(isoDateString)) {
      return isoDateString;
    }
  }
  
  // For ISO strings with time (e.g., "1990-03-25T00:00:00Z"), parse as UTC
  // Using Date.UTC to avoid timezone conversion issues
  const dateStr = isoDateString.replace('Z', '').replace(' ', 'T');
  const [datePart] = dateStr.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  
  // Validate the parsed components
  if (!year || !month || !day) {
    return '';
  }
  
  // Return the date components directly without creating a Date object
  // This avoids any timezone conversion
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}



