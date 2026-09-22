/**
 * js/utils.js — Asmara Hotel Shared Frontend Utilities
 *
 * Loaded before other scripts that depend on these helpers.
 * Exposes a global `window.AsmaraUtils` object.
 */

(function () {
    'use strict';

    /**
     * Escape a string for safe insertion into HTML text content.
     * Prevents XSS when rendering user-supplied strings with innerHTML.
     * @param {*} str
     * @returns {string}
     */
    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * Escape a string for safe insertion into an HTML attribute value.
     * Strips single-quotes (used in inline event handler strings like onclick).
     * @param {*} str
     * @returns {string}
     */
    function escapeAttr(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '')        // strip single-quotes — used in onclick handlers
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    /**
     * Format a number as a Kenyan Shilling amount string.
     * e.g. 1234.5 → "KES 1,235"
     * @param {number} amount
     * @returns {string}
     */
    function formatKES(amount) {
        return `KES ${parseFloat(amount || 0).toLocaleString()}`;
    }

    /**
     * Safely parse a JSON column that may already be an object (PostgreSQL)
     * or a raw JSON string (MySQL).
     * @param {string|object} value
     * @returns {*}
     */
    function parseJsonColumn(value) {
        if (value === null || value === undefined) return null;
        if (typeof value === 'object') return value;
        try {
            return JSON.parse(value);
        } catch (e) {
            return null;
        }
    }

    // Expose as a global namespace
    window.AsmaraUtils = {
        escapeHtml,
        escapeAttr,
        formatKES,
        parseJsonColumn
    };
})();
