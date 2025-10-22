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
  
  // Parse the date as local time (noon to avoid any DST issues)
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  
  // Return just the date part in YYYY-MM-DD format
  // This ensures the backend receives the correct date regardless of timezone
  return date.toISOString().split('T')[0];
}

/**
 * Converts an ISO date string to YYYY-MM-DD format for <input type="date">
 * 
 * @param isoDateString - ISO formatted date string from backend
 * @returns Date string in YYYY-MM-DD format
 */
export function isoToDateInput(isoDateString: string | undefined): string {
  if (!isoDateString) {
    return '';
  }
  
  // Extract just the date part, ignoring time and timezone
  return isoDateString.split('T')[0];
}

