const { createRunner, makeLocalStorage } = require('./helpers');
global.localStorage = makeLocalStorage(); // settings.js expects the browser localStorage API
const Settings = require('../js/settings.js');
const { test, assertClose, done } = createRunner('test-settings.js');

test('get: returns defaults when nothing has been saved', () => {
  localStorage.clear();
  const s = Settings.get();
  assertClose(s.capRateTarget, 6, 0);
  assertClose(s.cocTarget, 8, 0);
  assertClose(s.dscrTarget, 1.25, 0);
});

test('save: persists a partial update merged with existing values', () => {
  localStorage.clear();
  Settings.save({ capRateTarget: 7 });
  const s = Settings.get();
  assertClose(s.capRateTarget, 7, 0);
  assertClose(s.cocTarget, 8, 0); // untouched value stays at default
});

test('reset: clears saved settings back to defaults', () => {
  localStorage.clear();
  Settings.save({ capRateTarget: 10, dscrTarget: 2 });
  Settings.reset();
  const s = Settings.get();
  assertClose(s.capRateTarget, 6, 0);
  assertClose(s.dscrTarget, 1.25, 0);
});

done();
