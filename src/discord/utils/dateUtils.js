/**
 * Utility functions for date operations
 */

/**
 * Get the start of the day for a given date
 * @param {Date} date - Date to get start of day for
 * @returns {Date} - Start of day
 */
function getStartOfDay(date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay;
}

/**
 * Get the end of the day for a given date
 * @param {Date} date - Date to get end of day for
 * @returns {Date} - End of day
 */
function getEndOfDay(date) {
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
}

/**
 * Get the start of the week for a given date (Sunday)
 * @param {Date} date - Date to get start of week for
 * @returns {Date} - Start of week
 */
function getStartOfWeek(date) {
  const startOfWeek = new Date(date);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek;
}

/**
 * Get the end of the week for a given date (Saturday)
 * @param {Date} date - Date to get end of week for
 * @returns {Date} - End of week
 */
function getEndOfWeek(date) {
  const endOfWeek = new Date(date);
  endOfWeek.setDate(endOfWeek.getDate() + (6 - endOfWeek.getDay()));
  endOfWeek.setHours(23, 59, 59, 999);
  return endOfWeek;
}

/**
 * Get the start of the month for a given date
 * @param {Date} date - Date to get start of month for
 * @returns {Date} - Start of month
 */
function getStartOfMonth(date) {
  const startOfMonth = new Date(date);
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  return startOfMonth;
}

/**
 * Get the end of the month for a given date
 * @param {Date} date - Date to get end of month for
 * @returns {Date} - End of month
 */
function getEndOfMonth(date) {
  const endOfMonth = new Date(date);
  endOfMonth.setMonth(endOfMonth.getMonth() + 1);
  endOfMonth.setDate(0);
  endOfMonth.setHours(23, 59, 59, 999);
  return endOfMonth;
}

/**
 * Format a date to a readable string
 * @param {Date} date - Date to format
 * @param {Object} options - Format options
 * @returns {string} - Formatted date string
 */
function formatDate(date, options = {}) {
  const defaultOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  return date.toLocaleDateString('en-US', { ...defaultOptions, ...options });
}

/**
 * Format a time to a readable string
 * @param {Date} date - Date to format
 * @param {Object} options - Format options
 * @returns {string} - Formatted time string
 */
function formatTime(date, options = {}) {
  const defaultOptions = {
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return date.toLocaleTimeString('en-US', { ...defaultOptions, ...options });
}

/**
 * Check if a date is today
 * @param {Date} date - Date to check
 * @returns {boolean} - Whether the date is today
 */
function isToday(date) {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
}

/**
 * Check if a date is in the past
 * @param {Date} date - Date to check
 * @returns {boolean} - Whether the date is in the past
 */
function isPast(date) {
  return date < new Date();
}

/**
 * Get a relative time string (e.g., "2 hours ago", "in 3 days")
 * @param {Date} date - Date to get relative time for
 * @returns {string} - Relative time string
 */
function getRelativeTimeString(date) {
  const now = new Date();
  const diffMs = date - now;
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);

  if (diffSec < 0) {
    // Past
    if (diffSec > -60) return `${Math.abs(diffSec)} seconds ago`;
    if (diffMin > -60) return `${Math.abs(diffMin)} minutes ago`;
    if (diffHour > -24) return `${Math.abs(diffHour)} hours ago`;
    if (diffDay > -30) return `${Math.abs(diffDay)} days ago`;
    return formatDate(date);
  } else {
    // Future
    if (diffSec < 60) return `in ${diffSec} seconds`;
    if (diffMin < 60) return `in ${diffMin} minutes`;
    if (diffHour < 24) return `in ${diffHour} hours`;
    if (diffDay < 30) return `in ${diffDay} days`;
    return formatDate(date);
  }
}

module.exports = {
  getStartOfDay,
  getEndOfDay,
  getStartOfWeek,
  getEndOfWeek,
  getStartOfMonth,
  getEndOfMonth,
  formatDate,
  formatTime,
  isToday,
  isPast,
  getRelativeTimeString
};
