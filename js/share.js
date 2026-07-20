/**
 * share.js
 * Encodes a deal's inputs into the URL hash so a link can be shared with no
 * backend involved. Whoever opens the link gets the calculator pre-filled
 * with the same numbers.
 */
const Share = (function () {
  function encode(inputs) {
    try {
      return btoa(encodeURIComponent(JSON.stringify(inputs)));
    } catch (e) {
      return '';
    }
  }

  function decode(str) {
    try {
      return JSON.parse(decodeURIComponent(atob(str)));
    } catch (e) {
      return null;
    }
  }

  function buildShareUrl(inputs) {
    const base = location.origin + location.pathname;
    return base + '#deal=' + encode(inputs);
  }

  function readFromHash() {
    const m = location.hash.match(/deal=([^&]+)/);
    if (!m) return null;
    return decode(decodeURIComponent(m[1]));
  }

  return { encode, decode, buildShareUrl, readFromHash };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Share;
}
