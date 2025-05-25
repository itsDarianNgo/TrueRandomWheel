// src/core/utils/timeUtils.js

/**
 * Formats a timestamp into a user-friendly relative time string.
 * e.g., "just now", "5m ago", "1h ago", "yesterday", "dd/mm/yyyy".
 * @param {number} timestamp - The timestamp (milliseconds since epoch).
 * @returns {string} A string representing the relative time.
 */
export const formatRelativeTime = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;

    // Handle potential future timestamps or very close "now" gracefully
    if (diff < 0) {
        // This case should ideally not happen if timestamps are generated with Date.now()
        // but as a safeguard:
        return "just now";
    }

    const seconds = Math.round(diff / 1000);

    if (seconds < 5) return "just now";
    if (seconds < 60) return `${seconds}s ago`;

    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.round(hours / 24);
    if (days === 1) return "yesterday";
    if (days < 7) return `${days}d ago`;

    // For older than a week, show date in a simple format
    const date = new Date(timestamp);
    // Using toLocaleDateString for internationalization-friendly date format
    return date.toLocaleDateString(undefined, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};