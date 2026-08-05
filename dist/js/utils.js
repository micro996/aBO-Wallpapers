/* ============================================================
   Wallpaper App — Utility Helpers
   ============================================================
   Pure utility functions with no DOM or state dependencies.
   ============================================================ */

'use strict';

/**
 * Creates a debounced version of a function.
 * @param {Function} fn - Function to debounce.
 * @param {number} delay - Delay in milliseconds.
 * @returns {Function} Debounced function.
 */
function debounce(fn, delay = 300) {
  let timerId = null;
  return function (...args) {
    clearTimeout(timerId);
    timerId = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Sanitizes a string for safe insertion into the DOM.
 * Prevents XSS by escaping HTML entities.
 * @param {string} str - Raw string.
 * @returns {string} Escaped string.
 */
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Generates a safe filename from a title string.
 * @param {string} title - Wallpaper title.
 * @param {string} [ext='jpg'] - File extension.
 * @returns {string} Sanitized filename.
 */
function toFilename(title, ext = 'jpg') {
  return title.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '') + '.' + ext;
}

/**
 * Formats a number with K/M suffixes.
 * @param {number} num
 * @returns {string}
 */
function formatCount(num) {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
  return String(num);
}

/**
 * Returns a human-readable date string.
 * @param {string|Date} date
 * @returns {string}
 */
function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
