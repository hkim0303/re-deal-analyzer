/**
 * storage.js
 * Thin wrapper around localStorage for saved deals ("your portfolio").
 * Everything lives client-side in the browser — there's no backend/server
 * on a static GitHub Pages site, so saved deals are per-browser, not synced
 * across devices. See ROADMAP.md for cloud sync as a future feature.
 */
const Storage = (function () {
  const KEY = 're-deal-analyzer:saved-deals:v1';

  function getAll() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn('Storage.getAll failed, resetting.', e);
      return [];
    }
  }

  function saveAll(deals) {
    localStorage.setItem(KEY, JSON.stringify(deals));
  }

  // deal: { id?, nickname, inputs, savedAt? }
  function save(deal) {
    const all = getAll();
    const record = {
      id: deal.id || ('deal_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7)),
      nickname: deal.nickname || 'Untitled Deal',
      inputs: deal.inputs,
      savedAt: deal.savedAt || new Date().toISOString()
    };
    const idx = all.findIndex(d => d.id === record.id);
    if (idx >= 0) {
      all[idx] = record;
    } else {
      all.push(record);
    }
    saveAll(all);
    return record.id;
  }

  function remove(id) {
    saveAll(getAll().filter(d => d.id !== id));
  }

  function get(id) {
    return getAll().find(d => d.id === id) || null;
  }

  return { getAll, save, remove, get };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Storage;
}
