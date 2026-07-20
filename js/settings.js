/**
 * settings.js
 * Configurable screening thresholds (cap rate / cash-on-cash / DSCR targets),
 * persisted per-browser in localStorage. Everything that used to hardcode
 * 6% / 8% / 1.25x should read from Settings.get() instead.
 */
const Settings = (function () {
  const KEY = 're-deal-analyzer:settings:v1';
  const DEFAULTS = { capRateTarget: 6, cocTarget: 8, dscrTarget: 1.25 };

  function get() {
    try {
      const stored = JSON.parse(localStorage.getItem(KEY));
      return { ...DEFAULTS, ...(stored || {}) };
    } catch (e) {
      return { ...DEFAULTS };
    }
  }

  function save(partial) {
    const merged = { ...get(), ...partial };
    localStorage.setItem(KEY, JSON.stringify(merged));
    return merged;
  }

  function reset() {
    localStorage.removeItem(KEY);
    return { ...DEFAULTS };
  }

  return { get, save, reset, DEFAULTS };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Settings;
}
